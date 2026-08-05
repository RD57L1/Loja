import { z } from 'zod';

export const despesaSchema = z.object({
    descricao: z.string().min(3, "A descrição da despesa deve ter pelo menos 3 caracteres."),
    categoria: z.string().min(2, "A categoria é obrigatória."),
    // positive() garante que o valor seja maior que 0 (não aceita 0 nem negativo)
    valor: z.coerce.number().positive("O valor da despesa deve ser maior que zero.")
});