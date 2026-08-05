import Venda from '../models/Venda.js';
import Produto from '../models/Produto.js';
import Cliente from '../models/Cliente.js';
import Parcela from '../models/Parcela.js';

export const renderFrenteCaixa = (req, res) => {
    res.render('frente-caixa', {
        layout: 'interno',
        title: 'Frente de Caixa',
        activePage: 'frente-caixa',
        sucesso: req.query.sucesso,
        erro: req.query.erro
    });
};

export const processarVenda = async (req, res) => {
    try {
        const { carrinho, meio_pagamento, desconto_geral, codigo_cliente, numero_parcelas } = req.body;
        const itensComprados = JSON.parse(carrinho);
        const isFiado = meio_pagamento === 'Fiado';

        if (!itensComprados || itensComprados.length === 0) {
            return res.redirect('/frente-caixa?erro=O carrinho está vazio.');
        }

        let cliente = null;
        let totalCompra = itensComprados.reduce((soma, item) => soma + (parseFloat(item.valorFinal) || 0), 0);

        if (isFiado) {
            if (!codigo_cliente) {
                return res.redirect('/frente-caixa?erro=Selecione um cliente para vendas Fiado.');
            }
            cliente = await Cliente.findByPk(codigo_cliente);
            if (!cliente) {
                return res.redirect('/frente-caixa?erro=Cliente não encontrado.');
            }
            const limiteDisponivel = parseFloat(cliente.limite_credito) - parseFloat(cliente.saldo_devedor);
            if (totalCompra > limiteDisponivel) {
                return res.redirect(`/frente-caixa?erro=Limite de crédito insuficiente. Disponível: R$ ${limiteDisponivel.toFixed(2)}`);
            }
        }

        let totalFiadoRegistrado = 0;
        let ultimaVendaId = null;

        for (let item of itensComprados) {
            const produto = await Produto.findByPk(item.codigo);
            if (!produto) {
                return res.redirect(`/frente-caixa?erro=Produto ${item.codigo} não encontrado.`);
            }

            const qtdDesejada = parseInt(item.quantidade) || 1;
            if (produto.quantidade < qtdDesejada) {
                return res.redirect(`/frente-caixa?erro=Estoque insuficiente para ${produto.descricao}. Disponível: ${produto.quantidade}`);
            }

            const novaQuantidade = produto.quantidade - qtdDesejada;
            const novoStatus = novaQuantidade <= 0 ? 'vendido' : 'disponivel';

            await produto.update({ quantidade: novaQuantidade, status: novoStatus });

            // 🟢 ATUALIZADO: Usando as colunas corretas do Banco V2 (forma_pagamento e valor_total)
            const novaVenda = await Venda.create({
                codigo_produto: item.codigo,
                codigo_cliente: isFiado ? cliente.id : null,
                data_venda: new Date(),
                forma_pagamento: meio_pagamento, 
                valor_total: item.valorFinal
            });

            ultimaVendaId = novaVenda.id_venda;

            if (isFiado) {
                totalFiadoRegistrado += parseFloat(item.valorFinal) || 0;
            }
        }

        if (isFiado && cliente && totalFiadoRegistrado > 0) {
            cliente.saldo_devedor = parseFloat(cliente.saldo_devedor) + totalFiadoRegistrado;
            await cliente.save();

            const qtdParcelas = parseInt(numero_parcelas) || 1;
            const valorParcela = totalFiadoRegistrado / qtdParcelas;

            for (let i = 1; i <= qtdParcelas; i++) {
                const dataVencimento = new Date();
                dataVencimento.setMonth(dataVencimento.getMonth() + i);
                await Parcela.create({
                    id_venda: ultimaVendaId,
                    numero_parcela: i,
                    valor_parcela: valorParcela,
                    data_vencimento: dataVencimento,
                    status: 'pendente'
                });
            }
        }

        return res.redirect('/frente-caixa?sucesso=Venda realizada com sucesso!');
    } catch (erro) {
        console.error('❌ Erro crítico ao processar carrinho:', erro);
        return res.redirect('/frente-caixa?erro=Erro ao registrar a venda.');
    }
};

export const apiGraficoVendas = async (req, res) => {
    try {
        const periodo = req.query.periodo || 'semana';
        const vendas = await Venda.findAll({ order: [['data_venda', 'ASC']] });

        let labels = [];
        let valores = [];
        const agora = new Date();

        if (periodo === 'semana') {
            labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            valores = [0, 0, 0, 0, 0, 0, 0];
            const umaSemanaAtras = new Date();
            umaSemanaAtras.setDate(agora.getDate() - 7);

            vendas.forEach(v => {
                const dataVenda = new Date(v.data_venda);
                if(dataVenda >= umaSemanaAtras) {
                    valores[dataVenda.getDay()] += parseFloat(v.valor_total) || 0; // 🟢 Corrigido para valor_total
                }
            });
        } else if (periodo === 'mes') {
            const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
            labels = Array.from({length: diasNoMes}, (_, i) => `Dia ${i + 1}`);
            valores = Array(diasNoMes).fill(0);

            vendas.forEach(v => {
                const dataVenda = new Date(v.data_venda);
                if(dataVenda.getMonth() === agora.getMonth() && dataVenda.getFullYear() === agora.getFullYear()) {
                    valores[dataVenda.getDate() - 1] += parseFloat(v.valor_total) || 0; // 🟢 Corrigido
                }
            });
        } else if (periodo === 'trimestre') {
            const mesAtual = agora.getMonth();
            const trimestreInicio = Math.floor(mesAtual / 3) * 3;
            const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            
            labels = [nomesMeses[trimestreInicio], nomesMeses[trimestreInicio+1], nomesMeses[trimestreInicio+2]];
            valores = [0, 0, 0];

            vendas.forEach(v => {
                const dataVenda = new Date(v.data_venda);
                if (dataVenda.getFullYear() === agora.getFullYear() && dataVenda.getMonth() >= trimestreInicio && dataVenda.getMonth() <= trimestreInicio + 2) {
                    const index = dataVenda.getMonth() - trimestreInicio;
                    valores[index] += parseFloat(v.valor_total) || 0; // 🟢 Corrigido
                }
            });
        } else if (periodo === 'ano') {
            labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            valores = Array(12).fill(0);

            vendas.forEach(v => {
                const dataVenda = new Date(v.data_venda);
                if (dataVenda.getFullYear() === agora.getFullYear()) {
                    valores[dataVenda.getMonth()] += parseFloat(v.valor_total) || 0; // 🟢 Corrigido
                }
            });
        }

        return res.json({ labels, valores });
    } catch (erro) {
        console.error('Erro ao gerar dados do gráfico:', erro);
        return res.status(500).json({ erro: 'Erro ao processar gráfico' });
    }
};