import Api from './api.js';

document.addEventListener('DOMContentLoaded', async () => {

    let produtos = [];

    // ==================== REFERÊNCIAS ====================
    const tableBody = document.getElementById('tableBody');
    const totalItensEl = document.getElementById('totalItens');
    const itensCriticosEl = document.getElementById('itensCriticos');
    const entradasHojeEl = document.getElementById('entradasHoje');
    const searchInput = document.getElementById('searchInput');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroStatus = document.getElementById('filtroStatus');
    const tableInfo = document.getElementById('tableInfo');
    const paginacaoContainer = document.getElementById('paginacao');

    // Modais
    const modalEdicao = document.getElementById('modalEdicao');
    const closeModalEdicao = document.getElementById('closeModalEdicao');
    const formEdicao = document.getElementById('formEdicaoProduto');
    const btnAjustarEstoque = document.getElementById('btnAjustarEstoque');

    const modalAjuste = document.getElementById('modalAjuste');
    const closeModalAjuste = document.getElementById('closeModalAjuste');
    const formAjuste = document.getElementById('formAjuste');

    const modalExclusao = document.getElementById('modalExclusao');
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');
    const btnCancelarExclusao = document.getElementById('btnCancelarExclusao');

    const ITENS_POR_PAGINA = 10;
    let paginaAtual = 1;
    let idParaExcluir = null;

    // ==================== FUNÇÕES AUXILIARES ====================
    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
        else console.log(`Toast (${type}): ${msg}`);
    }

    function atualizarResumos() {
        const totalUnidades = produtos.reduce((sum, p) => sum + p.quantidade, 0);
        totalItensEl.textContent = totalUnidades.toLocaleString('pt-BR');
        itensCriticosEl.textContent = produtos.filter(p => p.status === 'critico').length;
        entradasHojeEl.textContent = '0'; // Mock/calculated
    }

    // ==================== FILTRO E PAGINAÇÃO ====================
    function filtrarProdutos() {
        const termo = searchInput.value.toLowerCase().trim();
        const cat = filtroCategoria.value;
        const status = filtroStatus.value;

        return produtos.filter(p => {
            const matchNome = !termo || p.nome.toLowerCase().includes(termo);
            const matchCat = !cat || p.categoria === cat;
            const matchStatus = !status || p.status === status;
            return matchNome && matchCat && matchStatus;
        });
    }

    function renderizarTabela(pagina = 1) {
        const filtradas = filtrarProdutos();
        const totalPaginas = Math.ceil(filtradas.length / ITENS_POR_PAGINA) || 1;

        if (pagina > totalPaginas) pagina = totalPaginas;
        if (pagina < 1) pagina = 1;
        paginaAtual = pagina;

        const inicio = (pagina - 1) * ITENS_POR_PAGINA;
        const exibidas = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

        tableBody.innerHTML = '';

        if (exibidas.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Nenhum produto encontrado.</td></tr>`;
            tableInfo.textContent = 'Exibindo 0 itens';
        } else {
            exibidas.forEach(p => {
                const tr = document.createElement('tr');
                const statusClasse = `status-${p.status}`;
                const statusTexto = { ok: 'Normal', critico: 'Crítico', esgotado: 'Esgotado' }[p.status];
                tr.innerHTML = `
                    <td><strong>${p.nome}</strong></td>
                    <td>${p.categoria}</td>
                    <td>${p.quantidade} ${p.unidade}</td>
                    <td>${p.estoqueMinimo || 0} ${p.unidade}</td>
                    <td><span class="status-badge ${statusClasse}">${statusTexto}</span></td>
                    <td class="actions-cell">
                        <button class="btn-edit" data-id="${p.id}" title="Editar">✎</button>
                        <button class="btn-delete" data-id="${p.id}" title="Excluir">🗑</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            const exibindo = inicio + 1;
            const ate = Math.min(inicio + ITENS_POR_PAGINA, filtradas.length);
            tableInfo.textContent = `Exibindo ${exibindo}-${ate} de ${filtradas.length} itens`;
        }

        renderizarPaginacao(totalPaginas);

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => abrirModalEdicao(parseInt(btn.dataset.id)));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => abrirModalExclusao(parseInt(btn.dataset.id)));
        });
    }

    function renderizarPaginacao(totalPaginas) {
        if (!paginacaoContainer) return;
        paginacaoContainer.innerHTML = '';
        if (totalPaginas <= 1) return;

        const btnAnterior = document.createElement('button');
        btnAnterior.className = 'btn-pagina';
        btnAnterior.textContent = '‹';
        btnAnterior.disabled = paginaAtual === 1;
        btnAnterior.addEventListener('click', () => renderizarTabela(paginaAtual - 1));
        paginacaoContainer.appendChild(btnAnterior);

        const maxBotoes = 5;
        let inicioPag = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
        let fimPag = inicioPag + maxBotoes - 1;
        if (fimPag > totalPaginas) {
            fimPag = totalPaginas;
            inicioPag = Math.max(1, fimPag - maxBotoes + 1);
        }

        for (let i = inicioPag; i <= fimPag; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn-pagina' + (i === paginaAtual ? ' ativo' : '');
            btn.textContent = i;
            btn.addEventListener('click', () => renderizarTabela(i));
            paginacaoContainer.appendChild(btn);
        }

        const btnProximo = document.createElement('button');
        btnProximo.className = 'btn-pagina';
        btnProximo.textContent = '›';
        btnProximo.disabled = paginaAtual === totalPaginas;
        btnProximo.addEventListener('click', () => renderizarTabela(paginaAtual + 1));
        paginacaoContainer.appendChild(btnProximo);
    }

    // ==================== CARREGAR DADOS DA API ====================
    async function carregarERenderizar() {
        try {
            const data = await Api.get('/api/estoque/produtos');
            if (data && data.produtos) {
                produtos = data.produtos.map(p => ({
                    id: p.id,
                    nome: p.nome || p.name,
                    categoria: p.categoria || p.category,
                    unidade: p.unidade || p.unidade_medida,
                    quantidade: p.quantidade || p.estoque_atual || 0,
                    estoqueMinimo: p.estoqueMinimo || p.estoque_minimo || 0,
                    meta: p.meta || 0,
                    status: p.esgotado ? 'esgotado' : (p.estoqueCritico ? 'critico' : 'ok')
                }));
                renderizarTabela(paginaAtual);
                atualizarResumos();
            } else {
                showToast(data.erro || 'Erro ao carregar produtos.', 'error');
            }
        } catch (e) {
            showToast('Erro de conexão ao buscar estoque.', 'error');
        }
    }

    // ==================== MODAL DE EDIÇÃO ====================
    function abrirModalEdicao(id) {
        const produto = produtos.find(p => p.id === id);
        if (!produto) return;

        document.getElementById('editId').value = produto.id;
        document.getElementById('editNome').value = produto.nome;
        document.getElementById('editCategoria').value = produto.categoria;
        document.getElementById('editUnidade').value = produto.unidade;
        document.getElementById('editQuantidade').value = produto.quantidade;
        document.getElementById('editMinimo').value = produto.estoqueMinimo || '';
        document.getElementById('editMeta').value = produto.meta || '';

        modalEdicao.classList.add('active');
        modalEdicao.setAttribute('aria-hidden', 'false');
    }

    function fecharModalEdicao() {
        modalEdicao.classList.remove('active');
        modalEdicao.setAttribute('aria-hidden', 'true');
    }

    closeModalEdicao.addEventListener('click', fecharModalEdicao);
    modalEdicao.addEventListener('click', (e) => {
        if (e.target === modalEdicao) fecharModalEdicao();
    });

    formEdicao.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('editId').value, 10);
        const index = produtos.findIndex(p => p.id === id);
        if (index === -1) return;

        const payload = {
            nome: document.getElementById('editNome').value.trim(),
            categoria: document.getElementById('editCategoria').value,
            unidade: document.getElementById('editUnidade').value,
            quantidade: parseFloat(document.getElementById('editQuantidade').value) || 0,
            estoqueMinimo: parseInt(document.getElementById('editMinimo').value, 10) || 0,
            meta: parseFloat(document.getElementById('editMeta').value) || 0,
        };

        try {
            const res = await Api.patch(`/api/estoque/produtos/${id}`, payload);
            if (res && (res.status === 200 || !res.erro)) {
                showToast('Produto atualizado com sucesso!', 'success');
                fecharModalEdicao();
                await carregarERenderizar();
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao atualizar produto.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar.', 'error');
        }
    });

    // ==================== MODAL DE AJUSTE DE ESTOQUE ====================
    btnAjustarEstoque.addEventListener('click', () => {
        const id = parseInt(document.getElementById('editId').value, 10);
        const produto = produtos.find(p => p.id === id);
        if (!produto) return;

        document.getElementById('ajusteId').value = produto.id;
        document.getElementById('ajusteProdutoNome').textContent = `Produto: ${produto.nome}`;
        document.getElementById('tipoAjuste').value = 'entrada';
        document.getElementById('qtdAjuste').value = '';
        document.getElementById('motivoAjuste').value = '';

        modalAjuste.classList.add('active');
        modalAjuste.setAttribute('aria-hidden', 'false');
    });

    function fecharModalAjuste() {
        modalAjuste.classList.remove('active');
        modalAjuste.setAttribute('aria-hidden', 'true');
    }

    closeModalAjuste.addEventListener('click', fecharModalAjuste);
    modalAjuste.addEventListener('click', (e) => {
        if (e.target === modalAjuste) fecharModalAjuste();
    });

    formAjuste.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('ajusteId').value, 10);
        const produto = produtos.find(p => p.id === id);
        if (!produto) return;

        const tipo = document.getElementById('tipoAjuste').value;
        const qtd = parseFloat(document.getElementById('qtdAjuste').value);

        if (isNaN(qtd) || qtd <= 0) {
            showToast('Informe uma quantidade válida.', 'error');
            return;
        }

        let novaQtd = produto.quantidade;
        if (tipo === 'entrada') {
            novaQtd += qtd;
        } else {
            if (qtd > novaQtd) {
                showToast('Quantidade insuficiente em estoque.', 'error');
                return;
            }
            novaQtd -= qtd;
        }

        try {
            const res = await Api.patch(`/api/estoque/produtos/${id}/quantidade`, { quantidade: novaQtd });
            if (res && (res.status === 200 || !res.erro)) {
                showToast(`Ajuste de ${tipo} de ${qtd} ${produto.unidade} realizado.`, 'success');
                fecharModalAjuste();
                fecharModalEdicao();
                await carregarERenderizar();
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao ajustar estoque.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao ajustar estoque.', 'error');
        }
    });

    // ==================== MODAL DE EXCLUSÃO ====================
    function abrirModalExclusao(id) {
        idParaExcluir = id;
        modalExclusao.classList.add('active');
        modalExclusao.setAttribute('aria-hidden', 'false');
    }

    function fecharModalExclusao() {
        modalExclusao.classList.remove('active');
        modalExclusao.setAttribute('aria-hidden', 'true');
        idParaExcluir = null;
    }

    btnConfirmarExclusao.addEventListener('click', async () => {
        if (idParaExcluir) {
            try {
                const res = await Api.delete(`/api/estoque/produtos/${idParaExcluir}`);
                if (res && (res.status === 200 || !res.erro)) {
                    showToast('Produto excluído com sucesso.', 'info');
                    await carregarERenderizar();
                } else {
                    showToast(res.erro || res.data?.erro || 'Erro ao excluir produto.', 'error');
                }
            } catch (err) {
                showToast('Erro de conexão ao excluir.', 'error');
            }
        }
        fecharModalExclusao();
    });

    btnCancelarExclusao.addEventListener('click', fecharModalExclusao);
    modalExclusao.addEventListener('click', (e) => {
        if (e.target === modalExclusao) fecharModalExclusao();
    });

    // ==================== EVENTOS DE FILTRO ====================
    searchInput.addEventListener('input', () => renderizarTabela(1));
    filtroCategoria.addEventListener('change', () => renderizarTabela(1));
    filtroStatus.addEventListener('change', () => renderizarTabela(1));

    // ==================== INICIALIZAÇÃO ====================
    async function carregarCategorias() {
        try {
            const data = await Api.get('/api/estoque/categorias');
            if (data && data.categorias) {
                // Populate filtroCategoria
                const filtroVal = filtroCategoria.value;
                filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>';
                data.categorias.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.nome;
                    opt.textContent = cat.nome;
                    filtroCategoria.appendChild(opt);
                });
                if (filtroVal) filtroCategoria.value = filtroVal;

                // Populate editCategoria
                const editCat = document.getElementById('editCategoria');
                if (editCat) {
                    editCat.innerHTML = '';
                    data.categorias.forEach(cat => {
                        const opt = document.createElement('option');
                        opt.value = cat.nome;
                        opt.textContent = cat.nome;
                        editCat.appendChild(opt);
                    });
                }
            }
        } catch (e) {
            console.error('Erro ao carregar categorias no dashboard:', e);
        }
    }

    await carregarCategorias();
    await carregarERenderizar();
});