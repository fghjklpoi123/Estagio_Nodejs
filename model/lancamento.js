const db = require('../db');

const lancamentoSchema = `CREATE TABLE IF NOT EXISTS lancamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('receita','despesa') NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    data DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

db.query(lancamentoSchema, (err) => {
    if (err) console.error('Erro criando tabela lancamentos:', err);
});

module.exports = {
    listarLancamentos: (filtros = {}) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM lancamentos';
            const where = [];
            const params = [];

            if (filtros.tipo) { where.push('tipo = ?'); params.push(filtros.tipo); }
            if (filtros.categoria) { where.push('categoria = ?'); params.push(filtros.categoria); }
            if (filtros.mes && filtros.ano) {
                where.push('MONTH(data) = ? AND YEAR(data) = ?');
                params.push(filtros.mes, filtros.ano);
            } else if (filtros.ano) {
                where.push('YEAR(data) = ?');
                params.push(filtros.ano);
            }
            if (filtros.data_inicio && filtros.data_fim) {
                where.push('data BETWEEN ? AND ?');
                params.push(filtros.data_inicio, filtros.data_fim);
            }

            if (where.length) sql += ' WHERE ' + where.join(' AND ');
            sql += ' ORDER BY data DESC, id DESC';

            db.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },

    buscarLancamentoPorId: (id) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM lancamentos WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    },

    cadastrarLancamento: (dados) => {
        const { tipo, categoria, descricao, valor, data } = dados;
        return new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO lancamentos (tipo, categoria, descricao, valor, data) VALUES (?, ?, ?, ?, ?)',
                [tipo, categoria, descricao || null, valor, data],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result.insertId);
                }
            );
        });
    },

    atualizarLancamento: (id, dados) => {
        const campos = [];
        const valores = [];
        const allowed = ['tipo', 'categoria', 'descricao', 'valor', 'data'];
        allowed.forEach((k) => { if (k in dados) { campos.push(`${k} = ?`); valores.push(dados[k]); } });
        if (campos.length === 0) return Promise.resolve({ affectedRows: 0 });
        valores.push(id);
        return new Promise((resolve, reject) => {
            db.query(`UPDATE lancamentos SET ${campos.join(', ')} WHERE id = ?`, valores, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },

    deletarLancamento: (id) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM lancamentos WHERE id = ?', [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },

    obterResumo: (filtros = {}) => {
        return new Promise((resolve, reject) => {
            let sql = `SELECT
                COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END), 0) AS total_receitas,
                COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END), 0) AS total_despesas
                FROM lancamentos`;
            const where = [];
            const params = [];

            if (filtros.mes && filtros.ano) {
                where.push('MONTH(data) = ? AND YEAR(data) = ?');
                params.push(filtros.mes, filtros.ano);
            } else if (filtros.ano) {
                where.push('YEAR(data) = ?');
                params.push(filtros.ano);
            }

            if (where.length) sql += ' WHERE ' + where.join(' AND ');

            db.query(sql, params, (err, results) => {
                if (err) return reject(err);
                const r = results[0] || { total_receitas: 0, total_despesas: 0 };
                r.balanco = parseFloat(r.total_receitas) - parseFloat(r.total_despesas);
                resolve(r);
            });
        });
    },
};
