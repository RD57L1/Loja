import { Op } from 'sequelize';
import { Venda, Despesa } from '../models/index.js'; // Ajuste os imports conforme seu sistema

export const renderFluxoCaixa = async (req, res) => {
    try {
        // [Aqui geralmente fica a sua lógica de pegar as datas de Início e Fim do filtro]
        // const filtroVendas = { where: { data_venda: { [Op.between]: [dataInicio, dataFim] } } };
        
        // 1. RECEITA TOTAL (Todas as vendas, incluindo Fiado)
        const totalReceitas = await Venda.sum('valor_pago', filtroVendas) || 0;

        // 2. VENDAS FIADO (Apenas o que o meio de pagamento for 'Fiado')
        const totalFiado = await Venda.sum('valor_pago', {
            where: {
                ...filtroVendas.where,
                meio_pagamento: 'Fiado'
            }
        }) || 0;

        // 3. RECEBIDO EM CAIXA (Tudo que não for Fiado -> Dinheiro, PIX, Cartão)
        const totalRecebidoCaixa = await Venda.sum('valor_pago', {
            where: {
                ...filtroVendas.where,
                meio_pagamento: { [Op.ne]: 'Fiado' }
            }
        }) || 0;

        // 4. TOTAL SAÍDAS (Custo dos Produtos + Despesas Operacionais)
        // ... (Seu código atual que soma as despesas)
        const totalDespesas = await Despesa.sum('valor', filtroDespesas) || 0;
        
        // Vamos supor que você calcule o custo somando a coluna de custo das vendas (CMV)
        // const totalCustosProdutos = ... 
        
        const totalSaidas = totalDespesas + totalCustosProdutos; // Some as duas saídas

        // 5. LUCRO LÍQUIDO REAL (Baseado apenas no dinheiro que entrou no caixa)
        const lucroLiquidoReal = totalRecebidoCaixa - totalSaidas;

        // Envia para o Handlebars (tela)
        res.render('fluxo-caixa', {
            layout: 'interno',
            title: 'Fluxo de Caixa',
            activePage: 'fluxo-caixa',
            
            // Variáveis enviadas para os 5 novos cards
            totalReceitas,
            totalFiado,
            totalRecebidoCaixa,
            totalSaidas,
            lucroLiquidoReal,
            
            // Restante das variáveis que seu sistema já mandava
            // despesas, vendas, periodoSelecionado, etc...
        });

    } catch (erro) {
        console.error('Erro ao carregar o fluxo de caixa:', erro);
        // ... tratamento de erro
    }
};