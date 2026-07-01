const { registrarLog } = require('../model/log');

function loggerMiddleware(req, res, next) {
    res.on('finish', () => {
        if (req.path === '/api/logs') return;

        const dados = {
            usuario_id: req.usuario?.id || null,
            usuario_tipo: req.usuario?.tipo || null,
            usuario_nome: req.usuario?.nome || null,
            metodo: req.method,
            rota: req.originalUrl || req.url,
            status_code: res.statusCode,
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        };

        registrarLog(dados).catch((err) => {
            console.error('Erro ao registrar log:', err.message);
        });
    });

    next();
}

module.exports = loggerMiddleware;
