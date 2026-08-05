export const verificarAutenticado = (req, res, next) => {
    // Se existe uma sessão e o código de login está nela, o usuário está logado
    if (req.session && req.session.codigo_login) {
        return next(); // Pode passar para o Controller
    }
    
    // Se não estiver logado, manda pro login com mensagem de erro
    return res.redirect('/?erro=Você precisa fazer login para acessar o sistema.');
};

export const verificarGerente = (req, res, next) => {
    // Verifica se tem sessão e se o cargo é Gerente
    if (req.session && req.session.cargo === 'Gerente') {
        return next(); // Pode passar
    }
    
    // Se estiver logado, mas não for gerente, manda pra frente de caixa
    if (req.session && req.session.codigo_login) {
        return res.redirect('/frente-caixa?erro=Acesso negado. Essa página é restrita para Gerentes.');
    }
    
    // Se nem logado estiver, manda pro login
    return res.redirect('/?erro=Você precisa fazer login para acessar o sistema.');
};