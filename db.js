require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

connection.connect((error) => {
    if (error) {
        console.error('Erro ao conectar com o MySQL:', error);
        return;
    }
    console.log('Conectado com sucesso ao MySQL!');
});

module.exports = connection;