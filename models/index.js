import Produto from "./Produto.js";
import Venda from "./Venda.js";
import Usuario from "./Usuario.js";
import Despesa from "./Despesa.js";
import Cliente from "./Cliente.js";


Produto.hasMany(Venda, {
    foreignKey: 'codigo_produto',
    as: 'vendas'
});

Venda.belongsTo(Produto, {
    foreignKey: 'codigo_produto',
    as: 'produto'
});

// Um cliente pode ter várias vendas (fiado); uma venda pertence no máximo a um cliente
Cliente.hasMany(Venda, {
    foreignKey: 'codigo_cliente',
    as: 'vendas'
});

Venda.belongsTo(Cliente, {
    foreignKey: 'codigo_cliente',
    as: 'cliente'
});

export { Produto, Venda, Usuario, Despesa, Cliente };
