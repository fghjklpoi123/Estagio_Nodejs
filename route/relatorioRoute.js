const express = require('express');
const router = express.Router();
const { dinamico } = require('../controller/relatorioController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/relatorios', autenticar, autorizar('admin'), dinamico);

module.exports = router;
