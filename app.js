require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const corsConfig = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsConfig));

app.use(cors(corsConfig));
app.use(express.json());

app.use(bodyParser.json({
    type: 'application/json'
}));

app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/', (req, res) => {
    res.json({ mensagem: 'API AcadFlow rodando' });
});

// importa os models
require('./model/modalidade');
require('./model/plano');
require('./model/aluno');
require('./model/professor');
require('./model/alunoModalidade');
require('./model/admin');
require('./model/exercicio');
require('./model/aula');
require('./model/checkin');
require('./model/lancamento');
require('./model/alunoPlano');
require('./model/log');

const loggerMiddleware = require('./middleware/logger');
app.use(loggerMiddleware);

// importa as rotas
const alunoRoute = require('./route/alunoRoute');
const professorRoute = require('./route/professorRoute');
const modalidadeRoute = require('./route/modalidadeRoute');
const alunoModalidadeRoute = require('./route/alunoModalidadeRoute');
const planoRoute = require('./route/planoRoute');
const loginRoute = require('./route/loginRoute');
const relatorioRoute = require('./route/relatorioRoute');
const exercicioRoute = require('./route/exercicioRoute');
const aulaRoute = require('./route/aulaRoute');
const checkinRoute = require('./route/checkinRoute');
const lancamentoRoute = require('./route/lancamentoRoute');
const logRoute = require('./route/logRoute');
const feriadoRoute = require('./route/feriadoRoute');

// usa as rotas
app.use('/api', loginRoute);
app.use('/api', alunoRoute);
app.use('/api', relatorioRoute);
app.use('/api', professorRoute);
app.use('/api', modalidadeRoute);
app.use('/api', alunoModalidadeRoute);
app.use('/api', planoRoute);
app.use('/api', exercicioRoute);
app.use('/api', aulaRoute);
app.use('/api', checkinRoute);
app.use('/api', lancamentoRoute);
app.use('/api', logRoute);
app.use('/api', feriadoRoute);

// porta do render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});