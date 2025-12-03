const db = require('../db');

const professorSchema = `CREATE TABLE IF NOT EXISTS professores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    sexo ENUM('M','F','O') DEFAULT 'O',
    data_nascimento DATE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    modalidade_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modalidade_id) REFERENCES modalidades(id) ON DELETE SET NULL
);`;


db.query(professorSchema, (err) => {
    if (err) console.error('Erro criando tabela professores:', err);
});

module.exports = {
    listarProfessores: () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM professores', (error, results) => {
                if (error) { reject(error); return }
                resolve(results);
            })
        })
    },

    buscarProfessorPorId: (id) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM professores WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        })
    },

    cadastrarProfessor: (professor) => {
        const { nome, cpf, telefone, sexo, data_nascimento, email, senha, modalidade_id } = professor;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO professores (nome, cpf, telefone, sexo, data_nascimento, email, senha, modalidade_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [nome, cpf, telefone, sexo, data_nascimento, email, senha, modalidade_id], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            })
        });
    },

    atualizarProfessor: (id, dados) => {
        const campos = [];
        const valores = [];
        const allowed = ['nome','cpf','telefone','sexo','data_nascimento','email','senha','modalidade_id'];
        allowed.forEach((k) => { if (k in dados) { campos.push(`${k} = ?`); valores.push(dados[k]); } });
        if (campos.length === 0) return Promise.resolve({affectedRows:0});
        valores.push(id);
        const sql = `UPDATE professores SET ${campos.join(', ')} WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.query(sql, valores, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    },

    deletarProfessor: (id) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM professores WHERE id = ?', [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    }
}