const { listarAulas, buscarAulaPorId, buscarExerciciosDaAula, criarAula, inserirExerciciosAula, atualizarAula, limparExerciciosAula, deletarAula } = require('../model/aula');
const { verificarVinculo } = require('../model/alunoModalidade');

exports.listar = async (req, res) => {
    try {
        const filtros = {};
        if (req.query.aluno_id) filtros.aluno_id = req.query.aluno_id;
        if (req.query.professor_id) filtros.professor_id = req.query.professor_id;
        if (req.query.modalidade_id) filtros.modalidade_id = req.query.modalidade_id;
        const result = await listarAulas(filtros);
        res.json(result);
    } catch (error) {
        console.error('Erro ao listar aulas:', error);
        res.status(500).json({ erro: 'Erro ao listar aulas' });
    }
};

exports.buscarUm = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });
        const aula = await buscarAulaPorId(id);
        if (!aula) return res.status(404).json({ erro: 'Aula não encontrada' });
        const exercicios = await buscarExerciciosDaAula(id);
        res.json({ ...aula, exercicios });
    } catch (error) {
        console.error('Erro ao buscar aula:', error);
        res.status(500).json({ erro: 'Erro ao buscar aula' });
    }
};

exports.criar = async (req, res) => {
    try {
        const { aluno_id, modalidade_id, data_aula, observacao, exercicios } = req.body;

        if (!aluno_id || isNaN(aluno_id)) return res.status(400).json({ erro: 'Aluno obrigatório' });
        if (!modalidade_id || isNaN(modalidade_id)) return res.status(400).json({ erro: 'Modalidade obrigatória' });
        if (!data_aula) return res.status(400).json({ erro: 'Data da aula obrigatória' });
        if (!exercicios || !Array.isArray(exercicios) || exercicios.length === 0) {
            return res.status(400).json({ erro: 'Adicione pelo menos um exercício' });
        }

        const inscrito = await verificarVinculo(aluno_id, modalidade_id);
        if (!inscrito) {
            return res.status(400).json({ erro: 'Aluno não está inscrito nesta modalidade' });
        }

        let professor_id;
        if (req.usuario.tipo === 'professor') {
            professor_id = req.usuario.id;
        } else {
            professor_id = req.body.professor_id;
            if (!professor_id || isNaN(professor_id)) {
                return res.status(400).json({ erro: 'Professor obrigatório' });
            }
        }

        const aulaId = await criarAula({ aluno_id, professor_id, modalidade_id, data_aula, observacao });
        await inserirExerciciosAula(aulaId, exercicios);

        res.status(201).json({ id: aulaId, mensagem: 'Ficha de treino criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar aula:', error);
        res.status(500).json({ erro: 'Erro ao criar ficha de treino' });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });

        const aulaExistente = await buscarAulaPorId(id);
        if (!aulaExistente) return res.status(404).json({ erro: 'Aula não encontrada' });

        const { aluno_id, modalidade_id, data_aula, observacao, exercicios } = req.body;

        if (aluno_id && modalidade_id) {
            const inscrito = await verificarVinculo(aluno_id, modalidade_id);
            if (!inscrito) return res.status(400).json({ erro: 'Aluno não está inscrito nesta modalidade' });
        }

        const dadosAula = {};
        if (aluno_id) dadosAula.aluno_id = aluno_id;
        if (modalidade_id) dadosAula.modalidade_id = modalidade_id;
        if (data_aula) dadosAula.data_aula = data_aula;
        if (observacao !== undefined) dadosAula.observacao = observacao;

        if (Object.keys(dadosAula).length > 0) {
            await atualizarAula(id, dadosAula);
        }

        if (exercicios && Array.isArray(exercicios)) {
            await limparExerciciosAula(id);
            if (exercicios.length > 0) {
                await inserirExerciciosAula(id, exercicios);
            }
        }

        res.json({ mensagem: 'Ficha de treino atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        res.status(500).json({ erro: 'Erro ao atualizar ficha de treino' });
    }
};

exports.deletar = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });
        await deletarAula(id);
        res.json({ mensagem: 'Ficha de treino deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar aula:', error);
        res.status(500).json({ erro: 'Erro ao deletar ficha de treino' });
    }
};
