const db = require('../db');

const planoSchema = `CREATE TABLE IF NOT EXISTS planos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    modalidade_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modalidade_id) REFERENCES modalidades(id) ON DELETE SET NULL
);`;

// criar tabela se não existir
db.query(planoSchema, (err) => {
    if (err) console.error('Erro criando tabela planos:', err);
});

module.exports = {
    listarPlanos: () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM planos', (error, results) => {
                if (error) { reject(error); return }
                resolve(results);
            })
        })
    },

    buscarPlanoPorId: (id) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM planos WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        })
    },

    cadastrarPlano: (plano) => {
        const { descricao, preco, modalidade_id } = plano;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO planos (descricao, preco, modalidade_id) VALUES (?, ?, ?)`;
            db.query(sql, [descricao, preco, modalidade_id], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            })
        });
    },

    atualizarPlano: (id, dados) => {
        const campos = [];
        const valores = [];
        const allowed = ['descricao','preco','modalidade_id'];
        allowed.forEach((k) => { if (k in dados) { campos.push(`${k} = ?`); valores.push(dados[k]); } });
        if (campos.length === 0) return Promise.resolve({affectedRows:0});
        valores.push(id);
        const sql = `UPDATE planos SET ${campos.join(', ')} WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.query(sql, valores, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    },

    deletarPlano: (id) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM planos WHERE id = ?', [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    },

    buscarPlanosPorModalidade: (modalidadeId) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM planos WHERE modalidade_id = ?', [modalidadeId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
};
