import { Sequelize } from "sequelize";

import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS,  {
    host: 'localhost', 
    dialect: 'mysql'
});

sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados realizada com sucesso! 🚀');
  })
  .catch((erro) => {
    console.error('Erro ao tentar conectar com o banco de dados:', erro);
  });

export default sequelize;