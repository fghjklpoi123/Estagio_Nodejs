const db = require('../db');

const alunoModalidadeSchema = `CREATE TABLE IF NOT EXISTS aluno_modalidade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    modalidade_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (modalidade_id) REFERENCES modalidades(id) ON DELETE CASCADE,
    UNIQUE KEY unique_aluno_modalidade (aluno_id, modalidade_id)
);`;

db.query(alunoModalidadeSchema, (err) => {
    if (err) console.error('Erro criando tabela aluno_modalidade:', err);
});

module.exports = {
    listarAlunosPorModalidade: (modalidadeId) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT a.id, a.nome, a.cpf, a.telefone, a.email FROM alunos a 
                        JOIN aluno_modalidade am ON am.aluno_id = a.id 
                        WHERE am.modalidade_id = ?`;
            db.query(sql, [modalidadeId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },

    listarModalidadesPorAluno: (alunoId) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT m.id, m.nome, m.descricao FROM modalidades m 
                        JOIN aluno_modalidade am ON am.modalidade_id = m.id 
                        WHERE am.aluno_id = ?`;
            db.query(sql, [alunoId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },

    // Retorna a última inscrição (mais recente) do aluno na tabela aluno_modalidade
    buscarUltimaInscricaoPorAluno: (alunoId) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT am.id, am.aluno_id, am.modalidade_id, am.created_at FROM aluno_modalidade am WHERE am.aluno_id = ? ORDER BY am.created_at DESC LIMIT 1`;
            db.query(sql, [alunoId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    },

    vincularAlunoModalidade: (alunoId, modalidadeId) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO aluno_modalidade (aluno_id, modalidade_id) VALUES (?, ?)`;
            db.query(sql, [alunoId, modalidadeId], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    },

    desvincularAlunoModalidade: (alunoId, modalidadeId) => {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM aluno_modalidade WHERE aluno_id = ? AND modalidade_id = ?`;
            db.query(sql, [alunoId, modalidadeId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },

    verificarVinculo: (alunoId, modalidadeId) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id FROM aluno_modalidade WHERE aluno_id = ? AND modalidade_id = ?`;
            db.query(sql, [alunoId, modalidadeId], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0);
            });
        });
    }
}
