// Controller de login - autentica aluno ou professor
const { buscarAlunoPorId } = require('../model/aluno');
const { buscarProfessorPorId } = require('../model/professor');
const db = require('../db');

// Simulação simples de verificação de senha (em produção usar bcrypt)
function verificarSenha(senhaEnviada, senhaArmazenada) {
    // TODO: Em produção, usar bcrypt.compare(senhaEnviada, senhaArmazenada)
    // Por enquanto, comparação simples
    return senhaEnviada === senhaArmazenada;
}

exports.loginAluno = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ erro: 'Email obrigatório' });
        }
        if (!senha || !senha.trim()) {
            return res.status(400).json({ erro: 'Senha obrigatória' });
        }

        // Buscar aluno por email
        const sql = 'SELECT * FROM alunos WHERE email = ?';
        db.query(sql, [email], (err, results) => {
            if (err) {
                console.error('Erro ao buscar aluno:', err);
                return res.status(500).json({ erro: 'Erro ao buscar aluno' });
            }

            if (!results || results.length === 0) {
                return res.status(401).json({ erro: 'Email ou senha inválidos' });
            }

            const aluno = results[0];

            // Verificar senha
            if (!verificarSenha(senha, aluno.senha)) {
                return res.status(401).json({ erro: 'Email ou senha inválidos' });
            }

            // Login bem-sucedido
            return res.json({
                mensagem: 'Login bem-sucedido',
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                    email: aluno.email,
                    tipo: 'aluno'
                }
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

        if (!email || !email.trim()) {
            return res.status(400).json({ erro: 'Email obrigatório' });
        }
        if (!senha || !senha.trim()) {
            return res.status(400).json({ erro: 'Senha obrigatória' });
        }

        // Buscar professor por email
        const sql = 'SELECT * FROM professores WHERE email = ?';
        db.query(sql, [email], (err, results) => {
            if (err) {
                console.error('Erro ao buscar professor:', err);
                return res.status(500).json({ erro: 'Erro ao buscar professor' });
            }

            if (!results || results.length === 0) {
                return res.status(401).json({ erro: 'Email ou senha inválidos' });
            }

            const professor = results[0];

            // Verificar senha
            if (!verificarSenha(senha, professor.senha)) {
                return res.status(401).json({ erro: 'Email ou senha inválidos' });
            }

            // Login bem-sucedido
            return res.json({
                mensagem: 'Login bem-sucedido',
                professor: {
                    id: professor.id,
                    nome: professor.nome,
                    email: professor.email,
                    tipo: 'professor'
                }
            });
        });

    } catch (error) {
        console.error('Erro no login de professor:', error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};

exports.logout = (req, res) => {
    // No caso de token, seria desvalidado no backend
    // Por simplicidade (sem token real), retorna confirmação
    res.json({ mensagem: 'Logout realizado com sucesso' });
};
