require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const cors = require('cors');

const corsConfig = {
    origin: '*', //local de onde pode receber requisao
    method: ['POST', 'GET'], // metodo permitido
    allowedHead: ['Content-Type', 'Authorization'] //cabeçario permitido
}
app.use(cors(corsConfig));

app.use(express.json());
app.use(bodyParser.json({
    type: 'application/**json'
}))

app.use(bodyParser.urlencoded({
    extended: true
}))

// servir arquivos estáticos do front (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'front')));

// Redirecionar requisições GET por arquivos .html feitas sob /api para os arquivos estáticos
// (resolve casos em que links relativos geram /api/login.html em vez de /login.html)
app.use('/api', (req, res, next) => {
    if (req.method === 'GET' && req.path && req.path.endsWith('.html')) {
        const filePath = path.join(__dirname, 'front', req.path);
        return res.sendFile(filePath, (err) => {
            if (err) return next();
        });
    }
    next();
});

// rota raiz: redirecionar para a tela de login
app.get('/', (req, res) => {
    return res.redirect('/loginFront/login.html');
});

// rotas API
// Garantir que tabelas sejam criadas na ordem correta (dependências):
// 1) modalidades, 2) planos (depende de modalidades), 3) alunos, 4) professores, 5) aluno_modalidade (depende de alunos+modalidades)
require('./model/modalidade');
require('./model/plano');
require('./model/aluno');
require('./model/professor');
require('./model/alunoModalidade');

const alunoRoute = require('./route/alunoRoute');
const professorRoute = require('./route/professorRoute');
const modalidadeRoute = require('./route/modalidadeRoute');
const alunoModalidadeRoute = require('./route/alunoModalidadeRoute');
const planoRoute = require('./route/planoRoute');
const loginRoute = require('./route/loginRoute');
const relatorioRoute = require('./route/relatorioRoute');

app.use('/api', loginRoute);
app.use('/api', alunoRoute);
app.use('/api', relatorioRoute);
app.use('/api', professorRoute);
app.use('/api', modalidadeRoute);
app.use('/api', alunoModalidadeRoute);
app.use('/api', planoRoute);







const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('http://localhost:'+PORT);
})