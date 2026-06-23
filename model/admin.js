const db = require('../db');

const adminSchema = `CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

db.query(adminSchema, (err) => {
    if (err) console.error('Erro criando tabela admins:', err);
});

module.exports = {
    buscarAdminPorEmail: (email) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM admins WHERE email = ?', [email], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }
};
