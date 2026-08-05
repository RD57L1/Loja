import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

// Cadastro de clientes da loja. Um cliente pode comprar à vista
// ou "fiado" (a prazo), respeitando o limite_credito cadastrado.
const Cliente = sequelize.define('Cliente', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nome: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    telefone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
    },

    cpf: {
        type: DataTypes.STRING(11),
        allowNull: true,
        unique: true
    },

    // Valor máximo que o cliente pode dever comprando fiado
    limite_credito: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },

    // Quanto do limite já está "consumido" com compras fiado ainda não pagas
    saldo_devedor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'clientes',
    timestamps: false
});

export default Cliente;
