const express = require('express');
const router = express.Router();
const { inserir, listar, buscarUm, update, remove } = require('../controller/professorController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/professores', autenticar, listar);
router.get('/professores/:id', autenticar, buscarUm);
router.post('/professores', autenticar, autorizar('admin'), inserir);
router.put('/professores/:id', autenticar, autorizar('admin'), update);
router.delete('/professores/:id', autenticar, autorizar('admin'), remove);

module.exports = router;
