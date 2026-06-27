const db = require('../db');
const { buscarAlunoPorId } = require('../model/aluno');
const { buscarPlanoPorId } = require('../model/plano');
const { buscarModalidadePorId } = require('../model/modalidade');
const { verificarVinculo, vincularAlunoModalidade } = require('../model/alunoModalidade');
const { verificarVinculoPlano, vincularAlunoPlano } = require('../model/alunoPlano');
const { cadastrarLancamento } = require('../model/lancamento');

async function assinarPlano(alunoId, planoId) {
    try {
        const aluno = await buscarAlunoPorId(alunoId);
        if (!aluno) return { status: 404, erro: 'Aluno não encontrado' };

        const plano = await buscarPlanoPorId(planoId);
        if (!plano) return { status: 422, erro: 'Plano não encontrado' };

        const modalidadeId = plano.modalidade_id;
        if (!modalidadeId) return { status: 422, erro: 'Plano não possui modalidade associada' };

        const modalidade = await buscarModalidadePorId(modalidadeId);
        if (!modalidade) return { status: 422, erro: 'Modalidade associada ao plano não existe' };

        const jaAssinou = await verificarVinculoPlano(alunoId, planoId);
        if (jaAssinou) return { status: 409, erro: 'Aluno já assinou este plano' };

        await vincularAlunoPlano(alunoId, planoId);

        const jaInscritoModalidade = await verificarVinculo(alunoId, modalidadeId);
        if (!jaInscritoModalidade) {
            await vincularAlunoModalidade(alunoId, modalidadeId);
        }

        try {
            await cadastrarLancamento({
                tipo: 'receita',
                categoria: 'Mensalidade',
                descricao: `${aluno.nome} — ${plano.descricao || modalidade.nome}`,
                valor: plano.preco,
                data: new Date().toISOString().slice(0, 10),
            });
        } catch (err) {
            console.error('Erro ao registrar lançamento automático:', err);
        }

        return {
            status: 201,
            message: 'Plano assinado com sucesso',
            aluno_plano: { aluno_id: alunoId, plano_id: planoId },
        };
    } catch (error) {
        console.error('Erro ao assinar plano:', error);
        return { status: 500, erro: 'Erro ao processar assinatura do plano' };
    }
}

module.exports = { assinarPlano };
