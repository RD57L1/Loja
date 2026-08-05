import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Venda = sequelize.define('Venda', {
    id_venda: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    codigo_cliente: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    codigo_produto: { 
        type: DataTypes.INTEGER,
        allowNull: true
    },
    data_venda: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    valor_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    forma_pagamento: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    tableName: 'vendas',
    timestamps: false 
});

export default Venda;