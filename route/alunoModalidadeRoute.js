const { listarAlunosPorModalidade, listarModalidadesPorAluno, vincular, desvincular } = require('../controller/alunoModalidadeController');

const express = require('express');
const router = express.Router();

// Listar alunos de uma modalidade
router.get('/modalidades/:modalidadeId/alunos', listarAlunosPorModalidade);

// Listar modalidades de um aluno
router.get('/alunos/:alunoId/modalidades', listarModalidadesPorAluno);

// Vincular aluno a modalidade
router.post('/aluno-modalidade/vincular', vincular);

// Desvincular aluno de modalidade
router.delete('/aluno-modalidade/:alunoId/:modalidadeId', desvincular);

module.exports = router;
