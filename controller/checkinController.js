const { registrarCheckin, buscarCheckinHoje, listarCheckinsPorAluno, listarTodosCheckins, contarCheckinsHoje } = require('../model/checkin');

exports.registrar = async (req, res) => {
    try {
        const alunoId = req.usuario.id;

        const jaFez = await buscarCheckinHoje(alunoId);
        if (jaFez) {
            return res.status(409).json({ erro: 'Você já fez check-in hoje', checkin: jaFez });
        }

        const id = await registrarCheckin(alunoId);
        res.status(201).json({ id, mensagem: 'Check-in realizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar check-in:', error);
        res.status(500).json({ erro: 'Erro ao registrar check-in' });
    }
};

exports.statusHoje = async (req, res) => {
    try {
        const alunoId = req.usuario.id;
        const checkin = await buscarCheckinHoje(alunoId);
        res.json({ fezCheckin: !!checkin, checkin });
    } catch (error) {
        console.error('Erro ao verificar check-in:', error);
        res.status(500).json({ erro: 'Erro ao verificar check-in' });
    }
};

exports.historico = async (req, res) => {
    try {
        const alunoId = req.usuario.id;
        const checkins = await listarCheckinsPorAluno(alunoId);
        res.json(checkins);
    } catch (error) {
        console.error('Erro ao listar histórico:', error);
        res.status(500).json({ erro: 'Erro ao listar histórico' });
    }
};

exports.listarTodos = async (req, res) => {
    try {
        const filtros = {};
        if (req.query.aluno_id) filtros.aluno_id = req.query.aluno_id;
        if (req.query.data) filtros.data = req.query.data;
        if (req.query.data_inicio && req.query.data_fim) {
            filtros.data_inicio = req.query.data_inicio;
            filtros.data_fim = req.query.data_fim;
        }
        const checkins = await listarTodosCheckins(filtros);
        res.json(checkins);
    } catch (error) {
        console.error('Erro ao listar check-ins:', error);
        res.status(500).json({ erro: 'Erro ao listar check-ins' });
    }
};

exports.totalHoje = async (req, res) => {
    try {
        const total = await contarCheckinsHoje();
        res.json({ total });
    } catch (error) {
        console.error('Erro ao contar check-ins:', error);
        res.status(500).json({ erro: 'Erro ao contar check-ins' });
    }
};
