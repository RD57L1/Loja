import { Produto } from './models/index.js';

async function rodarTeste() {
    try {
        console.log('⏳ Conectando e buscando produtos...');

        // O comando findAll() busca todos os registros daquela tabela
        const produtos = await Produto.findAll(); 

        console.log('✅ Sucesso! Aqui estão os produtos encontrados:');
        
        // Exibe os dados formatados de forma amigável no terminal
        console.log(JSON.stringify(produtos, null, 2)); 

    } catch (erro) {
        console.error('❌ Ops! Ocorreu um erro no teste:', erro);
    }
}

rodarTeste();