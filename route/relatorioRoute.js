const express = require('express');
const router = express.Router();
const { alunosPorModalidade, modalidadesPopulares, alunosSemModalidade } = require('../controller/relatorioController');
const { autenticar } = require('../middleware/auth');

router.get('/relatorios/alunos-por-modalidade', autenticar, alunosPorModalidade);
router.get('/relatorios/modalidades-populares', autenticar, modalidadesPopulares);
router.get('/relatorios/alunos-sem-modalidade', autenticar, alunosSemModalidade);

module.exports = router;
