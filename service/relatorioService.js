const relatorioModel = require('../model/relatorio');

const formatDate = (dt) => {
  if (!dt) return null;
  const d = new Date(dt);
  return d.toISOString().split('T')[0];
}

exports.alunosPorModalidade = async () => {
  const modalidades = await relatorioModel.listarModalidades();
  const result = [];
  for (const m of modalidades) {
    const alunos = await relatorioModel.listarAlunosPorModalidade(m.id);
    const alunosFmt = (alunos || []).map(a => ({
      nome: a.aluno_nome,
      cpf: a.cpf,
      telefone: a.telefone || '',
      situacao: a.situacao || '',
      data_matricula: formatDate(a.data_matricula)
    }));
    result.push({
      modalidade: { id: m.id, nome: m.nome, descricao: m.descricao || '' },
      alunos: alunosFmt.length ? alunosFmt : []
    });
  }
  return result;
}

exports.modalidadesPopulares = async () => {
  const rows = await relatorioModel.modalidadesComContagem();
  const result = [];
  let totalGeral = 0;
  for (const r of rows) totalGeral += Number(r.total_alunos || 0);

  for (const r of rows) {
    const professor = await relatorioModel.buscarProfessorPorModalidade(r.modalidade_id);
    result.push({
      modalidade_id: r.modalidade_id,
      nome: r.modalidade_nome,
      total_alunos: Number(r.total_alunos || 0),
      professor: professor ? { id: professor.id, nome: professor.nome, telefone: professor.telefone, email: professor.email } : null,
      status: 'Ativa'
    });
  }

  return { total_geral: totalGeral, modalidades: result };
}

exports.alunosSemModalidade = async () => {
  const rows = await relatorioModel.listarAlunosSemModalidade();
  return rows.map(r => ({
    id: r.id,
    nome: r.nome,
    cpf: r.cpf,
    telefone: r.telefone || '',
    email: r.email || '',
    criado_em: formatDate(r.created_at),
    obs: r.obs || ''
  }));
}
