const { listarLogs } = require('../model/log');

exports.listar = async (req, res) => {
    try {
        const filtros = {};
        if (req.query.usuario_tipo) filtros.usuario_tipo = req.query.usuario_tipo;
        if (req.query.metodo) filtros.metodo = req.query.metodo;
        if (req.query.usuario_nome) filtros.usuario_nome = req.query.usuario_nome;
        if (req.query.data) filtros.data = req.query.data;
        if (req.query.rota) filtros.rota = req.query.rota;
        const result = await listarLogs(filtros);
        res.json(result);
    } catch (error) {
        console.error('Erro ao listar logs:', error);
        res.status(500).json({ erro: 'Erro ao listar logs' });
    }
};
