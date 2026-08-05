import { Op } from 'sequelize';
import Cliente from '../models/Cliente.js';
import Venda from '../models/Venda.js';

// 📋 Lista todos os clientes cadastrados
export const listarClientes = async (req, res) => {
    try {
        const busca = req.query.busca || '';
        const filtro = busca
            ? { nome: { [Op.like]: `%${busca}%` } }
            : {};

        // Busca os clientes incluindo o histórico de vendas
        const clientesData = await Cliente.findAll({
            where: filtro,
            include: [{
                model: Venda,
                as: 'vendas', // Alias definido lá no models/index.js
                required: false 
            }],
            order: [['nome', 'ASC']]
        });

        // Formata os dados para o Handlebars exibir na tela
        const clientes = clientesData.map(c => {
            const cliente = c.toJSON();
            
            // Cria uma variável real (true/false) para sabermos se o cliente deve algo
            cliente.tem_divida = parseFloat(cliente.saldo_devedor) > 0;

            const historicoVendas = cliente.vendas || [];

            // Se o cliente tem compras, pegamos o meio_pagamento da mais recente
            if (historicoVendas.length > 0) {
                // Ordena da mais recente para a mais antiga (usando o id_venda)
                historicoVendas.sort((a, b) => b.id_venda - a.id_venda);
                cliente.info_ultima_compra = historicoVendas[0].meio_pagamento; 
            } else {
                cliente.info_ultima_compra = null;
            }

            return cliente;
        });

        return res.render('clientes', {
            layout: 'interno',
            title: 'Clientes',
            activePage: 'clientes',
            clientes,
            busca,
            sucesso: req.query.sucesso,
            erro: req.query.erro
        });
    } catch (erro) {
        console.error('Erro ao listar clientes:', erro);
        return res.render('clientes', {
            layout: 'interno',
            title: 'Clientes',
            activePage: 'clientes',
            clientes: [],
            erro: 'Erro ao carregar a lista de clientes.'
        });
    }
};

// ➕ Tela de cadastro
export const renderCadastrarCliente = (req, res) => {
    res.render('cadastrar-cliente', {
        layout: 'interno',
        title: 'Cadastrar Cliente',
        activePage: 'clientes',
        sucesso: req.query.sucesso,
        erro: req.query.erro
    });
};

// ➕ Processa o cadastro (Bloqueia CPF e Telefone duplicados)
export const criarCliente = async (req, res) => {
    const { nome, telefone, cpf, limite_credito } = req.body;

    try {
        const condicoesVerificacao = [];
        if (cpf) condicoesVerificacao.push({ cpf });
        if (telefone) condicoesVerificacao.push({ telefone });

        if (condicoesVerificacao.length > 0) {
            const clienteExistente = await Cliente.findOne({
                where: { [Op.or]: condicoesVerificacao }
            });

            if (clienteExistente) {
                let mensagemErro = 'Este CPF já está cadastrado para outro cliente.';
                if (clienteExistente.telefone === telefone && telefone !== '') {
                    mensagemErro = 'Este telefone já está cadastrado para outro cliente.';
                }

                return res.render('cadastrar-cliente', {
                    layout: 'interno',
                    title: 'Cadastrar Cliente',
                    activePage: 'clientes',
                    erro: mensagemErro,
                    nome, telefone, cpf, limite_credito
                });
            }
        }

        await Cliente.create({
            nome,
            telefone: telefone || null,
            cpf: cpf || null,
            limite_credito: limite_credito || 0
        });

        return res.redirect('/clientes?sucesso=Cliente cadastrado com sucesso!');
    } catch (erro) {
        console.error('Erro ao cadastrar cliente:', erro);
        return res.redirect('/clientes/cadastrar?erro=Erro ao cadastrar cliente.');
    }
};

// ✏️ Tela de edição
export const renderEditarCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findByPk(req.params.id);
        if (!cliente) {
            return res.redirect('/clientes?erro=Cliente não encontrado.');
        }
        return res.render('editar-cliente', {
            layout: 'interno',
            title: 'Editar Cliente',
            activePage: 'clientes',
            cliente,
            erro: req.query.erro
        });
    } catch (erro) {
        console.error('Erro ao carregar cliente:', erro);
        return res.redirect('/clientes?erro=Erro ao carregar cliente.');
    }
};

