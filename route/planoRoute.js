const express = require('express');
const router = express.Router();
const { listar, buscarUm, criar, atualizar, deletar, assinar } = require('../controller/planoController');
const { autenticar, autorizar, verificarAluno } = require('../middleware/auth');

router.get('/planos', autenticar, listar);
router.get('/planos/:id', autenticar, buscarUm);
router.post('/planos', autenticar, autorizar('admin'), criar);
router.put('/planos/:id', autenticar, autorizar('admin'), atualizar);
router.delete('/planos/:id', autenticar, autorizar('admin'), deletar);
router.post('/planos/:planoId/assinar', autenticar, verificarAluno, assinar);

module.exports = router;
