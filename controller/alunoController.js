const { listarAlunos, buscarAlunoPorId, cadastrarAluno, atualizarAluno, deletarAluno } = require('../model/aluno.js');
const { listarModalidadesPorAluno } = require('../model/alunoModalidade');
const { buscarPlanosPorModalidade } = require('../model/plano');
const { buscarUltimaInscricaoPorAluno } = require('../model/alunoModalidade');

function validarCPF(cpf) {
    cpf = String(cpf).replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf[10]);
}

exports.listar = async (req, res) => {
    let result = await listarAlunos()
    res.json(result);
}

exports.buscarUm = async (req, res) => {
    let id = req.params.id;
    let result = await buscarAlunoPorId(id);
    res.json(result);
}

exports.inserir = async (req, res) => {
    try {
        const { name, nome: nomeBody, cpf, telefone, sexo, data_nascimento, email, senha, endereco, situacao, obs } = req.body;
        const nomeFinal = (name || nomeBody || '').trim();
        if (!nomeFinal) {
            return res.status(400).json({
                error: 'Nome obrigatorio'
            });
        }
        if (!cpf || String(cpf).replace(/\D/g,'').trim() === '') {
            return res.status(400).json({ error: 'CPF obrigatorio' });
        }

        const cpfDigits = String(cpf).replace(/\D/g, '');
        if (cpfDigits.length !== 11) return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
        if (!validarCPF(cpfDigits)) return res.status(400).json({ error: 'CPF inválido' });
        req.body.cpf = cpfDigits;

        if (sexo !== 'M' && sexo !== 'F' && sexo !== 'O') {
            return res.status(400).json({
                error: "Sexo deve ser 'M', 'F' ou 'O'"
            });
        }

        if (!data_nascimento || isNaN(Date.parse(data_nascimento))) {
            return res.status(400).json({
                error: 'Data de nascimento obrigatoria e deve ser uma data valida'
            });
        }

        if (!email || email.trim() === '') {
            return res.status(400).json({ error: 'Email obrigatorio' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email).toLowerCase())) return res.status(400).json({ error: 'Email invalido' });

        if (!senha || senha.trim() === '' || senha.length < 6) {
            return res.status(400).json({
                error: 'Senha obrigatoria e deve ter pelo menos 6 caracteres'
            });
        }

        const alunoObj = { nome: nomeFinal, cpf: req.body.cpf, telefone: telefone || '', sexo, data_nascimento, email, senha, endereco: endereco || '', situacao: situacao || 'Ativo', obs: obs || '' };
        const novoId = await cadastrarAluno(alunoObj);
        res.json({ id: novoId, ...alunoObj });
    } catch (error) {
        res.status(500).json({ error: 'Error ao inserir aluno' });
    }
}

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const dados = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        if (!dados || Object.keys(dados).length === 0) {
            return res.status(400).json({ error: 'Nenhum dado enviado para atualização' });
        }

        if ('nome' in dados && (dados.nome.trim() === '')) {
            return res.status(400).json({ error: 'Nome não pode estar vazio' });
        }

        if ('cpf' in dados) {
            const cpfNormalized = String(dados.cpf).replace(/\D/g, '');
            if (cpfNormalized.length !== 11) {
                return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
            }
            if (!validarCPF(cpfNormalized)) {
                return res.status(400).json({ error: 'CPF inválido' });
            }
            dados.cpf = cpfNormalized;
        }

        if ('telefone' in dados && dados.telefone && dados.telefone.trim() === '') {
            return res.status(400).json({ error: 'Telefone não pode estar vazio' });
        }

        if ('sexo' in dados && !['M', 'F', 'O'].includes(dados.sexo)) {
            return res.status(400).json({ error: "Sexo deve ser 'M', 'F' ou 'O'" });
        }

        if ('data_nascimento' in dados) {
            if (isNaN(Date.parse(dados.data_nascimento))) {
                return res.status(400).json({ error: 'Data de nascimento inválida' });
            }
        }

        const resultado = await atualizarAluno(id, dados);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        return res.status(200).json({
            message: 'Aluno atualizado com sucesso',
            id: Number(id),
            atualizado: dados
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
}

exports.remove = async (req, res) => {
    try {
        let id = req.params.id;

        if (!id) {
            return res.status(400).json({
                error: 'ID não encontrado'
            });
        }

        await deletarAluno(id);
        res.json({
            message: 'Aluno deletado com sucesso'
        });

    } catch (error) {
        res.status(500).json({ error: 'Error ao deletar contato' });
    }
}

exports.getPlano = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });

        const ultima = await buscarUltimaInscricaoPorAluno(id);
        if (!ultima) {
            return res.status(200).json(null);
        }

        const modalidadeId = ultima.modalidade_id;
        const planos = await buscarPlanosPorModalidade(modalidadeId) || [];
        if (!planos.length) return res.status(200).json(null);

        planos.sort((a,b)=>{
            const ta = new Date(a.created_at || a.createdAt || 0).getTime();
            const tb = new Date(b.created_at || b.createdAt || 0).getTime();
            return tb - ta;
        });

        const plano = planos[0];
        return res.json(plano);
    } catch (error) {
        console.error('Erro ao obter plano do aluno:', error);
        return res.status(500).json({ erro: 'Erro ao obter plano do aluno' });
    }
}