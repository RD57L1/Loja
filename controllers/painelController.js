import { Op, fn, col } from 'sequelize';
import Venda from '../models/Venda.js';
import Produto from '../models/Produto.js';
import Cliente from '../models/Cliente.js'; 

export const renderPainel = async (req, res) => {
    try {
        const inicioDoDia = new Date();
        inicioDoDia.setHours(0, 0, 0, 0);

        // 1. Faturamento de Hoje (Somando a coluna valor_total de Vendas de hoje)
        const faturamentoHoje = await Venda.sum('valor_total', {
            where: {
                data_venda: {
                    [Op.gte]: inicioDoDia
                }
            }
        }) || 0;

        // 2. A Receber / Fiado (Somando o saldo_devedor de todos os clientes)
        let totalFiadoPendente = 0;
        try {
            totalFiadoPendente = await Cliente.sum('saldo_devedor') || 0;
        } catch (e) {
            console.warn("Aviso: Tabela Cliente pode não estar sincronizada ainda.");
        }

        // 3. Alertas de Estoque (Produtos com 2 ou menos unidades)
        const produtosEsgotando = await Produto.count({
            where: {
                quantidade: { [Op.lte]: 2 },
                status: 'disponivel'
            }
        });

        // 4. Últimas Vendas / Tendências (Para alimentar a lista de peças mais vendidas)
        const ultimasVendas = await Venda.findAll({
            include: [{
                model: Produto,
                as: 'produto', 
                attributes: ['descricao', 'tipo']
            }],
            order: [['data_venda', 'DESC']],
            limit: 5
        });

        const topProdutos = ultimasVendas.map(v => ({
            descricao: v.produto ? v.produto.descricao : 'Produto não encontrado',
            tamanho: v.produto ? v.produto.tipo : '-', 
            codigo: v.codigo_produto,
            quantidade_vendida: '1x' 
        }));

        return res.render('painel', {
            layout: 'interno',
            title: 'Painel de Controle',
            activePage: 'painel',
            // Formatando para garantir que sempre exiba 2 casas decimais (ex: 225,00)
            faturamentoHoje: faturamentoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalFiadoPendente: totalFiadoPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            produtosEsgotando,
            topProdutos
        });

    } catch (erro) {
        console.error('Erro ao carregar o painel:', erro);
        return res.render('painel', {
            layout: 'interno',
            title: 'Painel de Controle',
            activePage: 'painel',
            erro: 'Não foi possível carregar as métricas do painel.'
        });
    }
};

// 📈 Dados do gráfico "Faturamento Bruto" do painel (usado pelo Chart.js)
// Este endpoint não existia no projeto original — o <canvas id="graficoVendas">
// não tinha nenhuma fonte de dados. Foi adicionado para o gráfico funcionar,
// sem alterar nenhum dos cálculos dos cards acima.
export const apiGraficoVendas = async (req, res) => {
    try {
        const periodo = req.query.periodo || 'semana';
        const hoje = new Date();
        const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        let labels = [];
        let valores = [];

        if (periodo === 'semana' || periodo === 'mes') {
            // Agrupa por dia (últimos 7 dias OU dias do mês corrente)
            let dataInicial;
            if (periodo === 'semana') {
                dataInicial = new Date(hoje);
                dataInicial.setDate(hoje.getDate() - 6);
                dataInicial.setHours(0, 0, 0, 0);
            } else {
                dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            }

            const vendasAgrupadas = await Venda.findAll({
                attributes: [
                    [fn('DATE', col('data_venda')), 'dia'],
                    [fn('SUM', col('valor_total')), 'total']
                ],
                where: { data_venda: { [Op.gte]: dataInicial } },
                group: [fn('DATE', col('data_venda'))],
                raw: true
            });

            const mapaTotais = {};
            vendasAgrupadas.forEach(v => {
                const chave = new Date(v.dia).toISOString().slice(0, 10);
                mapaTotais[chave] = parseFloat(v.total) || 0;
            });

            const diaFinal = periodo === 'semana'
                ? hoje
                : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

            for (let d = new Date(dataInicial); d <= diaFinal; d.setDate(d.getDate() + 1)) {
                const chave = d.toISOString().slice(0, 10);
                labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
                valores.push(mapaTotais[chave] || 0);
            }
        } else {
            // trimestre (últimos 3 meses) OU ano (Jan a Dez do ano corrente), agrupados por mês
            const mesesParaTras = periodo === 'trimestre' ? 2 : 11;
            const anoBase = periodo === 'ano' ? hoje.getFullYear() : null;
            const dataInicial = anoBase
                ? new Date(anoBase, 0, 1)
                : new Date(hoje.getFullYear(), hoje.getMonth() - mesesParaTras, 1);

            const vendasAgrupadas = await Venda.findAll({
                attributes: [
                    [fn('DATE_FORMAT', col('data_venda'), '%Y-%m'), 'mesRef'],
                    [fn('SUM', col('valor_total')), 'total']
                ],
                where: { data_venda: { [Op.gte]: dataInicial } },
                group: [fn('DATE_FORMAT', col('data_venda'), '%Y-%m')],
                raw: true
            });

            const mapaTotais = {};
            vendasAgrupadas.forEach(v => {
                mapaTotais[v.mesRef] = parseFloat(v.total) || 0;
            });

            const totalMeses = periodo === 'ano' ? 12 : 3;
            const cursor = new Date(dataInicial);
            for (let i = 0; i < totalMeses; i++) {
                const chave = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
                labels.push(`${nomesMes[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(2)}`);
                valores.push(mapaTotais[chave] || 0);
                cursor.setMonth(cursor.getMonth() + 1);
            }
        }

        return res.json({ labels, valores });
    } catch (erro) {
        console.error('Erro ao gerar gráfico do painel:', erro);
        return res.status(500).json({ erro: 'Erro ao gerar gráfico' });
    }
};