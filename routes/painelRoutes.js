import express from 'express';
import { verificarGerente } from '../middlewares/auth.js';
import { renderPainel, apiGraficoVendas } from '../controllers/painelController.js';

const router = express.Router();

// 📊 Dashboard do Gerente
router.get('/painel', verificarGerente, renderPainel);

// 📈 Dados do gráfico de faturamento do painel
router.get('/api/grafico-vendas', verificarGerente, apiGraficoVendas);

export default router;