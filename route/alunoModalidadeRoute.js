const { listarAlunosPorModalidade, listarModalidadesPorAluno, vincular, desvincular } = require('../controller/alunoModalidadeController');

const express = require('express');
const router = express.Router();

router.get('/modalidades/:modalidadeId/alunos', listarAlunosPorModalidade);
router.get('/alunos/:alunoId/modalidades', listarModalidadesPorAluno);
router.post('/aluno-modalidade/vincular', vincular);
router.delete('/aluno-modalidade/:alunoId/:modalidadeId', desvincular);

module.exports = router;
