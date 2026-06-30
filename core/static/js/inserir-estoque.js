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

    // Render catalogue cards
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

    // Load catalogue from backend
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

        const itensList = [];
        document.querySelectorAll('.qtd-item').forEach(input => {
            const qtd = parseFloat(input.value);
            if (qtd > 0) {
                itensList.push({
                    id: parseInt(input.dataset.id, 10),
                    quantidade: qtd
                });
            }
        });

        if (itensList.length === 0) {
            showToast('Adicione pelo menos um item com quantidade.', 'error');
            return;
        }

        const payload = { itens: itensList };

        try {
            const res = await Api.post('/api/estoque/ajuste', payload);
            if (res && (res.status === 201 || !res.erro)) {
                showToast('Ajuste de estoque registrado com sucesso!', 'success');
                setTimeout(() => window.location.href = 'gestao-estoque.html', 1500);
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao registrar ajuste.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar ajuste.', 'error');
        }
    });

    await carregarCatalogo();
});