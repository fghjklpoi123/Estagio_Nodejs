const db = require('../db');

const exercicioSchema = `CREATE TABLE IF NOT EXISTS exercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    modalidade_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modalidade_id) REFERENCES modalidades(id) ON DELETE CASCADE
);`;

db.query(exercicioSchema, (err) => {
    if (err) console.error('Erro criando tabela exercicios:', err);
});

module.exports = {
    listarExercicios: (modalidadeId = null) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM exercicios';
            let params = [];
            if (modalidadeId) {
                sql += ' WHERE modalidade_id = ?';
                params = [modalidadeId];
            }
            db.query(sql, params, (error, results) => {
                if (error) { reject(error); return }
                resolve(results);
            })
        })
    },

    buscarExercicioPorId: (id) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM exercicios WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        })
    },

    cadastrarExercicio: (exercicio) => {
        const { nome, descricao, modalidade_id } = exercicio;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO exercicios (nome, descricao, modalidade_id) VALUES (?, ?, ?)`;
            db.query(sql, [nome, descricao, modalidade_id], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            })
        });
    },

    atualizarExercicio: (id, dados) => {
        const campos = [];
        const valores = [];
        const allowed = ['nome', 'descricao', 'modalidade_id'];
        allowed.forEach((k) => { if (k in dados) { campos.push(`${k} = ?`); valores.push(dados[k]); } });
        if (campos.length === 0) return Promise.resolve({affectedRows:0});
        valores.push(id);
        const sql = `UPDATE exercicios SET ${campos.join(', ')} WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.query(sql, valores, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    },

    deletarExercicio: (id) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM exercicios WHERE id = ?', [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    },

    buscarModalidadeComExercicios: (modalidadeId) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT m.id, m.nome, m.descricao, m.created_at, GROUP_CONCAT(JSON_OBJECT('id', e.id, 'nome', e.nome, 'descricao', e.descricao)) as exercicios FROM modalidades m LEFT JOIN exercicios e ON e.modalidade_id = m.id WHERE m.id = ? GROUP BY m.id`;
            db.query(sql, [modalidadeId], (err, results) => {
                if (err) return reject(err);
                if (results[0]) {
                    results[0].exercicios = results[0].exercicios ? JSON.parse(`[${results[0].exercicios}]`) : [];
                }
                resolve(results[0] || null);
            });
        });
    }
}