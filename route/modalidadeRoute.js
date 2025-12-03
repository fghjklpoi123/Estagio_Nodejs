const { inserir, listar, buscarUm, update, remove } = require('../controller/modalidadeController');

const express = require('express');
const router = express.Router();

router.get('/modalidades', listar);
router.get('/modalidades/:id', buscarUm);
router.post('/modalidades', inserir);
router.put('/modalidades/:id', update);
router.delete('/modalidades/:id', remove);

module.exports = router;
