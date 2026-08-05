import { Op, fn, col } from 'sequelize';
import Venda from '../models/Venda.js';
import Despesa from '../models/Despesa.js';
import Produto from '../models/Produto.js';
import Cliente from '../models/Cliente.js'; // 🟢 Importação agrupada corretamente no topo

export const exibirFluxo = async (req, res) => {
    try {
        const periodo = req.query.periodo || 'total';
        const mesSelecionado = req.query.mes !== undefined ? parseInt(req.query.mes) : new Date().getMonth();
        const anoSelecionado = req.query.ano !== undefined ? parseInt(req.query.ano) : new Date().getFullYear();

        let whereVendas = {};
        let whereDespesas = { categoria: { [Op.ne]: 'Mercadoria' } };

        if (periodo === 'mes') {
            const inicioMes = new Date(anoSelecionado, mesSelecionado, 1);
            const fimMes = new Date(anoSelecionado, mesSelecionado + 1, 0, 23, 59, 59);
            whereVendas.data_venda = { [Op.between]: [inicioMes, fimMes] };
            whereDespesas.data_despesa = { [Op.between]: [inicioMes, fimMes] };
        } else if (periodo === 'trimestre') {
            const inicioTrimestreMes = Math.floor(mesSelecionado / 3) * 3;
            const inicioTrimestre = new Date(anoSelecionado, inicioTrimestreMes, 1);
            const fimTrimestre = new Date(anoSelecionado, inicioTrimestreMes + 3, 0, 23, 59, 59);
            whereVendas.data_venda = { [Op.between]: [inicioTrimestre, fimTrimestre] };
            whereDespesas.data_despesa = { [Op.between]: [inicioTrimestre, fimTrimestre] };
        } else if (periodo === 'ano') {
            const inicioAno = new Date(anoSelecionado, 0, 1);
            const fimAno = new Date(anoSelecionado, 11, 31, 23, 59, 59);
            whereVendas.data_venda = { [Op.between]: [inicioAno, fimAno] };
            whereDespesas.data_despesa = { [Op.between]: [inicioAno, fimAno] };
        }

        const vendas = await Venda.findAll({
            where: whereVendas,
            include: [{ model: Produto, as: 'produto' }],
            order: [['data_venda', 'DESC']]
        });

        const despesas = await Despesa.findAll({
            where: whereDespesas,
            order: [['data_despesa', 'DESC']]
        });

        // 🟢 Buscando clientes para o cálculo do Fiado
        const clientes = await Cliente.findAll();

        let totalReceitas = 0;
        let totalCustosProdutos = 0;
        let totalDespesas = 0;

        // Tratamento da tabela para as Views e soma de Custos/Receitas
        const vendasTratadas = vendas.map(venda => {
            const valorVenda = parseFloat(venda.valor_total) || 0;
            const custoProduto = venda.produto ? parseFloat(venda.produto.custo) : 0;
            const lucroBrutoItem = valorVenda - custoProduto;
            
            totalReceitas += valorVenda;
            totalCustosProdutos += custoProduto;

            return {
                ...venda.toJSON(),
                custo_produto: custoProduto,
                lucro_bruto: lucroBrutoItem
            };
        });

        despesas.forEach(d => {
            totalDespesas += parseFloat(d.valor) || 0;
        });

        // 🟢 CÁLCULO INTELIGENTE VERSÃO 2.0
        // 1. Soma o saldo devedor real de todos os clientes
        let totalFiado = 0;
        clientes.forEach(c => totalFiado += parseFloat(c.saldo_devedor) || 0);

        // 2. O Caixa Real é a Receita Bruta menos o que ainda não foi pago (Fiado)
        let totalRecebidoCaixa = totalReceitas - totalFiado;

        // 3. Lucro Real é o dinheiro em caixa menos as saídas de estoque e despesas
        const totalSaidas = totalCustosProdutos + totalDespesas;
        const lucroLiquidoReal = totalRecebidoCaixa - totalSaidas;

        res.render('fluxo-caixa', {
            layout: 'interno',
            title: 'Fluxo de Caixa',
            activePage: 'fluxo-caixa',
            vendas: vendasTratadas,
            despesas: despesas.map(d => d.toJSON()),
            
            totalReceitas,
            totalFiado,
            totalRecebidoCaixa,
            totalSaidas,
            lucroLiquidoReal,

            periodoSelecionado: periodo,
            mesSelecionado,
            anoSelecionado,
            sucesso: req.query.sucesso,
            erro: req.query.erro
        });
    } catch (erro) {
        console.error('Erro ao carregar fluxo de caixa:', erro);
        return res.redirect('/painel?erro=Erro ao carregar o fluxo de caixa.');
    }
};

