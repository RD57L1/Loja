import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Parcela = sequelize.define('Parcela', {
    id_parcela: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_venda: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_parcela: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    valor_parcela: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    data_vencimento: {
        type: DataTypes.DATE,
        allowNull: false
    },
    data_pagamento: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pendente'
    }
}, {
    tableName: 'parcelas',
    timestamps: false
});

export default Parcela;