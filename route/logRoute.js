const express = require('express');
const router = express.Router();
const { listar } = require('../controller/logController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/logs', autenticar, autorizar('admin'), listar);

module.exports = router;
