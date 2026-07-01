const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'acadflow_jwt_fallback';

function gerarToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function autenticar(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    try {
        req.usuario = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
}

function autorizar(...tiposPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Não autenticado' });
        }
        if (!tiposPermitidos.includes(req.usuario.tipo)) {
            return res.status(403).json({ erro: 'Acesso negado para este tipo de usuário' });
        }
        next();
    };
}

function verificarAluno(req, res, next) {
    if (req.usuario && req.usuario.tipo === 'aluno') {
        req.alunoId = req.usuario.id;
        return next();
    }

    const alunoId = req.headers['x-aluno-id'];
    if (alunoId && !isNaN(alunoId)) {
        req.alunoId = Number(alunoId);
        return next();
    }

    return res.status(403).json({ erro: 'Apenas alunos podem realizar esta ação' });
}

module.exports = { gerarToken, autenticar, autorizar, verificarAluno };
