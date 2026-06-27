const db = require('../db');

const alunoPlanoSchema = `CREATE TABLE IF NOT EXISTS aluno_plano (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    plano_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_aluno_plano (aluno_id, plano_id)
);`;

db.query(alunoPlanoSchema, (err) => {
    if (err) console.error('Erro criando tabela aluno_plano:', err);
});

module.exports = {
    vincularAlunoPlano: (alunoId, planoId) => {
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO aluno_plano (aluno_id, plano_id) VALUES (?, ?)', [alunoId, planoId], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    },

    desvincularAlunoPlano: (alunoId, planoId) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM aluno_plano WHERE aluno_id = ? AND plano_id = ?', [alunoId, planoId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },

    listarPlanosPorAluno: (alunoId) => {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT p.*, ap.created_at AS assinado_em FROM planos p
                 JOIN aluno_plano ap ON ap.plano_id = p.id
                 WHERE ap.aluno_id = ?
                 ORDER BY ap.created_at DESC`,
                [alunoId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },

    verificarVinculoPlano: (alunoId, planoId) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT id FROM aluno_plano WHERE aluno_id = ? AND plano_id = ?', [alunoId, planoId], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0);
            });
        });
    },
};
