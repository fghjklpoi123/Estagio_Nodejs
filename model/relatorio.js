const db = require('../db');

module.exports = {
  listarModalidades: () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT id, nome, descricao FROM modalidades ORDER BY nome', (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  listarAlunosPorModalidade: (modalidadeId) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT a.id AS aluno_id, a.nome AS aluno_nome, a.cpf, a.telefone, a.situacao, am.created_at AS data_matricula
                   FROM aluno_modalidade am
                   JOIN alunos a ON a.id = am.aluno_id
                   WHERE am.modalidade_id = ?
                   ORDER BY a.nome`;
      db.query(sql, [modalidadeId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  modalidadesComContagem: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT m.id AS modalidade_id, m.nome AS modalidade_nome, COALESCE(COUNT(am.aluno_id),0) AS total_alunos
                   FROM modalidades m
                   LEFT JOIN aluno_modalidade am ON am.modalidade_id = m.id
                   GROUP BY m.id
                   ORDER BY total_alunos DESC`;
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  buscarProfessorPorModalidade: (modalidadeId) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, nome, email, telefone FROM professores WHERE modalidade_id = ? LIMIT 1`;
      db.query(sql, [modalidadeId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0] || null);
      });
    });
  },

  listarAlunosSemModalidade: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT a.id, a.nome, a.cpf, a.telefone, a.email, a.created_at, a.obs
                   FROM alunos a
                   LEFT JOIN aluno_modalidade am ON am.aluno_id = a.id
                   WHERE am.modalidade_id IS NULL
                   ORDER BY a.nome`;
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
};
