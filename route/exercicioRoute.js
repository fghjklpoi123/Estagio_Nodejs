const express = require('express');
const router = express.Router();
const { listar, buscarUm, inserir, atualizar, deletar } = require('../controller/exercicioController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/exercicios', autenticar, listar);
router.get('/exercicios/:id', autenticar, buscarUm);
router.post('/exercicios', autenticar, autorizar('professor', 'admin'), inserir);
router.put('/exercicios/:id', autenticar, autorizar('professor', 'admin'), atualizar);
router.delete('/exercicios/:id', autenticar, autorizar('professor', 'admin'), deletar);

module.exports = router;