// ✏️ Processa a edição
export const atualizarCliente = async (req, res) => {
    try {
        const clienteId = req.params.id;
        const cliente = await Cliente.findByPk(clienteId);
        if (!cliente) {
            return res.redirect('/clientes?erro=Cliente não encontrado.');
        }

        const { nome, telefone, cpf, limite_credito } = req.body;

        const condicoesVerificacao = [];
        if (cpf && cpf !== cliente.cpf) condicoesVerificacao.push({ cpf });
        if (telefone && telefone !== cliente.telefone) condicoesVerificacao.push({ telefone });

        if (condicoesVerificacao.length > 0) {
            const clienteExistente = await Cliente.findOne({
                where: { [Op.or]: condicoesVerificacao }
            });

            if (clienteExistente) {
                let mensagemErro = 'Este CPF já está sendo usado por outro cliente.';
                if (clienteExistente.telefone === telefone) {
                    mensagemErro = 'Este telefone já está sendo usado por outro cliente.';
                }
                return res.redirect(`/clientes/editar/${clienteId}?erro=${encodeURIComponent(mensagemErro)}`);
            }
        }

        cliente.nome = nome;
        cliente.telefone = telefone || null;
        cliente.cpf = cpf || null;
        cliente.limite_credito = limite_credito ?? cliente.limite_credito;
        await cliente.save();

        return res.redirect('/clientes?sucesso=Cliente atualizado com sucesso!');
    } catch (erro) {
        console.error('Erro ao atualizar cliente:', erro);
        return res.redirect(`/clientes/editar/${req.params.id}?erro=Erro ao atualizar cliente.`);
    }
};

// 🗑️ Exclui um cliente
export const excluirCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findByPk(req.params.id);
        if (!cliente) {
            return res.redirect('/clientes?erro=Cliente não encontrado.');
        }

        if (parseFloat(cliente.saldo_devedor) > 0) {
            return res.redirect('/clientes?erro=Não é possível excluir um cliente com saldo devedor em aberto.');
        }

        await cliente.destroy();
        return res.redirect('/clientes?sucesso=Cliente excluído com sucesso!');
    } catch (erro) {
        console.error('Erro ao excluir cliente:', erro);
        return res.redirect('/clientes?erro=Erro ao excluir cliente. Verifique se ele não possui vendas registradas.');
    }
};

// 💳 Registra o pagamento (baixa do fiado)
export const registrarPagamentoCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findByPk(req.params.id);
        if (!cliente) {
            return res.redirect('/clientes?erro=Cliente não encontrado.');
        }

        const valorPago = parseFloat(req.body.valor_pago) || 0;
        if (valorPago <= 0) {
            return res.redirect('/clientes?erro=Informe um valor de pagamento válido.');
        }

        const novoSaldo = Math.max(0, parseFloat(cliente.saldo_devedor) - valorPago);
        cliente.saldo_devedor = novoSaldo;
        await cliente.save();

        return res.redirect('/clientes?sucesso=Pagamento registrado com sucesso!');
    } catch (erro) {
        console.error('Erro ao registrar pagamento:', erro);
        return res.redirect('/clientes?erro=Erro ao registrar pagamento.');
    }
};

// 📡 API para buscar clientes (Frente de Caixa)
export const apiGetClientes = async (req, res) => {
    try {
        const { busca } = req.query;
        let filtro = {};

        if (busca && busca.trim() !== '') {
            const termoLimpo = busca.replace(/\D/g, ''); 
            
            filtro = {
                [Op.or]: [
                    { nome: { [Op.like]: `%${busca}%` } },
                    { cpf: { [Op.like]: `%${termoLimpo}%` } }
                ]
            };
        }

        const clientes = await Cliente.findAll({
            where: filtro,
            order: [['nome', 'ASC']],
            limit: 20
        });

        return res.json(clientes.map(c => ({
            id: c.id,
            nome: c.nome,
            cpf: c.cpf,
            limite_credito: c.limite_credito,
            saldo_devedor: c.saldo_devedor,
            disponivel: parseFloat(c.limite_credito) - parseFloat(c.saldo_devedor)
        })));
    } catch (erro) {
        console.error('Erro ao buscar clientes:', erro);
        return res.status(500).json({ erro: 'Erro ao buscar clientes' });
    }
};