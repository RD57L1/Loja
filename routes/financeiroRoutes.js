import express from 'express';
import { verificarGerente } from '../middlewares/auth.js';
import validarDados from '../middlewares/validarDados.js';
import { despesaSchema } from '../validators/despesaValidator.js';
import {
    exibirFluxo,
    adicionarDespesa,
    renderEditarDespesa,
    atualizarDespesa,
    excluirDespesa,
    apiGraficoFluxo
} from '../controllers/financeiroController.js';

const router = express.Router();

// 💰 Fluxo de Caixa e Despesas (Protegido pelo Zod)
router.get('/fluxo-caixa', verificarGerente, exibirFluxo);
router.post('/fluxo-caixa/despesa', verificarGerente, validarDados(despesaSchema), adicionarDespesa);

// ✏️ Editar e 🗑️ Excluir Despesa
router.get('/fluxo-caixa/despesa/editar/:id', verificarGerente, renderEditarDespesa);
router.post('/fluxo-caixa/despesa/editar/:id', verificarGerente, validarDados(despesaSchema), atualizarDespesa);
router.post('/fluxo-caixa/despesa/excluir/:id', verificarGerente, excluirDespesa);

// 📊 Gráfico Financeiro
router.get('/api/grafico-fluxo', verificarGerente, apiGraficoFluxo);

export default router;