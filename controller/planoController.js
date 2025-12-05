const { assinarPlano } = require('../service/planoService');
const { listarPlanos, buscarPlanoPorId, cadastrarPlano, atualizarPlano, deletarPlano } = require('../model/plano');

exports.listar = async (req, res) => {
    try {
        const planos = await listarPlanos();
        res.json(planos);
    } catch (error) {
        console.error('Erro ao listar planos:', error);
        res.status(500).json({ erro: 'Erro ao listar planos' });
    }
};

exports.buscarUm = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        const plano = await buscarPlanoPorId(id);
        if (!plano) {
            return res.status(404).json({ erro: 'Plano não encontrado' });
        }
        res.json(plano);
    } catch (error) {
        console.error('Erro ao buscar plano:', error);
        res.status(500).json({ erro: 'Erro ao buscar plano' });
    }
};

exports.criar = async (req, res) => {
    try {
        const { descricao, preco, modalidade_id } = req.body;
        
        if (!descricao || descricao.trim() === '') {
            return res.status(400).json({ erro: 'Descrição obrigatória' });
        }
        
        if (!preco || isNaN(preco) || parseFloat(preco) <= 0) {
            return res.status(400).json({ erro: 'Preço obrigatório e deve ser maior que 0' });
        }
        
        if (modalidade_id && isNaN(modalidade_id)) {
            return res.status(400).json({ erro: 'modalidade_id inválida' });
        }

        const id = await cadastrarPlano({
            descricao: descricao.trim(),
            preco: parseFloat(preco),
            modalidade_id: modalidade_id || null
        });

        res.status(201).json({
            id,
            descricao: descricao.trim(),
            preco: parseFloat(preco),
            modalidade_id: modalidade_id || null
        });
    } catch (error) {
        console.error('Erro ao criar plano:', error);
        res.status(500).json({ erro: 'Erro ao criar plano' });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, preco, modalidade_id } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }

        if (!descricao && !preco && modalidade_id === undefined) {
            return res.status(400).json({ erro: 'Nenhum dado para atualizar' });
        }

        if (descricao && descricao.trim() === '') {
            return res.status(400).json({ erro: 'Descrição não pode estar vazia' });
        }

        if (preco && (isNaN(preco) || parseFloat(preco) <= 0)) {
            return res.status(400).json({ erro: 'Preço deve ser maior que 0' });
        }

        if (modalidade_id && isNaN(modalidade_id)) {
            return res.status(400).json({ erro: 'modalidade_id inválida' });
        }

        const dados = {};
        if (descricao) dados.descricao = descricao.trim();
        if (preco) dados.preco = parseFloat(preco);
        if (modalidade_id !== undefined) dados.modalidade_id = modalidade_id || null;

        await atualizarPlano(id, dados);

        const planoAtualizado = await buscarPlanoPorId(id);
        res.json(planoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        res.status(500).json({ erro: 'Erro ao atualizar plano' });
    }
};

exports.deletar = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }

        const plano = await buscarPlanoPorId(id);
        if (!plano) {
            return res.status(404).json({ erro: 'Plano não encontrado' });
        }

        await deletarPlano(id);
        res.json({ mensagem: 'Plano deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar plano:', error);
        res.status(500).json({ erro: 'Erro ao deletar plano' });
    }
};

exports.assinar = async (req, res) => {
    try {
        const { planoId } = req.params;
        const alunoId = req.alunoId; 

        if (!planoId || isNaN(planoId)) {
            return res.status(400).json({ erro: 'planoId inválido' });
        }

        const resultado = await assinarPlano(alunoId, Number(planoId));

        const httpStatus = resultado.status || 500;
        return res.status(httpStatus).json(resultado);

    } catch (error) {
        console.error('Erro no controller assinar:', error);
        return res.status(500).json({ erro: 'Erro ao assinar plano' });
    }
};
