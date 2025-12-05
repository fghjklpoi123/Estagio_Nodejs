require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const cors = require('cors');

const corsConfig = {
    origin: '*', 
    method: ['POST', 'GET'], 
    allowedHead: ['Content-Type', 'Authorization'] 
}
app.use(cors(corsConfig));

app.use(express.json());
app.use(bodyParser.json({
    type: 'application/**json'
}))

app.use(bodyParser.urlencoded({
    extended: true
}))


app.use(express.static(path.join(__dirname, 'front')));


app.use('/api', (req, res, next) => {
    if (req.method === 'GET' && req.path && req.path.endsWith('.html')) {
        const filePath = path.join(__dirname, 'front', req.path);
        return res.sendFile(filePath, (err) => {
            if (err) return next();
        });
    }
    next();
});


app.get('/', (req, res) => {
    return res.redirect('/loginFront/login.html');
});


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