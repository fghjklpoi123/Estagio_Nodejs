// Middleware de autenticação simples
// Extrai alunoId de um header personalizado ou de um token decodificado
// Para produção, usar JWT com verificação de assinatura

exports.verificarAluno = (req, res, next) => {
    // Buscar alunoId em:
    // 1. Header 'X-Aluno-Id' (para testes simples e desenvolvimento)
    // 2. Token Bearer decodificado (para produção com JWT)
    
    let alunoId = req.headers['x-aluno-id'];
    
    // Se não houver x-aluno-id, tentar extrair de Authorization Bearer (futuro: JWT)
    if (!alunoId) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // TODO: implementar JWT decode e extrair sub/alunoId
            // const token = authHeader.substring(7);
            // const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // alunoId = decoded.alunoId || decoded.sub;
        }
    }

    if (!alunoId || isNaN(alunoId)) {
        return res.status(401).json({ erro: 'Autenticação obrigatória. Envie X-Aluno-Id no header ou Bearer token.' });
    }

    req.alunoId = Number(alunoId);
    next();
};
