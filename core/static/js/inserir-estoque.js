import Api from './api.js?v=3';

function verificarSessao() {
    const token = localStorage.getItem('ms_token');
    if (!token) {
        window.location.href = './login.html';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!verificarSessao()) return;

    let itensCatalogo = [];

    const listaItens = document.getElementById('listaItens');
    const form = document.getElementById('formEntrada');
    const telefoneInput = document.getElementById('telefoneDoador');

    // Máscara de telefone
    function aplicarMascaraTelefone(valor) {
        let numeros = valor.replace(/\D/g, '');
        numeros = numeros.substring(0, 11);
        if (numeros.length <= 2) return numeros.length ? `(${numeros}` : '';
        if (numeros.length <= 7) return `(${numeros.substring(0, 2)}) ${numeros.substring(2)}`;
        if (numeros.length === 11) return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
        return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }

    telefoneInput.addEventListener('input', (e) => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
    });

    function getIconePorCategoria(cat) {
        const icons = {
            'Cereais': '🍚',
            'Leguminosas': '🫘',
            'Higiene': '🧼',
            'Proteínas': '🥛',
            'Limpeza': '🧴',
            'Cesta Básica': '🧺'
        };
        return icons[cat] || '📦';
    }

    // Renderiza cards do catálogo
    function renderizarItens() {
        listaItens.innerHTML = '';
        itensCatalogo.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-info">
                    <span style="font-size:24px">${item.icone}</span>
                    <span class="poppins-semibold">${item.nome}</span>
                </div>
                <div class="item-quantidade">
                    <label class="poppins-medium">Qtd (${item.unidade}):</label>
                    <input type="number" min="0" step="any" value="0" class="form-input qtd-item" style="width:80px" data-id="${item.id}">
                </div>
            `;
            listaItens.appendChild(card);
        });
    }



    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        } else {
            console.log(`Toast (${type}): ${msg}`);
        }
    }

    // ==================== CARREGAR CATALOGO ====================
    async function carregarCatalogo() {
        try {
            const data = await Api.get('/api/estoque/produtos');
            if (data && data.produtos) {
                itensCatalogo = data.produtos.map(p => ({
                    id: p.id,
                    nome: p.nome,
                    unidade: p.unidade,
                    icone: getIconePorCategoria(p.categoria)
                }));
                renderizarItens();
            }
        } catch (e) {
            showToast('Erro ao carregar catálogo.', 'error');
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nomeDoador').value.trim();
        const telefone = telefoneInput.value.trim();

        if (!nome || !telefone) {
            showToast('Preencha nome e telefone do doador.', 'error');
            return;
        }

        const numerosTelefone = telefone.replace(/\D/g, '');
        if (numerosTelefone.length < 10) {
            showToast('Telefone inválido (mínimo 10 dígitos).', 'error');
            return;
        }

        const itensList = [];

        document.querySelectorAll('.qtd-item').forEach(input => {
            const qtd = parseFloat(input.value);
            if (qtd > 0) {
                const id = parseInt(input.dataset.id, 10);
                itensList.push({
                    id: id,
                    quantidade: qtd
                });
            }
        });



        if (itensList.length === 0) {
            showToast('Adicione pelo menos um item com quantidade.', 'error');
            return;
        }

        const payload = {
            status: 'concluida',
            doador: {
                nome: nome,
                telefone: telefone
            },
            itens: itensList
        };

        try {
            const res = await Api.post('/api/intencao-doacao', payload);
            if (res && (res.status === 201 || !res.erro)) {
                showToast(`Entrada de doação registrada com sucesso!`, 'success');
                setTimeout(() => window.location.href = 'gestao-estoque.html', 1500);
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao registrar doação.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar entrada.', 'error');
        }
    });

    await carregarCatalogo();
});