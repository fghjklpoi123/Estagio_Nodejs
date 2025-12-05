const { listarProfessores, buscarProfessorPorId, cadastrarProfessor, atualizarProfessor, deletarProfessor } = require('../model/professor.js');

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
    try {
        let result = await listarProfessores();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar professores' });
    }
}

exports.buscarUm = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await buscarProfessorPorId(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar professor' });
    }
}

exports.inserir = async (req, res) => {
    try {
        const { name, cpf, telefone, sexo, data_nascimento, email, senha, modalidade_id } = req.body;

        if (!name || name.trim() === '') return res.status(400).json({ error: 'Nome obrigatorio' });
        
        const cpfDigits = String(cpf).replace(/\D/g, '');
        if (!cpf || cpf.trim() === '' || cpfDigits.length !== 11) return res.status(400).json({ error: 'CPF obrigatorio e deve ter 11 digitos' });
        if (!validarCPF(cpfDigits)) return res.status(400).json({ error: 'CPF inválido' });
        
        if (!telefone || telefone.trim() === '') return res.status(400).json({ error: 'Telefone obrigatorio' });
        if (sexo !== 'M' && sexo !== 'F' && sexo !== 'O') return res.status(400).json({ error: "Sexo deve ser 'M', 'F' ou 'O'" });
        if (!data_nascimento || isNaN(Date.parse(data_nascimento))) return res.status(400).json({ error: 'Data de nascimento obrigatoria e deve ser uma data valida' });
        if (!email || email.trim() === '') return res.status(400).json({ error: 'Email obrigatorio' });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email).toLowerCase())) return res.status(400).json({ error: 'Email invalido' });
        if (!senha || senha.trim() === '' || senha.length < 6) return res.status(400).json({ error: 'Senha obrigatoria e deve ter pelo menos 6 caracteres' });
        if (!('modalidade_id' in req.body) || !modalidade_id) return res.status(400).json({ error: 'Modalidade obrigatoria para treinador' });

        const professorObj = { nome: name, cpf: cpfDigits, telefone, sexo, data_nascimento, email, senha, modalidade_id };
        const novoId = await cadastrarProfessor(professorObj);

        res.json({ id: novoId, nome: name, cpf, telefone, sexo, data_nascimento, email, modalidade_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error ao inserir professor' });
    }
}

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const dados = Object.assign({}, req.body);

        if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        if (!dados || Object.keys(dados).length === 0) return res.status(400).json({ error: 'Nenhum dado enviado para atualização' });

        if ('name' in dados) { dados.nome = dados.name; delete dados.name; }

        if ('nome' in dados && (dados.nome.trim() === '')) return res.status(400).json({ error: 'Nome não pode estar vazio' });
        if ('cpf' in dados) {
            const cpfNorm = String(dados.cpf).replace(/\D/g,'');
            if (cpfNorm.length !== 11) return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
            if (!validarCPF(cpfNorm)) return res.status(400).json({ error: 'CPF inválido' });
            dados.cpf = cpfNorm;
        }
        if ('email' in dados) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(String(dados.email||'').toLowerCase())) return res.status(400).json({ error: 'Email invalido' });
        }
        if ('telefone' in dados && dados.telefone && dados.telefone.trim() === '') return res.status(400).json({ error: 'Telefone não pode estar vazio' });
        if ('sexo' in dados && !['M','F','O'].includes(dados.sexo)) return res.status(400).json({ error: "Sexo deve ser 'M', 'F' ou 'O'" });
        if ('data_nascimento' in dados && isNaN(Date.parse(dados.data_nascimento))) return res.status(400).json({ error: 'Data de nascimento inválida' });
        if ('modalidade_id' in dados && dados.modalidade_id && isNaN(Number(dados.modalidade_id))) return res.status(400).json({ error: 'modalidade_id inválido' });

        const resultado = await atualizarProfessor(id, dados);

        if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Professor não encontrado' });

        return res.status(200).json({ message: 'Professor atualizado com sucesso', id: Number(id), atualizado: dados });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar professor' });
    }
}

exports.remove = async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) return res.status(400).json({ error: 'ID não encontrado' });
        await deletarProfessor(id);
        res.json({ message: 'Professor deletado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error ao deletar professor' });
    }
}
