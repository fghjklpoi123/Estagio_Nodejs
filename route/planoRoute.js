const express = require('express');
const router = express.Router();
const { listar, buscarUm, criar, atualizar, deletar, assinar } = require('../controller/planoController');
const { verificarAluno } = require('../middleware/auth');

router.get('/planos', listar);
router.get('/planos/:id', buscarUm);
router.post('/planos', criar);
router.put('/planos/:id', atualizar);
router.delete('/planos/:id', deletar);
router.post('/planos/:planoId/assinar', verificarAluno, assinar);

module.exports = router;
