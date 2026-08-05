import Produto from '../models/Produto.js';

export const gerarProximoCodigoProduto = async () => {
    let codigoGerado;
    let codigoEmUso = true;

    try {
        // O laço 'while' faz o sistema tentar gerar um novo código até achar um que não exista no banco
        while (codigoEmUso) {
            // Sorteia um número aleatório entre 10000 e 99999 (garante sempre 5 dígitos)
            codigoGerado = Math.floor(10000 + Math.random() * 90000).toString();
            
            // Vai no banco de dados e verifica se algum produto já usa esse código sorteado
            const produtoExistente = await Produto.findOne({ 
                where: { codigo: codigoGerado } 
            });
            
            // Se o Sequelize não achar nenhum produto com esse código, liberamos o uso
            if (!produtoExistente) {
                codigoEmUso = false;
            }
        }
        
        return codigoGerado;
        
    } catch (erro) {
        console.error("Erro ao gerar código aleatório de produto:", erro);
        throw new Error("Não foi possível gerar o código aleatório do produto.");
    }
};