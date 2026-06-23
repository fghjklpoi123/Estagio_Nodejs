const db = require('../db');

const alunosSchema = `CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    sexo ENUM('M','F','O') DEFAULT 'O',
    data_nascimento DATE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    endereco VARCHAR(255),
    situacao VARCHAR(50),
    obs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

db.query(alunosSchema, (err) => {
    if (err) console.error('Erro criando tabela alunos:', err);
});

module.exports = {
    listarAlunos: () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM alunos', (error, results) => {
                if (error) { reject(error); return }
                resolve(results);
            })
        })
    },

    buscarAlunoPorId: (id) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM alunos WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        })
    },

    cadastrarAluno: (aluno) => {
        const { nome, cpf, telefone, sexo, data_nascimento, email, senha, endereco, situacao, obs } = aluno;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO alunos (nome, cpf, telefone, sexo, data_nascimento, email, senha, endereco, situacao, obs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [nome, cpf, telefone, sexo, data_nascimento, email, senha, endereco || null, situacao || null, obs || null], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            })
        });
    },

    atualizarAluno: (id, dados) => {
        const campos = [];
        const valores = [];
        const allowed = ['nome','cpf','telefone','sexo','data_nascimento','email','senha','endereco','situacao','obs'];
        allowed.forEach((k) => { if (k in dados) { campos.push(`${k} = ?`); valores.push(dados[k]); } });
        if (campos.length === 0) return Promise.resolve({affectedRows:0});
        valores.push(id);
        const sql = `UPDATE alunos SET ${campos.join(', ')} WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.query(sql, valores, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    },

    deletarAluno: (id) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM alunos WHERE id = ?', [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    }
}