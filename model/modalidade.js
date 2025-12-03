const db = require('../db');

const modalidadeSchema = `CREATE TABLE IF NOT EXISTS modalidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

db.query(modalidadeSchema, (err) => {
    if (err) console.error('Erro criando tabela modalidades:', err);
});

module.exports = {
    listarModalidades: () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM modalidades', (error, results) => {
                if (error) { reject(error); return }
                resolve(results);
            })
        })
    },

    buscarModalidadePorId: (id) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM modalidades WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        })
    },

    cadastrarModalidade: (modalidade) => {
        const { nome, descricao } = modalidade;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO modalidades (nome, descricao) VALUES (?, ?)`;
            db.query(sql, [nome, descricao], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            })
        });
    },

    atualizarModalidade: (id, dados) => {
        const campos = [];
        const valores = [];
        const allowed = ['nome', 'descricao'];
        allowed.forEach((k) => { if (k in dados) { campos.push(`${k} = ?`); valores.push(dados[k]); } });
        if (campos.length === 0) return Promise.resolve({affectedRows:0});
        valores.push(id);
        const sql = `UPDATE modalidades SET ${campos.join(', ')} WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.query(sql, valores, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    },

    deletarModalidade: (id) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM modalidades WHERE id = ?', [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    }
}
