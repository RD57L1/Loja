import { ZodError } from 'zod';

const validarDados = (schema) => {
    return (req, res, next) => {
        try {
            // O Zod valida e faz o parse dos dados
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            // 🔍 Exibe o erro completo no terminal para sabermos exatamente a origem
            console.error("🚨 ERRO COMPLETO CAPTURADO NO MIDDLEWARE:", error);

            let mensagemErro = 'Erro de validação nos dados enviados.';

            // Verifica se é um erro do Zod (pegando tanto de .errors quanto de .issues)
            if (error instanceof ZodError || error.name === 'ZodError') {
                mensagemErro = error.errors?.[0]?.message || error.issues?.[0]?.message || mensagemErro;
            } else if (error && error.message) {
                mensagemErro = error.message;
            }
            
            // Se a requisição for uma API (JSON), devolve o erro em JSON
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                return res.status(400).json({ erro: mensagemErro });
            }

            // Se for envio de formulário comum, redireciona de volta com o erro na URL
            const urlAnterior = req.get('Referrer') || '/';
            const separador = urlAnterior.includes('?') ? '&' : '?';
            return res.redirect(`${urlAnterior}${separador}erro=${encodeURIComponent(mensagemErro)}`);
        }
    };
};

export default validarDados;