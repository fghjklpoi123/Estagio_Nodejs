const {inserir, listar, buscarUm, update, remove} = require('../controller/professorController');

const express = require('express');
const router = express.Router();

router.get('/professores', listar);
router.get('/professores/:id', buscarUm);
router.post('/professores', inserir);
router.put('/professores/:id', update);
router.delete('/professores/:id', remove);

module.exports = router;
