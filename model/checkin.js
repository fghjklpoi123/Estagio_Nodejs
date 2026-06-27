const db = require('../db');

const checkinSchema = `CREATE TABLE IF NOT EXISTS checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
);`;

db.query(checkinSchema, (err) => {
    if (err) console.error('Erro criando tabela checkins:', err);
});

module.exports = {
    registrarCheckin: (alunoId) => {
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO checkins (aluno_id) VALUES (?)', [alunoId], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    },

    buscarCheckinHoje: (alunoId) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM checkins WHERE aluno_id = ? AND DATE(data_hora) = CURDATE() ORDER BY data_hora DESC LIMIT 1',
                [alunoId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0] || null);
                }
            );
        });
    },

    listarCheckinsPorAluno: (alunoId) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM checkins WHERE aluno_id = ? ORDER BY data_hora DESC',
                [alunoId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },

    listarTodosCheckins: (filtros = {}) => {
        return new Promise((resolve, reject) => {
            let sql = `SELECT c.id, c.aluno_id, c.data_hora, a.nome AS aluno_nome
                        FROM checkins c
                        JOIN alunos a ON a.id = c.aluno_id`;
            const where = [];
            const params = [];

            if (filtros.aluno_id) {
                where.push('c.aluno_id = ?');
                params.push(filtros.aluno_id);
            }
            if (filtros.data) {
                where.push('DATE(c.data_hora) = ?');
                params.push(filtros.data);
            }
            if (filtros.data_inicio && filtros.data_fim) {
                where.push('DATE(c.data_hora) BETWEEN ? AND ?');
                params.push(filtros.data_inicio, filtros.data_fim);
            }

            if (where.length) sql += ' WHERE ' + where.join(' AND ');
            sql += ' ORDER BY c.data_hora DESC';

            db.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },

    contarCheckinsHoje: () => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT COUNT(*) AS total FROM checkins WHERE DATE(data_hora) = CURDATE()',
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0]?.total || 0);
                }
            );
        });
    },
};
