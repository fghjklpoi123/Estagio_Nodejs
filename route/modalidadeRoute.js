const express = require('express');
const router = express.Router();
const { inserir, listar, buscarUm, update, remove } = require('../controller/modalidadeController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/modalidades', autenticar, listar);
router.get('/modalidades/:id', autenticar, buscarUm);
router.post('/modalidades', autenticar, autorizar('admin'), inserir);
router.put('/modalidades/:id', autenticar, autorizar('admin'), update);
router.delete('/modalidades/:id', autenticar, autorizar('admin'), remove);

module.exports = router;
