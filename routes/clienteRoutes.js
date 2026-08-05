import express from 'express';
import { verificarAutenticado, verificarGerente } from '../middlewares/auth.js';
import validarDados from '../middlewares/validarDados.js';
import { clienteSchema, clienteUpdateSchema } from '../validators/clienteValidator.js';
import {
    listarClientes,
    renderCadastrarCliente,
    criarCliente,
    renderEditarCliente,
    atualizarCliente,
    excluirCliente,
    registrarPagamentoCliente,
    apiGetClientes
} from '../controllers/clienteController.js';

const router = express.Router();

// 👤 Gestão de Clientes (qualquer usuário logado pode cadastrar/consultar,
// mas apenas o Gerente pode excluir ou dar baixa em pagamentos)
router.get('/clientes', verificarAutenticado, listarClientes);
router.get('/clientes/cadastrar', verificarAutenticado, renderCadastrarCliente);
router.post('/clientes/cadastrar', verificarAutenticado, validarDados(clienteSchema), criarCliente);

router.get('/clientes/editar/:id', verificarAutenticado, renderEditarCliente);
router.post('/clientes/editar/:id', verificarAutenticado, validarDados(clienteUpdateSchema), atualizarCliente);

router.post('/clientes/excluir/:id', verificarGerente, excluirCliente);
router.post('/clientes/:id/pagamento', verificarGerente, registrarPagamentoCliente);

// 📡 API usada na Frente de Caixa para buscar clientes ao vender Fiado
router.get('/api/clientes', verificarAutenticado, apiGetClientes);

export default router;
