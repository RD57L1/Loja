import express from 'express';
import { loginPage, processarLogin, logout } from '../controllers/authController.js';

const router = express.Router();

// 🔐 Tela de Login e Sessão
router.get('/', loginPage);
router.post('/', processarLogin);
router.get('/logout', logout);

export default router;