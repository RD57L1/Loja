import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';

export const loginPage = (req, res) => {
    if (req.session.cargo) {
        return res.redirect(req.session.cargo === 'Gerente' ? '/painel' : '/frente-caixa');
    }
    res.render('login', { layout: false, erro: req.query.erro });
};

export const processarLogin = async (req, res) => {
    try {
        const codigo_digitado = req.body.usuario;
        
        // CORREÇÃO: Forçando a senha a ser lida como texto (String) 
        // Isso impede que senhas numéricas como "123456" quebrem o bcrypt
        const senha_digitada = String(req.body.senha);

        const usuario_encontrado = await Usuario.findOne({
            where: { codigo_login: codigo_digitado }
        });

        if (!usuario_encontrado) {
            return res.render('login', { layout: false, erro: 'Usuário não encontrado.' });
        }

        // Agora o bcrypt vai comparar o texto "123456" com o hash do banco de dados
        const senhaCorreta = await bcrypt.compare(senha_digitada, usuario_encontrado.senha);
        
        if (!senhaCorreta) {
            return res.render('login', { layout: false, erro: 'Senha incorreta.' });
        }

        req.session.cargo = usuario_encontrado.cargo;
        req.session.codigo_login = usuario_encontrado.codigo_login;

        if (usuario_encontrado.cargo === 'Vendedor') {
            return res.redirect('/frente-caixa');
        }
        return res.redirect('/painel');
    } catch (erro) {
        console.error('Erro no login:', erro);
        return res.render('login', { layout: false, erro: 'Erro ao processar login. Tente novamente.' });
    }
};

export const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};