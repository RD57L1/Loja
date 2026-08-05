import bcrypt from 'bcrypt';
import Usuario from './models/Usuario.js';
import './db.js';

async function migrar() {
    try {
        const usuarios = await Usuario.findAll();
        console.log(`Encontrados ${usuarios.length} usuários para migração.`);

        for (let user of usuarios) {
            // Verifica se a senha já parece um hash do bcrypt (começa com $2b$)
            if (!user.senha.startsWith('$2b$')) {
                console.log(`Migrando usuário: ${user.codigo_login}`);
                const hash = await bcrypt.hash(user.senha, 10);
                user.senha = hash;
                await user.save();
            } else {
                console.log(`Usuário ${user.codigo_login} já possui senha criptografada.`);
            }
        }
        console.log('Migração concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro na migração:', error);
        process.exit(1);
    }
}

migrar();
