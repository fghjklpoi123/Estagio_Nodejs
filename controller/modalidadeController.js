const { listarModalidades, buscarModalidadePorId, cadastrarModalidade, atualizarModalidade, deletarModalidade } = require('../model/modalidade.js');

exports.listar = async (req, res) => {
    try {
        let result = await listarModalidades();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar modalidades' });
    }
}

exports.buscarUm = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await buscarModalidadePorId(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar modalidade' });
    }
}

exports.inserir = async (req, res) => {
    try {
        const { nome, descricao } = req.body;
        if (!nome || nome.trim() === '') return res.status(400).json({ error: 'Nome obrigatorio' });
        const novoId = await cadastrarModalidade({ nome, descricao });
        res.json({ id: novoId, nome, descricao });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error ao inserir modalidade' });
    }
}

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const dados = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        if (!dados || Object.keys(dados).length === 0) return res.status(400).json({ error: 'Nenhum dado enviado para atualização' });
        if ('nome' in dados && dados.nome.trim() === '') return res.status(400).json({ error: 'Nome não pode estar vazio' });

        const resultado = await atualizarModalidade(id, dados);
        if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Modalidade não encontrada' });
        return res.status(200).json({ message: 'Modalidade atualizada com sucesso', id: Number(id), atualizado: dados });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar modalidade' });
    }
}

exports.remove = async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) return res.status(400).json({ error: 'ID não encontrado' });
        await deletarModalidade(id);
        res.json({ message: 'Modalidade deletada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error ao deletar modalidade' });
    }
}
