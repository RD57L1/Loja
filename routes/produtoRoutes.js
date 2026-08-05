import express from 'express';
import { verificarGerente, verificarAutenticado } from '../middlewares/auth.js';
import validarDados from '../middlewares/validarDados.js';
import { produtoSchema } from '../validators/produtoValidator.js';
import {
    renderEstoque, 
    excluirProduto, 
    renderCadastrarProduto, 
    cadastrarProduto,
    renderEditarProduto,
    atualizarProduto,
    renderDevolucao, 
    processarDevolucao, 
    apiGetProduto, 
    apiGetProdutosDisponiveis
} from '../controllers/produtoController.js';

const router = express.Router();

// 📦 Gerenciamento de Estoque
router.get('/estoque', verificarGerente, renderEstoque);
router.post('/estoque/excluir/:codigo', verificarGerente, excluirProduto);

// ✏️ Edição de Produto (Protegido pelo Zod)
router.get('/estoque/editar/:codigo', verificarGerente, renderEditarProduto);
router.post('/estoque/editar/:codigo', verificarGerente, validarDados(produtoSchema), atualizarProduto);

// ➕ Cadastro de Produto (Protegido pelo Zod)
router.get('/cadastrar-produto', verificarAutenticado, renderCadastrarProduto);
router.post('/cadastrar-produto', verificarAutenticado, validarDados(produtoSchema), cadastrarProduto);

// 🔄 Devolução / Troca
router.get('/devolucao', verificarAutenticado, renderDevolucao);
router.post('/devolucao', verificarAutenticado, processarDevolucao);

// 📡 APIs de Consulta para o Front-end
router.get('/api/produto/:codigo', verificarAutenticado, apiGetProduto);
router.get('/api/produtos-disponiveis', verificarAutenticado, apiGetProdutosDisponiveis);

export default router;