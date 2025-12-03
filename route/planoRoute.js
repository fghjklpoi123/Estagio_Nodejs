const express = require('express');
const router = express.Router();
const { listar, buscarUm, criar, atualizar, deletar, assinar } = require('../controller/planoController');
const { verificarAluno } = require('../middleware/auth');

// GET /api/planos
// Lista todos os planos disponíveis
router.get('/planos', listar);

// GET /api/planos/:id
// Busca um plano específico
router.get('/planos/:id', buscarUm);

// POST /api/planos
// Cria um novo plano
router.post('/planos', criar);

// PUT /api/planos/:id
// Atualiza um plano
router.put('/planos/:id', atualizar);

// DELETE /api/planos/:id
// Deleta um plano
router.delete('/planos/:id', deletar);

// POST /api/planos/:planoId/assinar
// Assina um plano para o aluno autenticado e o inscreve na modalidade associada
router.post('/planos/:planoId/assinar', verificarAluno, assinar);

module.exports = router;
