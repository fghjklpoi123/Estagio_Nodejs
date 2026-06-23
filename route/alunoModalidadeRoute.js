const express = require('express');
const router = express.Router();
const { listarAlunosPorModalidade, listarModalidadesPorAluno, vincular, desvincular } = require('../controller/alunoModalidadeController');
const { autenticar } = require('../middleware/auth');

router.get('/modalidades/:modalidadeId/alunos', autenticar, listarAlunosPorModalidade);
router.get('/alunos/:alunoId/modalidades', autenticar, listarModalidadesPorAluno);
router.post('/aluno-modalidade/vincular', autenticar, vincular);
router.delete('/aluno-modalidade/:alunoId/:modalidadeId', autenticar, desvincular);

module.exports = router;
