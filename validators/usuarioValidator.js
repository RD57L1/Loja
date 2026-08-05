import { z } from 'zod';

export const usuarioSchema = z.object({
    codigo_login: z.coerce.number().positive("O código de login deve ser um número válido."),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres por segurança."),
    // enum garante que ninguém force um cargo diferente no sistema
    cargo: z.enum(['Gerente', 'Vendedor'], { 
        errorMap: () => ({ message: "O cargo deve ser 'Gerente' ou 'Vendedor'." }) 
    })
});

// Usado na edição: a senha é opcional (só é alterada se o campo for preenchido)
export const usuarioUpdateSchema = z.object({
    senha: z.union([z.string().min(6, "A senha deve ter pelo menos 6 caracteres por segurança."), z.literal('')]).optional(),
    cargo: z.enum(['Gerente', 'Vendedor'], {
        errorMap: () => ({ message: "O cargo deve ser 'Gerente' ou 'Vendedor'." })
    })
});