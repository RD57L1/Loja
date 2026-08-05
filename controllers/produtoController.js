import { Op } from 'sequelize';
import Produto from '../models/Produto.js';
import Venda from '../models/Venda.js';
import Cliente from '../models/Cliente.js';
import Parcela from '../models/Parcela.js';

// 📦 Renderiza o estoque completo
export const renderEstoque = async (req, res) => {
    try {
        const busca = req.query.busca || '';
        const filtro = busca ? {
            [Op.or]: [
                { codigo: { [Op.like]: `%${busca}%` } },
                { descricao: { [Op.like]: `%${busca}%` } },
                { tipo: { [Op.like]: `%${busca}%` } }
            ]
        } : {};

        const produtos = await Produto.findAll({
            where: filtro,
            order: [['codigo', 'ASC']]
        });

        return res.render('estoque', {
            layout: 'interno',
            title: 'Gerenciamento de Estoque',
            activePage: 'estoque',
            produtos,
            busca,
            sucesso: req.query.sucesso,
            erro: req.query.erro
        });
    } catch (erro) {
        console.error('Erro ao carregar estoque:', erro);
        return res.render('estoque', {
            layout: 'interno',
            title: 'Gerenciamento de Estoque',
            activePage: 'estoque',
            produtos: [],
            erro: 'Erro ao carregar o estoque.'
        });
    }
};

// ➕ Renderiza a tela de cadastro de produto
export const renderCadastrarProduto = (req, res) => {
    res.render('cadastrar-produto', {
        layout: 'interno',
        title: 'Cadastrar Produto',
        activePage: 'estoque',
        sucesso: req.query.sucesso,
        erro: req.query.erro
    });
};

// ➕ Processa o cadastro de produto (Gera código de 5 dígitos automaticamente)
export const cadastrarProduto = async (req, res) => {
    try {
        const { descricao, tipo, custo, valor, data_aquisicao, cor, tamanho, quantidade } = req.body;

        let codigoGerado;
        let produtoExistente;
        do {
            codigoGerado = Math.floor(10000 + Math.random() * 90000).toString();
            produtoExistente = await Produto.findByPk(codigoGerado);
        } while (produtoExistente);

        const qtd = parseInt(quantidade) || 1;
        await Produto.create({
            codigo: codigoGerado,
            descricao,
            tipo,
            custo: parseFloat(custo) || 0,
            valor: parseFloat(valor) || 0,
            data_aquisicao: data_aquisicao || new Date(),
            status: qtd > 0 ? 'disponivel' : 'vendido',
            cor: cor || null,
            tamanho: tamanho || null,
            quantidade: qtd
        });

        // 🟢 ATUALIZADO: Agora redireciona de volta para a mesma tela de cadastro
        return res.redirect('/cadastrar-produto?sucesso=Produto cadastrado com sucesso! Código gerado: ' + codigoGerado);
    } catch (erro) {
        console.error('Erro ao cadastrar produto:', erro);
        return res.redirect('/cadastrar-produto?erro=Erro ao cadastrar produto.');
    }
};

// ✏️ Renderiza a tela de edição
export const renderEditarProduto = async (req, res) => {
    try {
        const produto = await Produto.findByPk(req.params.codigo);
        if (!produto) {
            return res.redirect('/estoque?erro=Produto não encontrado.');
        }

        return res.render('editar-produto', {
            layout: 'interno',
            title: 'Editar Produto',
            activePage: 'estoque',
            produto,
            erro: req.query.erro
        });
    } catch (erro) {
        console.error('Erro ao carregar produto para edição:', erro);
        return res.redirect('/estoque?erro=Erro ao carregar produto.');
    }
};

// ✏️ Processa a edição (Com suporte ao campo tamanho)
export const atualizarProduto = async (req, res) => {
    try {
        const produto = await Produto.findByPk(req.params.codigo);
        if (!produto) {
            return res.redirect('/estoque?erro=Produto não encontrado.');
        }

        const { descricao, tipo, custo, valor, data_aquisicao, cor, tamanho, quantidade } = req.body;
        const qtd = parseInt(quantidade) !== undefined ? parseInt(quantidade) : produto.quantidade;

        await produto.update({
            descricao,
            tipo,
            custo: parseFloat(custo) || 0,
            valor: parseFloat(valor) || 0,
            data_aquisicao,
            cor,
            tamanho: tamanho || null,
            quantidade: qtd,
            status: qtd > 0 ? 'disponivel' : 'vendido'
        });

        return res.redirect('/estoque?sucesso=Produto atualizado com sucesso!');
    } catch (erro) {
        console.error('Erro ao atualizar produto:', erro);
        return res.redirect(`/estoque/editar/${req.params.codigo}?erro=Erro ao atualizar produto.`);
    }
};

