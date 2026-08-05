import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';

export const renderCadastrarVendedor = (req, res) => {
    res.render('cadastrar-vendedor', {
        layout: 'interno',
        title: 'Cadastrar Vendedor',
        activePage: 'cadastrar-vendedor'
    });
};

export const cadastrarVendedor = async (req, res) => {
    try {
        const { codigo_login, senha, cargo } = req.body;
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
        
        await Usuario.create({
            codigo_login: parseInt(codigo_login, 10),
            senha: senhaCriptografada,
            cargo
        });
        return res.redirect('/vendedores?sucesso=Vendedor cadastrado com sucesso!');
    } catch (erro) {
        console.error('Erro ao cadastrar vendedor:', erro);
        res.render('cadastrar-vendedor', {
            layout: 'interno',
            title: 'Cadastrar Vendedor',
            activePage: 'cadastrar-vendedor',
            erro: 'Erro ao cadastrar usuário. Verifique se o código já existe.'
        });
    }
};

// 📋 Lista todos os vendedores/gerentes cadastrados
export const listarVendedores = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({ order: [['codigo_login', 'ASC']] });
        return res.render('vendedores', {
            layout: 'interno',
            title: 'Vendedores',
            activePage: 'vendedores',
            usuarios,
            codigoLogado: req.session.codigo_login,
            sucesso: req.query.sucesso,
            erro: req.query.erro
        });
    } catch (erro) {
        console.error('Erro ao listar vendedores:', erro);
        return res.render('vendedores', {
            layout: 'interno',
            title: 'Vendedores',
            activePage: 'vendedores',
            usuarios: [],
            erro: 'Erro ao carregar vendedores.'
        });
    }
};

// ✏️ Tela de edição de vendedor
export const renderEditarVendedor = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.codigo_login);
        if (!usuario) {
            return res.redirect('/vendedores?erro=Vendedor não encontrado.');
        }
        return res.render('editar-vendedor', {
            layout: 'interno',
            title: 'Editar Vendedor',
            activePage: 'vendedores',
            usuario,
            erro: req.query.erro
        });
    } catch (erro) {
        console.error('Erro ao carregar vendedor:', erro);
        return res.redirect('/vendedores?erro=Erro ao carregar vendedor.');
    }
};

// ✏️ Processa a edição (cargo sempre; senha só se preenchida)
export const atualizarVendedor = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.codigo_login);
        if (!usuario) {
            return res.redirect('/vendedores?erro=Vendedor não encontrado.');
        }

        const { senha, cargo } = req.body;
        usuario.cargo = cargo;

        if (senha && senha.trim() !== '') {
            usuario.senha = await bcrypt.hash(senha, 10);
        }

        await usuario.save();
        return res.redirect('/vendedores?sucesso=Vendedor atualizado com sucesso!');
    } catch (erro) {
        console.error('Erro ao atualizar vendedor:', erro);
        return res.redirect(`/vendedores/editar/${req.params.codigo_login}?erro=Erro ao atualizar vendedor.`);
    }
};

// 🗑️ Exclui um vendedor (bloqueado para o próprio usuário logado, por segurança)
export const excluirVendedor = async (req, res) => {
    try {
        const { codigo_login } = req.params;

        if (parseInt(codigo_login, 10) === req.session.codigo_login) {
            return res.redirect('/vendedores?erro=Você não pode excluir o seu próprio usuário logado.');
        }

        const usuario = await Usuario.findByPk(codigo_login);
        if (!usuario) {
            return res.redirect('/vendedores?erro=Vendedor não encontrado.');
        }

        await usuario.destroy();
        return res.redirect('/vendedores?sucesso=Vendedor excluído com sucesso!');
    } catch (erro) {
        console.error('Erro ao excluir vendedor:', erro);
        return res.redirect('/vendedores?erro=Erro ao excluir vendedor.');
    }
};
