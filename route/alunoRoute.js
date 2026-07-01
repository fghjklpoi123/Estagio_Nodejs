const express = require('express');
const router = express.Router();
const { inserir, listar, buscarUm, update, remove, getPlano } = require('../controller/alunoController');
const { autenticar, autorizar } = require('../middleware/auth');

router.post('/alunos', inserir); // cadastro público
router.get('/alunos', autenticar, listar);
router.get('/alunos/:id', autenticar, buscarUm);
router.get('/alunos/:id/plano', autenticar, getPlano);
router.put('/alunos/:id', autenticar, autorizar('professor', 'admin'), update);
router.delete('/alunos/:id', autenticar, autorizar('professor', 'admin'), remove);

module.exports = router;
