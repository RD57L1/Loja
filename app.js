import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Importação das rotas
import authRoutes from './routes/authRoutes.js';
import painelRoutes from './routes/painelRoutes.js';
import produtoRoutes from './routes/produtoRoutes.js';
import vendaRoutes from './routes/vendaRoutes.js';
import financeiroRoutes from './routes/financeiroRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';

// Importação das associações do banco de dados
import './models/index.js';

// Configuração para __dirname funcionar com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middlewares para leitura de dados (formulários e JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Libera o acesso à pasta public (onde está o seu style.css)
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Handlebars e seus Helpers
const hbs = engine({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    defaultLayout: 'interno',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    },
    helpers: {
        // Helper para comparações (ex: menu ativo)
        eq: (a, b) => a === b,

        // Helper para exibir @index (que começa em 0) como posição de ranking (1, 2, 3...)
        addOne: (indice) => indice + 1,
        
        // Helper para formatar moeda em Reais (R$)
        formatMoney: (valor) => {
            const numero = parseFloat(valor) || 0;
            return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        },
        
        // Helper para formatar data simples (DD/MM/AAAA)
        formatDate: (data) => {
            if (!data) return '';
            // Força o fuso horário correto garantindo que a data não sofra shift
            const dataObj = new Date(data);
            return dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        },
        
        // Helper para formatar data e hora (DD/MM/AAAA HH:MM)
        formatDateTime: (data) => {
            if (!data) return '';
            const dataObj = new Date(data);
            return dataObj.toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }
});

app.engine('handlebars', hbs);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Configuração de sessão de login
app.use(session({
    secret: 'chave_secreta_sistema', // Em produção, mova isso para um arquivo .env
    resave: false,
    saveUninitialized: false
}));

// Middleware global: Disponibiliza a variável isGerente para todas as views (telas)
app.use((req, res, next) => {
    res.locals.isGerente = req.session.cargo === 'Gerente';
    next();
});

// === ROTAS DO SISTEMA ===
app.use('/', authRoutes);
app.use('/', painelRoutes);
app.use('/', produtoRoutes);
app.use('/', vendaRoutes);
app.use('/', financeiroRoutes);
app.use('/', usuarioRoutes);
app.use('/', clienteRoutes);

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`🚀 Sistema Joia Rara rodando na porta http://localhost:${PORT}`);
});