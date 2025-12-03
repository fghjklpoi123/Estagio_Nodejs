const express = require('express');
const router = express.Router();
const { alunosPorModalidade, modalidadesPopulares, alunosSemModalidade } = require('../controller/relatorioController');

router.get('/relatorios/alunos-por-modalidade', alunosPorModalidade);
router.get('/relatorios/modalidades-populares', modalidadesPopulares);
router.get('/relatorios/alunos-sem-modalidade', alunosSemModalidade);

module.exports = router;
