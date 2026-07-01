const db = require('../db');
const { gerarToken } = require('../middleware/auth');

function verificarSenha(senhaEnviada, senhaArmazenada) {
    return senhaEnviada === senhaArmazenada;
}

exports.loginAluno = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !email.trim()) return res.status(400).json({ erro: 'Email obrigatório' });
        if (!senha || !senha.trim()) return res.status(400).json({ erro: 'Senha obrigatória' });

        db.query('SELECT * FROM alunos WHERE email = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao buscar aluno' });
            if (!results || results.length === 0) return res.status(401).json({ erro: 'Email ou senha inválidos' });

            const aluno = results[0];
            if (!verificarSenha(senha, aluno.senha)) return res.status(401).json({ erro: 'Email ou senha inválidos' });

            const token = gerarToken({ id: aluno.id, tipo: 'aluno', nome: aluno.nome });
            return res.json({
                mensagem: 'Login bem-sucedido',
                token,
                aluno: { id: aluno.id, nome: aluno.nome, email: aluno.email, tipo: 'aluno' }
            });
        });
    } catch (error) {
        console.error('Erro no login de aluno:', error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};

exports.loginProfessor = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !email.trim()) return res.status(400).json({ erro: 'Email obrigatório' });
        if (!senha || !senha.trim()) return res.status(400).json({ erro: 'Senha obrigatória' });

        db.query('SELECT * FROM professores WHERE email = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao buscar professor' });
            if (!results || results.length === 0) return res.status(401).json({ erro: 'Email ou senha inválidos' });

            const professor = results[0];
            if (!verificarSenha(senha, professor.senha)) return res.status(401).json({ erro: 'Email ou senha inválidos' });

            const token = gerarToken({ id: professor.id, tipo: 'professor', nome: professor.nome });
            return res.json({
                mensagem: 'Login bem-sucedido',
                token,
                professor: { id: professor.id, nome: professor.nome, email: professor.email, tipo: 'professor' }
            });
        });
    } catch (error) {
        console.error('Erro no login de professor:', error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !email.trim()) return res.status(400).json({ erro: 'Email obrigatório' });
        if (!senha || !senha.trim()) return res.status(400).json({ erro: 'Senha obrigatória' });

        db.query('SELECT * FROM admins WHERE email = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao buscar admin' });
            if (!results || results.length === 0) return res.status(401).json({ erro: 'Email ou senha inválidos' });

            const admin = results[0];
            if (!verificarSenha(senha, admin.senha)) return res.status(401).json({ erro: 'Email ou senha inválidos' });

            const token = gerarToken({ id: admin.id, tipo: 'admin', nome: admin.nome });
            return res.json({
                mensagem: 'Login bem-sucedido',
                token,
                admin: { id: admin.id, nome: admin.nome, email: admin.email, tipo: 'admin' }
            });
        });
    } catch (error) {
        console.error('Erro no login de admin:', error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};

exports.logout = (req, res) => {
    res.json({ mensagem: 'Logout realizado com sucesso' });
};
