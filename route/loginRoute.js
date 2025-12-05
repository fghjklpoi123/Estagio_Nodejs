const express = require('express');
const router = express.Router();
const { loginAluno, loginProfessor, logout } = require('../controller/loginController');

router.post('/login/aluno', loginAluno);
router.post('/login/professor', loginProfessor);
router.get('/logout', logout);

module.exports = router;
