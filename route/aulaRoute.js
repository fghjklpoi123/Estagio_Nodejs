const express = require('express');
const router = express.Router();
const { listar, buscarUm, criar, atualizar, deletar } = require('../controller/aulaController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/aulas', autenticar, listar);
router.get('/aulas/:id', autenticar, buscarUm);
router.post('/aulas', autenticar, autorizar('professor', 'admin'), criar);
router.put('/aulas/:id', autenticar, autorizar('professor', 'admin'), atualizar);
router.delete('/aulas/:id', autenticar, autorizar('professor', 'admin'), deletar);

module.exports = router;
