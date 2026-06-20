document.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById('modalEvento');

    const btnNovo = document.getElementById('btnNovoEvento');
    const btnSalvar = document.getElementById('salvarEvento');
    const btnCancelar = document.getElementById('cancelarEvento');

    const nome = document.getElementById('nomeEvento');
    const data = document.getElementById('dataEvento');
    const hora = document.getElementById('horaEvento');
    const descricao = document.getElementById('descricaoEvento');

    const lista = document.getElementById('listaEventos');

    let eventos = [];

    // ABRIR MODAL
    btnNovo.addEventListener('click', () => {

        modal.classList.add('active');
    });

    // FECHAR MODAL
    btnCancelar.addEventListener('click', () => {

        modal.classList.remove('active');
    });

    // SALVAR EVENTO
    btnSalvar.addEventListener('click', () => {

        if(
            nome.value.trim() === '' ||
            data.value === '' ||
            hora.value === '' ||
            descricao.value.trim() === ''
        ){
            alert('Preencha todos os campos!');
            return;
        }

        const evento = {

            id: Date.now(),

            nome: nome.value,
            data: data.value,
            hora: hora.value,
            descricao: descricao.value
        };

        eventos.push(evento);

        renderizarEventos();

        limparCampos();

        modal.classList.remove('active');
    });

    // RENDERIZAR EVENTOS
    function renderizarEventos(){

        lista.innerHTML = '';

        eventos.forEach((evento) => {

            const card = document.createElement('div');

            card.classList.add('card');

            card.innerHTML = `

                <button class="delete-btn" data-id="${evento.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>

                <h3>${evento.nome}</h3>

                <span>
                    <strong>Data:</strong> ${evento.data}
                </span>

                <span>
                    <strong>Horário:</strong> ${evento.hora}
                </span>

                <p>${evento.descricao}</p>
            `;

            lista.appendChild(card);
        });

        adicionarEventosExcluir();
    }

    // EXCLUIR EVENTO
    function adicionarEventosExcluir(){

        const botoes = document.querySelectorAll('.delete-btn');

        botoes.forEach((botao) => {

            botao.addEventListener('click', () => {

                const id = Number(botao.dataset.id);

                eventos = eventos.filter(evento => evento.id !== id);

                renderizarEventos();
            });
        });
    }

    // LIMPAR CAMPOS
    function limparCampos(){

        nome.value = '';
        data.value = '';
        hora.value = '';
        descricao.value = '';
    }

});