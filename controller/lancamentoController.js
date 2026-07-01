const { listarLancamentos, buscarLancamentoPorId, cadastrarLancamento, atualizarLancamento, deletarLancamento, obterResumo } = require('../model/lancamento');

exports.listar = async (req, res) => {
    try {
        const filtros = {};
        if (req.query.tipo) filtros.tipo = req.query.tipo;
        if (req.query.categoria) filtros.categoria = req.query.categoria;
        if (req.query.mes) filtros.mes = req.query.mes;
        if (req.query.ano) filtros.ano = req.query.ano;
        if (req.query.data_inicio && req.query.data_fim) {
            filtros.data_inicio = req.query.data_inicio;
            filtros.data_fim = req.query.data_fim;
        }
        const result = await listarLancamentos(filtros);
        res.json(result);
    } catch (error) {
        console.error('Erro ao listar lançamentos:', error);
        res.status(500).json({ erro: 'Erro ao listar lançamentos' });
    }
};

exports.resumo = async (req, res) => {
    try {
        const filtros = {};
        if (req.query.mes) filtros.mes = req.query.mes;
        if (req.query.ano) filtros.ano = req.query.ano;
        const result = await obterResumo(filtros);
        res.json(result);
    } catch (error) {
        console.error('Erro ao obter resumo:', error);
        res.status(500).json({ erro: 'Erro ao obter resumo financeiro' });
    }
};

exports.criar = async (req, res) => {
    try {
        const { tipo, categoria, descricao, valor, data } = req.body;
        if (!tipo || !['receita', 'despesa'].includes(tipo)) return res.status(400).json({ erro: 'Tipo deve ser receita ou despesa' });
        if (!categoria || categoria.trim() === '') return res.status(400).json({ erro: 'Categoria obrigatória' });
        if (!valor || isNaN(valor) || parseFloat(valor) <= 0) return res.status(400).json({ erro: 'Valor deve ser maior que 0' });
        if (!data) return res.status(400).json({ erro: 'Data obrigatória' });

        const id = await cadastrarLancamento({ tipo, categoria: categoria.trim(), descricao: (descricao || '').trim(), valor: parseFloat(valor), data });
        res.status(201).json({ id, mensagem: 'Lançamento registrado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar lançamento:', error);
        res.status(500).json({ erro: 'Erro ao registrar lançamento' });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });

        const dados = req.body;
        if (dados.tipo && !['receita', 'despesa'].includes(dados.tipo)) return res.status(400).json({ erro: 'Tipo inválido' });
        if (dados.valor && (isNaN(dados.valor) || parseFloat(dados.valor) <= 0)) return res.status(400).json({ erro: 'Valor deve ser maior que 0' });

        const resultado = await atualizarLancamento(id, dados);
        if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Lançamento não encontrado' });
        res.json({ mensagem: 'Lançamento atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar lançamento:', error);
        res.status(500).json({ erro: 'Erro ao atualizar lançamento' });
    }
};

exports.deletar = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });
        await deletarLancamento(id);
        res.json({ mensagem: 'Lançamento deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar lançamento:', error);
        res.status(500).json({ erro: 'Erro ao deletar lançamento' });
    }
};
