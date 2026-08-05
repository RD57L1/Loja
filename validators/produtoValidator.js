import { z } from 'zod';

export const produtoSchema = z.object({
    descricao: z.string().min(1, 'A descrição é obrigatória'),
    tipo: z.string().min(1, 'O tipo é obrigatório'),
    custo: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
    valor: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
    cor: z.string().optional().nullable(),
    tamanho: z.string().optional().nullable(), // 👈 Adicionado aqui
    quantidade: z.preprocess((val) => Number(val) || 1, z.number().int().min(0)),
    data_aquisicao: z.string().min(1, 'A data de aquisição é obrigatória'),
    status: z.string().optional()
});