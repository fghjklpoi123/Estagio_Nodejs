const express = require('express');
const router = express.Router();
const { loginAluno, loginProfessor, logout } = require('../controller/loginController');

// POST /api/login/aluno - login de aluno
router.post('/login/aluno', loginAluno);

// POST /api/login/professor - login de professor
router.post('/login/professor', loginProfessor);

// GET /api/logout - logout
router.get('/logout', logout);

module.exports = router;
