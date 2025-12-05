const db = require('../db');
const { buscarAlunoPorId } = require('../model/aluno');
const { buscarPlanoPorId } = require('../model/plano');
const { buscarModalidadePorId } = require('../model/modalidade');
const { verificarVinculo } = require('../model/alunoModalidade');

/**
 * @param {number} alunoId 
 * @param {number} planoId 
 * @returns {Promise} 
 */
async function assinarPlano(alunoId, planoId) {
    try {
       
        const aluno = await buscarAlunoPorId(alunoId);
        if (!aluno) {
            return {
                status: 404,
                erro: 'Aluno não encontrado'
            };
        }

        const plano = await buscarPlanoPorId(planoId);
        if (!plano) {
            return {
                status: 422,
                erro: 'Plano não encontrado'
            };
        }

        const modalidadeId = plano.modalidade_id;
        if (!modalidadeId) {
            return {
                status: 422,
                erro: 'Plano não possui modalidade associada'
            };
        }

        const modalidade = await buscarModalidadePorId(modalidadeId);
        if (!modalidade) {
            return {
                status: 422,
                erro: 'Modalidade associada ao plano não existe'
            };
        }

        const jaInscrito = await verificarVinculo(alunoId, modalidadeId);
        if (jaInscrito) {
            return {
                status: 409,
                erro: 'Aluno já está inscrito nessa modalidade'
            };
        }

        return await executarTransacao(alunoId, planoId, modalidadeId);

    } catch (error) {
        console.error('Erro ao assinar plano:', error);
        return {
            status: 500,
            erro: 'Erro ao processar assinatura do plano'
        };
    }
}

function executarTransacao(alunoId, planoId, modalidadeId) {
    return new Promise((resolve) => {
        db.beginTransaction((err) => {
            if (err) {
                console.error('Erro ao iniciar transação:', err);
                return resolve({
                    status: 500,
                    erro: 'Erro ao iniciar transação'
                });
            }

            const sqlInsertAlunoModalidade = `
                INSERT INTO aluno_modalidade (aluno_id, modalidade_id, created_at)
                VALUES (?, ?, NOW())
            `;

            db.query(sqlInsertAlunoModalidade, [alunoId, modalidadeId], (err, result) => {
                if (err) {
                    console.error('Erro ao inserir em alunos_modalidades:', err);
                    return db.rollback(() => {
                        resolve({
                            status: 500,
                            erro: 'Erro ao registrar inscrição em modalidade'
                        });
                    });
                }

                const alunoModalidadeId = result.insertId;

                db.commit((err) => {
                    if (err) {
                        console.error('Erro ao fazer commit:', err);
                        return db.rollback(() => {
                            resolve({
                                status: 500,
                                erro: 'Erro ao confirmar transação'
                            });
                        });
                    }

                    resolve({
                        status: 201,
                        message: 'Plano assinado e inscrito na modalidade com sucesso',
                        aluno_modalidade: {
                            id: alunoModalidadeId,
                            aluno_id: alunoId,
                            modalidade_id: modalidadeId,
                            plano_id: planoId,
                            created_at: new Date().toISOString()
                        }
                    });
                });
            });
        });
    });
}

module.exports = {
    assinarPlano
};
