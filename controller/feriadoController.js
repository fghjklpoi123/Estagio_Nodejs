let cacheAno = null;
let cacheFeriados = [];

async function buscarFeriados(ano) {
    if (cacheAno === ano && cacheFeriados.length > 0) return cacheFeriados;

    try {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
        if (!response.ok) return [];
        const data = await response.json();
        cacheAno = ano;
        cacheFeriados = data;
        return data;
    } catch (error) {
        console.error('Erro ao consultar BrasilAPI feriados:', error.message);
        return [];
    }
}

exports.listar = async (req, res) => {
    try {
        const ano = req.query.ano || new Date().getFullYear();
        const feriados = await buscarFeriados(Number(ano));
        res.json(feriados);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar feriados' });
    }
};

exports.verificarData = async (req, res) => {
    try {
        const { data } = req.params;
        if (!data || data.length < 10) return res.status(400).json({ erro: 'Data inválida' });

        const ano = Number(data.slice(0, 4));
        const feriados = await buscarFeriados(ano);
        const feriado = feriados.find((f) => f.date === data);

        res.json({
            ehFeriado: !!feriado,
            nome: feriado?.name || null,
            tipo: feriado?.type || null,
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao verificar data' });
    }
};
