const express = require('express');
const router = express.Router();
const { loginAluno, loginProfessor, loginAdmin, logout } = require('../controller/loginController');

router.post('/login/aluno', loginAluno);
router.post('/login/professor', loginProfessor);
router.post('/login/admin', loginAdmin);
router.get('/logout', logout);

module.exports = router;
