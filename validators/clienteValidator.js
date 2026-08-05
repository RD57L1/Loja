import { z } from 'zod';

export const clienteSchema = z.object({
    nome: z.string().min(1, 'O nome é obrigatório'),
    telefone: z.string().optional(),
    // O preprocess limpa a máscara (pontos e traços) antes de validar os 11 dígitos
    cpf: z.preprocess(
        (val) => (typeof val === 'string' ? val.replace(/\D/g, '') : val),
        z.string().length(11, 'O CPF deve conter exatamente 11 dígitos numéricos.')
    ),
    limite_credito: z.preprocess((val) => Number(val) || 0, z.number())
});

export const clienteUpdateSchema = clienteSchema.partial();