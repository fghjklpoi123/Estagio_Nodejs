const {inserir, listar, buscarUm, update, remove, getPlano} = require('../controller/alunoController');

const express = require('express');
const router = express.Router();


router.get('/alunos', listar);
router.get('/alunos/:id', buscarUm);
router.get('/alunos/:id/plano', getPlano);
router.post('/alunos', inserir);
router.put('/alunos/:id', update);
router.delete('/alunos/:id', remove);
module.exports = router;