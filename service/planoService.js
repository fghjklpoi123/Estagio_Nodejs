// Serviço de assinatura de planos com transação atômica
// Responsável por:
// 1. Validar plano e modalidade
// 2. Verificar duplicidade de inscrição
// 3. Executar vínculo de plano + inscrição em modalidade de forma atômica

const db = require('../db');
const { buscarAlunoPorId } = require('../model/aluno');
const { buscarPlanoPorId } = require('../model/plano');
const { buscarModalidadePorId } = require('../model/modalidade');
const { verificarVinculo } = require('../model/alunoModalidade');

/**
 * Assina um plano para um aluno e o inscreve automaticamente na modalidade associada ao plano
 * @param {number} alunoId - ID do aluno (obtido do token/autenticação)
 * @param {number} planoId - ID do plano a assinar
 * @returns {Promise} { status, message, aluno_modalidade? }
 */
async function assinarPlano(alunoId, planoId) {
    try {
        // 1. Validar aluno
        const aluno = await buscarAlunoPorId(alunoId);
        if (!aluno) {
            return {
                status: 404,
                erro: 'Aluno não encontrado'
            };
        }

        // 2. Validar plano
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

        // 3. Validar modalidade
        const modalidade = await buscarModalidadePorId(modalidadeId);
        if (!modalidade) {
            return {
                status: 422,
                erro: 'Modalidade associada ao plano não existe'
            };
        }

        // 4. Verificar se aluno já está inscrito na modalidade
        const jaInscrito = await verificarVinculo(alunoId, modalidadeId);
        if (jaInscrito) {
            return {
                status: 409,
                erro: 'Aluno já está inscrito nessa modalidade'
            };
        }

        // 5. Executar transação: vincular plano + inscrever em modalidade
        return await executarTransacao(alunoId, planoId, modalidadeId);

    } catch (error) {
        console.error('Erro ao assinar plano:', error);
        return {
            status: 500,
            erro: 'Erro ao processar assinatura do plano'
        };
    }
}

/**
 * Executa a transação de vínculo de plano + inscrição em modalidade de forma atômica
 */
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

            // 1. Inserir em alunos_modalidades
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

                // 2. Commit da transação
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
