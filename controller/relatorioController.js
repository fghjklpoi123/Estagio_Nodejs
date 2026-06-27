const db = require('../db');

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

exports.dinamico = async (req, res) => {
    try {
        const { entidade } = req.query;
        if (!entidade) return res.status(400).json({ erro: 'Selecione uma entidade' });

        let resultado;

        switch (entidade) {
            case 'alunos': resultado = await relatorioAlunos(req.query); break;
            case 'financeiro': resultado = await relatorioFinanceiro(req.query); break;
            case 'presencas': resultado = await relatorioPresencas(req.query); break;
            case 'planos': resultado = await relatorioPlanos(req.query); break;
            case 'modalidades': resultado = await relatorioModalidades(req.query); break;
            default: return res.status(400).json({ erro: 'Entidade inválida' });
        }

        res.json(resultado);
    } catch (error) {
        console.error('Erro relatório dinâmico:', error);
        res.status(500).json({ erro: 'Erro ao gerar relatório' });
    }
};

async function relatorioAlunos(filtros) {
    let sql = `SELECT a.id, a.nome, a.cpf, a.email, a.telefone, a.sexo, a.situacao, a.data_nascimento,
               GROUP_CONCAT(DISTINCT m.nome SEPARATOR ', ') AS modalidades,
               COUNT(DISTINCT ap.plano_id) AS total_planos
               FROM alunos a
               LEFT JOIN aluno_modalidade am ON am.aluno_id = a.id
               LEFT JOIN modalidades m ON m.id = am.modalidade_id
               LEFT JOIN aluno_plano ap ON ap.aluno_id = a.id`;
    const where = [];
    const params = [];

    if (filtros.situacao) { where.push('a.situacao = ?'); params.push(filtros.situacao); }
    if (filtros.sexo) { where.push('a.sexo = ?'); params.push(filtros.sexo); }
    if (filtros.modalidade_id) { where.push('am.modalidade_id = ?'); params.push(filtros.modalidade_id); }
    if (filtros.sem_modalidade === 'true') { where.push('am.modalidade_id IS NULL'); }
    if (filtros.sem_plano === 'true') { where.push('ap.plano_id IS NULL'); }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY a.id ORDER BY a.nome';

    const rows = await query(sql, params);
    return { entidade: 'alunos', total: rows.length, dados: rows };
}

async function relatorioFinanceiro(filtros) {
    let sql = `SELECT tipo, categoria, SUM(valor) AS total, COUNT(*) AS quantidade FROM lancamentos`;
    const where = [];
    const params = [];

    if (filtros.tipo) { where.push('tipo = ?'); params.push(filtros.tipo); }
    if (filtros.categoria) { where.push('categoria = ?'); params.push(filtros.categoria); }
    if (filtros.mes && filtros.ano) { where.push('MONTH(data) = ? AND YEAR(data) = ?'); params.push(filtros.mes, filtros.ano); }
    else if (filtros.ano) { where.push('YEAR(data) = ?'); params.push(filtros.ano); }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY tipo, categoria ORDER BY tipo, total DESC';

    const rows = await query(sql, params);

    const totalReceitas = rows.filter(r => r.tipo === 'receita').reduce((s, r) => s + parseFloat(r.total), 0);
    const totalDespesas = rows.filter(r => r.tipo === 'despesa').reduce((s, r) => s + parseFloat(r.total), 0);

    return {
        entidade: 'financeiro',
        resumo: { total_receitas: totalReceitas, total_despesas: totalDespesas, balanco: totalReceitas - totalDespesas },
        dados: rows,
    };
}

async function relatorioPresencas(filtros) {
    let sql = `SELECT a.nome AS aluno_nome, COUNT(c.id) AS total_checkins,
               MIN(c.data_hora) AS primeiro_checkin, MAX(c.data_hora) AS ultimo_checkin
               FROM checkins c
               JOIN alunos a ON a.id = c.aluno_id`;
    const where = [];
    const params = [];

    if (filtros.mes && filtros.ano) { where.push('MONTH(c.data_hora) = ? AND YEAR(c.data_hora) = ?'); params.push(filtros.mes, filtros.ano); }
    else if (filtros.ano) { where.push('YEAR(c.data_hora) = ?'); params.push(filtros.ano); }
    if (filtros.aluno_id) { where.push('c.aluno_id = ?'); params.push(filtros.aluno_id); }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY c.aluno_id ORDER BY total_checkins DESC';

    const rows = await query(sql, params);
    const totalGeral = rows.reduce((s, r) => s + Number(r.total_checkins), 0);

    return { entidade: 'presencas', total_checkins: totalGeral, dados: rows };
}

async function relatorioPlanos(filtros) {
    let sql = `SELECT p.id, p.descricao, p.preco, m.nome AS modalidade,
               COUNT(DISTINCT ap.aluno_id) AS total_assinantes,
               (p.preco * COUNT(DISTINCT ap.aluno_id)) AS receita_estimada
               FROM planos p
               LEFT JOIN modalidades m ON m.id = p.modalidade_id
               LEFT JOIN aluno_plano ap ON ap.plano_id = p.id`;
    const where = [];
    const params = [];

    if (filtros.modalidade_id) { where.push('p.modalidade_id = ?'); params.push(filtros.modalidade_id); }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY p.id ORDER BY total_assinantes DESC';

    const rows = await query(sql, params);
    return { entidade: 'planos', total: rows.length, dados: rows };
}

async function relatorioModalidades(filtros) {
    let sql = `SELECT m.id, m.nome, m.descricao,
               COUNT(DISTINCT am.aluno_id) AS total_alunos,
               COUNT(DISTINCT e.id) AS total_exercicios,
               GROUP_CONCAT(DISTINCT p2.nome SEPARATOR ', ') AS professores
               FROM modalidades m
               LEFT JOIN aluno_modalidade am ON am.modalidade_id = m.id
               LEFT JOIN exercicios e ON e.modalidade_id = m.id
               LEFT JOIN professores p2 ON p2.modalidade_id = m.id`;
    const where = [];
    const params = [];

    if (filtros.sem_alunos === 'true') {
        // handled in HAVING
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY m.id';
    if (filtros.sem_alunos === 'true') sql += ' HAVING total_alunos = 0';
    sql += ' ORDER BY total_alunos DESC';

    const rows = await query(sql, params);
    return { entidade: 'modalidades', total: rows.length, dados: rows };
}
