import express from 'express';
import { verificarAutenticado, verificarGerente } from '../middlewares/auth.js';
import validarDados from '../middlewares/validarDados.js';
import { vendaSchema } from '../validators/vendaValidator.js';
import { renderFrenteCaixa, processarVenda, apiGraficoVendas } from '../controllers/vendaController.js';

const router = express.Router();

// 🛒 Frente de Caixa e Processamento (Protegido pelo Zod)
router.get('/frente-caixa', verificarAutenticado, renderFrenteCaixa);
router.post('/frente-caixa', verificarAutenticado, validarDados(vendaSchema), processarVenda);

// 📊 Gráfico do Painel
router.get('/api/grafico-vendas', verificarGerente, apiGraficoVendas);

export default router;