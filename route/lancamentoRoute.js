const express = require('express');
const router = express.Router();
const { listar, resumo, criar, atualizar, deletar } = require('../controller/lancamentoController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/financeiro', autenticar, autorizar('admin'), listar);
router.get('/financeiro/resumo', autenticar, autorizar('admin'), resumo);
router.post('/financeiro', autenticar, autorizar('admin'), criar);
router.put('/financeiro/:id', autenticar, autorizar('admin'), atualizar);
router.delete('/financeiro/:id', autenticar, autorizar('admin'), deletar);

module.exports = router;
