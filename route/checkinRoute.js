const express = require('express');
const router = express.Router();
const { registrar, statusHoje, historico, listarTodos, totalHoje } = require('../controller/checkinController');
const { autenticar, autorizar } = require('../middleware/auth');

router.post('/checkins', autenticar, autorizar('aluno'), registrar);
router.get('/checkins/hoje', autenticar, autorizar('aluno'), statusHoje);
router.get('/checkins/historico', autenticar, autorizar('aluno'), historico);

router.get('/checkins', autenticar, autorizar('professor', 'admin'), listarTodos);
router.get('/checkins/total-hoje', autenticar, autorizar('professor', 'admin'), totalHoje);

module.exports = router;