export const adicionarDespesa = async (req, res) => {
    try {
        const { descricao, categoria, valor } = req.body;
        await Despesa.create({
            descricao,
            categoria,
            valor: parseFloat(valor),
            data_despesa: new Date()
        });

        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.json({ sucesso: true });
        }
        return res.redirect('/fluxo-caixa?sucesso=Despesa registrada com sucesso!');
    } catch (erro) {
        console.error('Erro ao registrar despesa:', erro);
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.status(500).json({ erro: 'Erro ao registrar despesa.' });
        }
        return res.redirect('/fluxo-caixa?erro=Erro ao registrar despesa.');
    }
};

export const renderEditarDespesa = async (req, res) => {
    try {
        const despesa = await Despesa.findByPk(req.params.id);
        if (!despesa) return res.redirect('/fluxo-caixa?erro=Despesa não encontrada.');
        
        return res.render('editar-despesa', {
            layout: 'interno',
            title: 'Editar Despesa',
            activePage: 'fluxo-caixa',
            despesa,
            erro: req.query.erro
        });
    } catch (erro) {
        console.error('Erro ao carregar despesa:', erro);
        return res.redirect('/fluxo-caixa?erro=Erro ao carregar despesa.');
    }
};

export const atualizarDespesa = async (req, res) => {
    try {
        const despesa = await Despesa.findByPk(req.params.id);
        if (!despesa) return res.redirect('/fluxo-caixa?erro=Despesa não encontrada.');

        const { descricao, categoria, valor } = req.body;
        despesa.descricao = descricao;
        despesa.categoria = categoria;
        despesa.valor = parseFloat(valor);
        await despesa.save();

        return res.redirect('/fluxo-caixa?sucesso=Despesa atualizada com sucesso!');
    } catch (erro) {
        console.error('Erro ao atualizar despesa:', erro);
        return res.redirect(`/fluxo-caixa/despesa/editar/${req.params.id}?erro=Erro ao atualizar despesa.`);
    }
};

export const excluirDespesa = async (req, res) => {
    try {
        const despesa = await Despesa.findByPk(req.params.id);
        if (!despesa) return res.redirect('/fluxo-caixa?erro=Despesa não encontrada.');

        await despesa.destroy();
        return res.redirect('/fluxo-caixa?sucesso=Despesa excluída com sucesso!');
    } catch (erro) {
        console.error('Erro ao excluir despesa:', erro);
        return res.redirect('/fluxo-caixa?erro=Erro ao excluir despesa.');
    }
};

export const apiGraficoFluxo = async (req, res) => {
    try {
        const periodo = req.query.periodo || 'total';
        const mesSelecionado = req.query.mes !== undefined ? parseInt(req.query.mes) : new Date().getMonth();
        const anoSelecionado = req.query.ano !== undefined ? parseInt(req.query.ano) : new Date().getFullYear();

        let whereVendas = {};
        let whereDespesas = { categoria: { [Op.ne]: 'Mercadoria' } };

        if (periodo === 'mes') {
            const inicioMes = new Date(anoSelecionado, mesSelecionado, 1);
            const fimMes = new Date(anoSelecionado, mesSelecionado + 1, 0, 23, 59, 59);
            whereVendas.data_venda = { [Op.between]: [inicioMes, fimMes] };
            whereDespesas.data_despesa = { [Op.between]: [inicioMes, fimMes] };
        } // Se desejar adicionar as outras lógicas de período aqui depois, basta copiar do exibirFluxo.

        const vendas = await Venda.findAll({
            where: whereVendas,
            include: [{ model: Produto, as: 'produto' }]
        });
        const despesas = await Despesa.findAll({ where: whereDespesas });

        let receitas = 0;
        let custos = 0;
        let gastos = 0;

        vendas.forEach(v => {
            receitas += parseFloat(v.valor_total) || 0;
            if (v.produto) custos += parseFloat(v.produto.custo) || 0;
        });

        despesas.forEach(d => {
            gastos += parseFloat(d.valor) || 0;
        });

        const lucro = receitas - custos - gastos;

        return res.json({
            labels: ['Receita Total', 'Custo das Mercadorias', 'Despesas (Saídas)', 'Lucro Líquido'],
            valores: [receitas, custos, gastos, lucro]
        });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao gerar gráfico' });
    }
};