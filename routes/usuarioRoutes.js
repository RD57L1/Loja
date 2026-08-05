import express from 'express';
import { verificarGerente } from '../middlewares/auth.js';
import validarDados from '../middlewares/validarDados.js';
import { usuarioSchema, usuarioUpdateSchema } from '../validators/usuarioValidator.js';
import {
    renderCadastrarVendedor,
    cadastrarVendedor,
    listarVendedores,
    renderEditarVendedor,
    atualizarVendedor,
    excluirVendedor
} from '../controllers/usuarioController.js';

const router = express.Router();

// 👥 Listagem de Vendedores/Gerentes
router.get('/vendedores', verificarGerente, listarVendedores);

// 👥 Cadastro de Funcionários (Protegido pelo Zod)
router.get('/cadastrar-vendedor', verificarGerente, renderCadastrarVendedor);
router.post('/cadastrar-vendedor', verificarGerente, validarDados(usuarioSchema), cadastrarVendedor);

// ✏️ Edição e 🗑️ Exclusão de Vendedor
router.get('/vendedores/editar/:codigo_login', verificarGerente, renderEditarVendedor);
router.post('/vendedores/editar/:codigo_login', verificarGerente, validarDados(usuarioUpdateSchema), atualizarVendedor);
router.post('/vendedores/excluir/:codigo_login', verificarGerente, excluirVendedor);

export default router;
