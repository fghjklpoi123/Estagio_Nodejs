const { listarExercicios, buscarExercicioPorId, cadastrarExercicio, atualizarExercicio, deletarExercicio } = require('../model/exercicio');

exports.listar = async (req, res) => {
    try {
        const modalidadeId = req.query.modalidade_id || null;
        const result = await listarExercicios(modalidadeId);
        res.json(result);
    } catch (error) {
        console.error('Erro ao listar exercícios:', error);
        res.status(500).json({ erro: 'Erro ao listar exercícios' });
    }
};

exports.buscarUm = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });
        const result = await buscarExercicioPorId(id);
        if (!result) return res.status(404).json({ erro: 'Exercício não encontrado' });
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar exercício:', error);
        res.status(500).json({ erro: 'Erro ao buscar exercício' });
    }
};

exports.inserir = async (req, res) => {
    try {
        const { nome, descricao, modalidade_id } = req.body;
        if (!nome || nome.trim() === '') return res.status(400).json({ erro: 'Nome obrigatório' });
        if (!modalidade_id || isNaN(modalidade_id)) return res.status(400).json({ erro: 'Modalidade obrigatória' });

        const novoId = await cadastrarExercicio({ nome: nome.trim(), descricao: (descricao || '').trim(), modalidade_id: Number(modalidade_id) });
        res.status(201).json({ id: novoId, nome: nome.trim(), descricao: (descricao || '').trim(), modalidade_id: Number(modalidade_id) });
    } catch (error) {
        console.error('Erro ao inserir exercício:', error);
        res.status(500).json({ erro: 'Erro ao inserir exercício' });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const dados = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });
        if (!dados || Object.keys(dados).length === 0) return res.status(400).json({ erro: 'Nenhum dado enviado' });
        if ('nome' in dados && dados.nome.trim() === '') return res.status(400).json({ erro: 'Nome não pode estar vazio' });
        if ('modalidade_id' in dados && isNaN(Number(dados.modalidade_id))) return res.status(400).json({ erro: 'modalidade_id inválido' });

        const resultado = await atualizarExercicio(id, dados);
        if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Exercício não encontrado' });
        res.json({ message: 'Exercício atualizado com sucesso', id: Number(id) });
    } catch (error) {
        console.error('Erro ao atualizar exercício:', error);
        res.status(500).json({ erro: 'Erro ao atualizar exercício' });
    }
};

exports.deletar = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });
        await deletarExercicio(id);
        res.json({ message: 'Exercício deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar exercício:', error);
        res.status(500).json({ erro: 'Erro ao deletar exercício' });
    }
};
