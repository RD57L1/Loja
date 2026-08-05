import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Produto = sequelize.define('Produto', {
    codigo: {
        type: DataTypes.STRING(5),
        primaryKey: true,
        allowNull: false
    },
    descricao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    custo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    data_aquisicao: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'disponivel'
    },
    cor: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tamanho: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    quantidade: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    tableName: 'produtos',
    timestamps: false
});

export default Produto;