// 🗑️ Exclui um produto
export const excluirProduto = async (req, res) => {
    try {
        const produto = await Produto.findByPk(req.params.codigo);
        if (!produto) {
            return res.redirect('/estoque?erro=Produto não encontrado.');
        }

        await produto.destroy();
        return res.redirect('/estoque?sucesso=Produto excluído com sucesso!');
    } catch (erro) {
        console.error('Erro ao excluir produto:', erro);
        return res.redirect('/estoque?erro=Erro ao excluir produto.');
    }
};

// ==========================================
// 🔄 DEVOLUÇÃO E TROCA
// ==========================================
export const renderDevolucao = (req, res) => {
    res.render('devolucao', {
        layout: 'interno',
        title: 'Registro de Devolução',
        activePage: 'devolucao',
        sucesso: req.query.sucesso,
        erro: req.query.erro
    });
};

export const processarDevolucao = async (req, res) => {
    try {
        const { codigo } = req.body;

        if (!codigo) {
            return res.redirect('/devolucao?erro=Informe o código do produto.');
        }

        const produto = await Produto.findByPk(codigo);
        if (!produto) {
            return res.redirect('/devolucao?erro=Produto não encontrado.');
        }

        // 1. Devolve a peça ao estoque
        const novaQuantidade = produto.quantidade + 1;
        await produto.update({
            quantidade: novaQuantidade,
            status: 'disponivel'
        });

        // 2. Localiza a venda mais recente para retirá-la da Receita Total
        const ultimaVenda = await Venda.findOne({
            where: { codigo_produto: codigo },
            order: [['data_venda', 'DESC']]
        });

        if (ultimaVenda) {
            console.log(`🗑️ SUCESSO: Removendo venda ID ${ultimaVenda.id_venda} no valor de R$ ${ultimaVenda.valor_pago} para atualizar a receita.`);

            if (ultimaVenda.meio_pagamento === 'Fiado' && ultimaVenda.codigo_cliente) {
                const cliente = await Cliente.findByPk(ultimaVenda.codigo_cliente);
                if (cliente) {
                    const valorEstorno = parseFloat(ultimaVenda.valor_pago) || 0;
                    cliente.saldo_devedor = Math.max(0, parseFloat(cliente.saldo_devedor) - valorEstorno);
                    await cliente.save();

                    await Parcela.destroy({ where: { id_venda: ultimaVenda.id_venda } });
                }
            }

            await ultimaVenda.destroy();
        } else {
            console.warn(`⚠️ ATENÇÃO: Nenhuma venda encontrada com o código de produto: ${codigo} para estornar da receita.`);
        }

        return res.redirect('/devolucao?sucesso=Devolução realizada! Produto retornado ao estoque e receita atualizada.');
    } catch (erro) {
        console.error('❌ Erro ao processar devolução:', erro);
        return res.redirect('/devolucao?erro=Erro ao processar a devolução.');
    }
};

// ==========================================
// 📡 APIs AUXILIARES PARA A FRENTE DE CAIXA
// ==========================================
export const apiGetProduto = async (req, res) => {
    try {
        const { codigo } = req.params;
        const produto = await Produto.findByPk(codigo);
        
        if (!produto) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }
        
        return res.json(produto);
    } catch (erro) {
        console.error('Erro ao buscar produto por API:', erro);
        return res.status(500).json({ erro: 'Erro ao buscar produto.' });
    }
};

export const apiGetProdutosDisponiveis = async (req, res) => {
    try {
        const { tipo } = req.query;
        let filtro = {
            status: 'disponivel',
            quantidade: { [Op.gt]: 0 }
        };

        if (tipo && tipo.trim() !== '') {
            filtro[Op.or] = [
                { descricao: { [Op.like]: `%${tipo}%` } },
                { tipo: { [Op.like]: `%${tipo}%` } },
                { codigo: { [Op.like]: `%${tipo}%` } }
            ];
        }

        const produtos = await Produto.findAll({
            where: filtro,
            order: [['codigo', 'ASC']]
        });

        return res.json(produtos);
    } catch (erro) {
        console.error('Erro ao buscar produtos disponíveis:', erro);
        return res.status(500).json({ erro: 'Erro ao buscar produtos disponíveis.' });
    }
};