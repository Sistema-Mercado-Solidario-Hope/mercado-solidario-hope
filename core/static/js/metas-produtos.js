import Api from './api.js?v=3';

document.addEventListener('DOMContentLoaded', async () => {

    let produtos = [];
    const tableBody = document.getElementById('metasTableBody');
    const searchInput = document.getElementById('searchMetas');
    const totalText = document.getElementById('totalMetasText');

    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
        else console.log(`[Toast ${type}]: ${msg}`);
    }

    // ==================== CARREGAR DADOS DO BACKEND ====================
    async function carregarProdutos() {
        try {
            const data = await Api.get('/api/estoque/produtos');
            if (data && data.produtos) {
                produtos = data.produtos.map(p => ({
                    id: p.id,
                    nome: p.nome || p.name,
                    categoria: p.categoria || p.category,
                    unidade: p.unidade || p.unidade_medida,
                    quantidade: p.quantidade || p.estoque_atual || 0,
                    meta: p.meta || 0
                }));
                renderizarTabela(searchInput.value);
            } else {
                showToast(data.erro || 'Erro ao buscar produtos.', 'error');
            }
        } catch (e) {
            showToast('Erro de conexão ao buscar produtos.', 'error');
        }
    }

    // ==================== RENDERIZAR TABELA ====================
    function renderizarTabela(termo = '') {
        const query = termo.toLowerCase().trim();
        const filtrados = query
            ? produtos.filter(p => p.nome.toLowerCase().includes(query) || p.categoria.toLowerCase().includes(query))
            : produtos;

        tableBody.innerHTML = '';
        totalText.textContent = `Total: ${filtrados.length} produto(s)`;

        if (filtrados.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">
                        Nenhum produto cadastrado ou encontrado.
                    </td>
                </tr>`;
            return;
        }

        filtrados.forEach(p => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.innerHTML = `
                <td><strong>${p.nome}</strong></td>
                <td>${p.categoria}</td>
                <td>${p.quantidade} ${p.unidade}</td>
                <td>
                    <div class="input-unit-wrap">
                        <input type="number"
                               class="meta-edit-input"
                               data-id="${p.id}"
                               value="${p.meta}"
                               min="0"
                               step="0.01">
                        <span class="meta-unit-label">${p.unidade}</span>
                    </div>
                </td>
                <td>
                    <button class="btn-action-save" data-id="${p.id}">Salvar</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Binds event listeners
        tableBody.querySelectorAll('.btn-action-save').forEach(btn => {
            btn.addEventListener('click', () => salvarMeta(parseInt(btn.dataset.id, 10), btn));
        });
    }

    // ==================== SALVAR META INDIVIDUAL ====================
    async function salvarMeta(id, buttonEl) {
        const input = tableBody.querySelector(`.meta-edit-input[data-id="${id}"]`);
        if (!input) return;

        const val = parseFloat(input.value);
        if (isNaN(val) || val < 0) {
            showToast('Informe uma meta válida (≥ 0).', 'error');
            return;
        }

        const originalText = buttonEl.textContent;
        buttonEl.textContent = 'Salvando...';
        buttonEl.disabled = true;

        try {
            const res = await Api.patch(`/api/estoque/produtos/${id}`, { meta: val });
            if (res && (res.status === 200 || !res.erro)) {
                showToast('Meta atualizada com sucesso!');
                // Atualiza valor local
                const p = produtos.find(p => p.id === id);
                if (p) p.meta = val;
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao salvar meta.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar.', 'error');
        } finally {
            buttonEl.textContent = originalText;
            buttonEl.disabled = false;
        }
    }

    searchInput.addEventListener('input', e => renderizarTabela(e.target.value));

    // Inicialização
    await carregarProdutos();
});
