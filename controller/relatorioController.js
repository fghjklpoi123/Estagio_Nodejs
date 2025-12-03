const relatorioService = require('../service/relatorioService');

exports.alunosPorModalidade = async (req, res) => {
  try {
    const data = await relatorioService.alunosPorModalidade();
    return res.json(data);
  } catch (err) {
    console.error('Erro alunosPorModalidade:', err);
    return res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}

exports.modalidadesPopulares = async (req, res) => {
  try {
    const data = await relatorioService.modalidadesPopulares();
    return res.json(data);
  } catch (err) {
    console.error('Erro modalidadesPopulares:', err);
    return res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}

exports.alunosSemModalidade = async (req, res) => {
  try {
    const data = await relatorioService.alunosSemModalidade();
    return res.json(data);
  } catch (err) {
    console.error('Erro alunosSemModalidade:', err);
    return res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}
