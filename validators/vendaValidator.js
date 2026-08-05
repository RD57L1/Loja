import { z } from 'zod';

export const vendaSchema = z.object({
    // O carrinho vem como uma string JSON (ex: "[{...}]") do front-end
    carrinho: z.string().min(5, "O carrinho está vazio ou inválido."),
    meio_pagamento: z.string().min(1, "O meio de pagamento é obrigatório."),
    desconto_geral: z.coerce.number().min(0, "O desconto não pode ser negativo.").optional().default(0),
    // Só é obrigatório quando meio_pagamento === 'Fiado'
    codigo_cliente: z.string().optional()
}).refine((dados) => {
    if (dados.meio_pagamento === 'Fiado') {
        return !!dados.codigo_cliente;
    }
    return true;
}, {
    message: "Selecione o cliente para uma venda Fiado.",
    path: ['codigo_cliente']
});