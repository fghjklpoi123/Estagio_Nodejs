const express = require('express');
const router = express.Router();
const { listar, verificarData } = require('../controller/feriadoController');

router.get('/feriados', listar);
router.get('/feriados/:data', verificarData);

module.exports = router;
