exports.verificarAluno = (req, res, next) => {
    
    let alunoId = req.headers['x-aluno-id'];

    if (!alunoId) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
    
        }
    }

    if (!alunoId || isNaN(alunoId)) {
        return res.status(401).json({ erro: 'Autenticação obrigatória. Envie X-Aluno-Id no header ou Bearer token.' });
    }

    req.alunoId = Number(alunoId);
    next();
};
