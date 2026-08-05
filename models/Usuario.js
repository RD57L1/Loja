import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Usuario = sequelize.define('Usuario', {
    codigo_login: {
        type: DataTypes.INTEGER(6),
        primaryKey: true,
        allowNull: false
    },

    cargo: {
        type: DataTypes.STRING(20),
        allowNull: false
    },

    senha: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'usuarios',
    timestamps: false
});

export default Usuario;