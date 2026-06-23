const db = require('../db');

const aulaSchema = `CREATE TABLE IF NOT EXISTS aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    professor_id INT NOT NULL,
    modalidade_id INT NOT NULL,
    data_aula DATE NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    FOREIGN KEY (modalidade_id) REFERENCES modalidades(id) ON DELETE CASCADE
);`;

const aulaExercicioSchema = `CREATE TABLE IF NOT EXISTS aula_exercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aula_id INT NOT NULL,
    exercicio_id INT NOT NULL,
    series INT DEFAULT NULL,
    repeticoes VARCHAR(50) DEFAULT NULL,
    carga VARCHAR(50) DEFAULT NULL,
    duracao_min INT DEFAULT NULL,
    observacao TEXT,
    FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE,
    FOREIGN KEY (exercicio_id) REFERENCES exercicios(id) ON DELETE CASCADE
);`;

db.query(aulaSchema, (err) => {
    if (err) console.error('Erro criando tabela aulas:', err);
});
db.query(aulaExercicioSchema, (err) => {
    if (err) console.error('Erro criando tabela aula_exercicios:', err);
});

module.exports = {
    listarAulas: (filtros = {}) => {
        return new Promise((resolve, reject) => {
            let sql = `SELECT a.*, al.nome AS aluno_nome, p.nome AS professor_nome, m.nome AS modalidade_nome
                        FROM aulas a
                        JOIN alunos al ON al.id = a.aluno_id
                        JOIN professores p ON p.id = a.professor_id
                        JOIN modalidades m ON m.id = a.modalidade_id`;
            const where = [];
            const params = [];
            if (filtros.aluno_id) { where.push('a.aluno_id = ?'); params.push(filtros.aluno_id); }
            if (filtros.professor_id) { where.push('a.professor_id = ?'); params.push(filtros.professor_id); }
            if (filtros.modalidade_id) { where.push('a.modalidade_id = ?'); params.push(filtros.modalidade_id); }
            if (where.length) sql += ' WHERE ' + where.join(' AND ');
            sql += ' ORDER BY a.data_aula DESC';
            db.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },

    buscarAulaPorId: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT a.*, al.nome AS aluno_nome, p.nome AS professor_nome, m.nome AS modalidade_nome
                         FROM aulas a
                         JOIN alunos al ON al.id = a.aluno_id
                         JOIN professores p ON p.id = a.professor_id
                         JOIN modalidades m ON m.id = a.modalidade_id
                         WHERE a.id = ?`;
            db.query(sql, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    },

    buscarExerciciosDaAula: (aulaId) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT ae.*, e.nome AS exercicio_nome, e.descricao AS exercicio_descricao
                         FROM aula_exercicios ae
                         JOIN exercicios e ON e.id = ae.exercicio_id
                         WHERE ae.aula_id = ?
                         ORDER BY ae.id`;
            db.query(sql, [aulaId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },

    criarAula: (aula) => {
        const { aluno_id, professor_id, modalidade_id, data_aula, observacao } = aula;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO aulas (aluno_id, professor_id, modalidade_id, data_aula, observacao) VALUES (?, ?, ?, ?, ?)`;
            db.query(sql, [aluno_id, professor_id, modalidade_id, data_aula, observacao || null], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    },

    inserirExerciciosAula: (aulaId, exercicios) => {
        if (!exercicios || exercicios.length === 0) return Promise.resolve();
        const sql = `INSERT INTO aula_exercicios (aula_id, exercicio_id, series, repeticoes, carga, duracao_min, observacao) VALUES ?`;
        const values = exercicios.map((e) => [
            aulaId, e.exercicio_id,
            e.series || null, e.repeticoes || null, e.carga || null,
            e.duracao_min || null, e.observacao || null,
        ]);
        return new Promise((resolve, reject) => {
            db.query(sql, [values], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    },

    atualizarAula: (id, dados) => {
        const campos = [];
        const valores = [];
        const allowed = ['aluno_id', 'professor_id', 'modalidade_id', 'data_aula', 'observacao'];
        allowed.forEach((k) => { if (k in dados) { campos.push(`${k} = ?`); valores.push(dados[k]); } });
        if (campos.length === 0) return Promise.resolve({ affectedRows: 0 });
        valores.push(id);
        const sql = `UPDATE aulas SET ${campos.join(', ')} WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.query(sql, valores, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },

    limparExerciciosAula: (aulaId) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM aula_exercicios WHERE aula_id = ?', [aulaId], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    },

    deletarAula: (id) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM aulas WHERE id = ?', [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },
};
