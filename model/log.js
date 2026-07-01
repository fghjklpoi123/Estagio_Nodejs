const db = require('../db');

const logSchema = `CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT DEFAULT NULL,
    usuario_tipo VARCHAR(20) DEFAULT NULL,
    usuario_nome VARCHAR(150) DEFAULT NULL,
    metodo VARCHAR(10) NOT NULL,
    rota VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    ip VARCHAR(50) DEFAULT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

db.query(logSchema, (err) => {
    if (err) console.error('Erro criando tabela logs:', err);
});

module.exports = {
    registrarLog: (dados) => {
        const { usuario_id, usuario_tipo, usuario_nome, metodo, rota, status_code, ip } = dados;
        return new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO logs (usuario_id, usuario_tipo, usuario_nome, metodo, rota, status_code, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [usuario_id || null, usuario_tipo || null, usuario_nome || null, metodo, rota, status_code, ip || null],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result.insertId);
                }
            );
        });
    },

    listarLogs: (filtros = {}) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM logs';
            const where = [];
            const params = [];

            if (filtros.usuario_tipo) { where.push('usuario_tipo = ?'); params.push(filtros.usuario_tipo); }
            if (filtros.metodo) { where.push('metodo = ?'); params.push(filtros.metodo); }
            if (filtros.usuario_nome) { where.push('usuario_nome LIKE ?'); params.push(`%${filtros.usuario_nome}%`); }
            if (filtros.data) { where.push('DATE(data_hora) = ?'); params.push(filtros.data); }
            if (filtros.rota) { where.push('rota LIKE ?'); params.push(`%${filtros.rota}%`); }

            if (where.length) sql += ' WHERE ' + where.join(' AND ');
            sql += ' ORDER BY data_hora DESC LIMIT 500';

            db.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },
};
