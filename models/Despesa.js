import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Despesa = sequelize.define('Despesa', {
    descricao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING, // Ex: Aluguel, Salário, Mercadoria, Alimentação
        allowNull: false
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    data_despesa: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

export default Despesa;