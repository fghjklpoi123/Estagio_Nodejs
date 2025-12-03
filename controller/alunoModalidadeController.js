const { listarAlunosPorModalidade, listarModalidadesPorAluno, vincularAlunoModalidade, desvincularAlunoModalidade, verificarVinculo } = require('../model/alunoModalidade.js');

exports.listarAlunosPorModalidade = async (req, res) => {
    try {
        const { modalidadeId } = req.params;
        if (!modalidadeId || isNaN(modalidadeId)) {
            return res.status(400).json({ error: 'modalidadeId inválido' });
        }
        const resultado = await listarAlunosPorModalidade(modalidadeId);
        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar alunos da modalidade' });
    }
}

exports.listarModalidadesPorAluno = async (req, res) => {
    try {
        const { alunoId } = req.params;
        if (!alunoId || isNaN(alunoId)) {
            return res.status(400).json({ error: 'alunoId inválido' });
        }
        const resultado = await listarModalidadesPorAluno(alunoId);
        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar modalidades do aluno' });
    }
}

exports.vincular = async (req, res) => {
    try {
        const { alunoId, modalidadeId } = req.body;
        
        if (!alunoId || isNaN(alunoId)) {
            return res.status(400).json({ error: 'alunoId é obrigatório e deve ser um número' });
        }
        if (!modalidadeId || isNaN(modalidadeId)) {
            return res.status(400).json({ error: 'modalidadeId é obrigatório e deve ser um número' });
        }

        // Verificar se já existe vínculo
        const jaVinculado = await verificarVinculo(alunoId, modalidadeId);
        if (jaVinculado) {
            return res.status(400).json({ error: 'Aluno já está vinculado a esta modalidade' });
        }

        const novoVinculo = await vincularAlunoModalidade(alunoId, modalidadeId);
        res.json({ id: novoVinculo, alunoId, modalidadeId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao vincular aluno a modalidade' });
    }
}

exports.desvincular = async (req, res) => {
    try {
        const { alunoId, modalidadeId } = req.params;
        
        if (!alunoId || isNaN(alunoId)) {
            return res.status(400).json({ error: 'alunoId inválido' });
        }
        if (!modalidadeId || isNaN(modalidadeId)) {
            return res.status(400).json({ error: 'modalidadeId inválido' });
        }

        await desvincularAlunoModalidade(alunoId, modalidadeId);
        res.json({ message: 'Aluno desvinculado da modalidade com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao desvincular aluno da modalidade' });
    }
}
