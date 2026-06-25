import Api from './api.js?v=3';

document.addEventListener('DOMContentLoaded', async () => {

    let intencoes = [];
    let itensCatalogo = [];

    // ==================== REFERÊNCIAS DO DOM ====================
    const listaContainer = document.getElementById('listaIntencoes');
    const mensagemVazia = document.getElementById('mensagemVazia');
    const searchInput = document.getElementById('searchIntencao');
    const modalOverlay = document.getElementById('modalEdicaoOverlay');
    const closeModalBtn = document.getElementById('closeModalEdicao');
    const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
    const btnConfirmarRecebimento = document.getElementById('btnConfirmarRecebimento');

    // Novos botões
    const btnToggleCatalogo = document.getElementById('btnToggleCatalogo');
    const catalogoContainer = document.getElementById('catalogoItensContainer');
    const catalogoLista = document.getElementById('catalogoItensLista');

    // Elementos do modal
    const modalCodigo = document.getElementById('modalCodigo');
    const modalNome = document.getElementById('modalNome');
    const modalTelefone = document.getElementById('modalTelefone');
    const modalItensContainer = document.getElementById('modalItensContainer');

    let intencaoAtual = null;

    // ==================== FUNÇÃO DE TOAST ====================
    function toast(mensagem, tipo = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(mensagem, tipo);
        } else {
            console.log(`Toast (${type}): ${mensagem}`);
        }
    }

    // ==================== MODAL DE CONFIRMAÇÃO ====================
    function criarModalConfirmacao(mensagem) {
        return new Promise((resolve) => {
            const existente = document.querySelector('.modal-confirmacao-overlay');
            if (existente) existente.remove();

            const overlay = document.createElement('div');
            overlay.className = 'modal-confirmacao-overlay';
            overlay.innerHTML = `
                <div class="modal-confirmacao-card">
                    <p class="poppins-medium mensagem-confirmacao">${mensagem}</p>
                    <div class="botoes-confirmacao">
                        <button class="btn-sim poppins-semibold">Sim</button>
                        <button class="btn-nao poppins-semibold">Cancelar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const fechar = (resultado) => {
                overlay.classList.add('fade-out');
                setTimeout(() => overlay.remove(), 200);
                resolve(resultado);
            };

            overlay.querySelector('.btn-sim').addEventListener('click', () => fechar(true));
            overlay.querySelector('.btn-nao').addEventListener('click', () => fechar(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) fechar(false);
            });
        });
    }

    // ==================== RENDERIZAÇÃO DA LISTA PRINCIPAL ====================
    function renderizarLista(intencoesFiltradas = null) {
        const dados = intencoesFiltradas ? intencoesFiltradas.slice(0, 10) : intencoes.slice(0, 10);
        listaContainer.innerHTML = '';

        if (dados.length === 0) {
            mensagemVazia.style.display = 'block';
            return;
        }
        mensagemVazia.style.display = 'none';

        dados.forEach(intencao => {
            const card = criarCardIntencao(intencao);
            listaContainer.appendChild(card);
        });
    }

    function criarCardIntencao(intencao) {
        const card = document.createElement('div');
        card.className = 'intencao-card';
        card.innerHTML = `
            <div class="intencao-card-header">
                <span class="codigo-badge poppins-semibold">${intencao.codigo}</span>
                <span class="status-badge status-${intencao.status} poppins-semibold">${intencao.status === 'pendente' ? 'Pendente' : 'Validado'}</span>
            </div>
            <div class="intencao-card-body">
                <p><strong>Nome:</strong> ${intencao.doador.nome}</p>
                <p><strong>Telefone:</strong> ${intencao.doador.telefone}</p>
                <p><strong>Data:</strong> ${intencao.data}</p>
                <p><strong>Itens:</strong> ${intencao.itens.length} item(ns)</p>
            </div>
            <div class="intencao-card-footer">
                <button class="btn-editar-intencao poppins-semibold" data-codigo="${intencao.codigo}">Editar / Receber</button>
            </div>
        `;

        card.querySelector('.btn-editar-intencao').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalEdicao(intencao.codigo);
        });

        return card;
    }

    function filtrarIntencoes(termo) {
        const termoLower = termo.toLowerCase().trim();
        if (!termoLower) return intencoes.slice(0, 10);
        return intencoes.filter(i =>
            i.codigo.toLowerCase().includes(termoLower) ||
            i.doador.nome.toLowerCase().includes(termoLower) ||
            i.doador.telefone.toLowerCase().includes(termoLower)
        ).slice(0, 10);
    }

    // ==================== CARREGAR DADOS DA API ====================
    async function carregarIntencoes() {
        try {
            const data = await Api.get('/api/intencao-doacao');
            if (data && data.intencoes) {
                intencoes = data.intencoes.map(i => ({
                    id: i.id,
                    codigo: i.codigo,
                    data: i.data_registro,
                    doador: { nome: i.nome_doador, telefone: i.telefone_doador },
                    itens: i.itens.map(it => ({
                        id: it.id || null,
                        nome: it.produto_nome,
                        quantidade: it.quantidade
                    })),
                    status: i.status
                }));
                renderizarLista();
            } else {
                toast(data.erro || 'Erro ao carregar intenções.', 'error');
            }
        } catch (e) {
            toast('Erro de conexão ao buscar intenções.', 'error');
        }
    }

    async function carregarCatalogo() {
        try {
            const data = await Api.get('/api/estoque/produtos');
            if (data && data.produtos) {
                itensCatalogo = data.produtos.map(p => ({
                    id: p.id,
                    nome: p.nome
                }));
            }
        } catch (e) {
            console.error('Erro ao buscar catálogo.', e);
        }
    }

    // ==================== MODAL DE EDIÇÃO ====================
    function abrirModalEdicao(codigo) {
        intencaoAtual = intencoes.find(i => i.codigo === codigo);
        if (!intencaoAtual) return;

        modalCodigo.textContent = intencaoAtual.codigo;
        modalNome.textContent = intencaoAtual.doador.nome;
        modalTelefone.textContent = intencaoAtual.doador.telefone;
        renderizarItensEdicao(intencaoAtual.itens);

        // Ocultar catálogo
        catalogoContainer.style.display = 'none';
        btnToggleCatalogo.textContent = '📋 Adicionar item do catálogo';

        modalOverlay.classList.add('active');
        modalOverlay.setAttribute('aria-hidden', 'false');
    }

    function fecharModalEdicao() {
        modalOverlay.classList.remove('active');
        modalOverlay.setAttribute('aria-hidden', 'true');
        intencaoAtual = null;
    }

    function renderizarItensEdicao(itens) {
        modalItensContainer.innerHTML = '';
        itens.forEach((item, index) => {
            const row = criarItemEdicaoRow(item, index);
            modalItensContainer.appendChild(row);
        });
    }

    function criarItemEdicaoRow(item, index) {
        const row = document.createElement('div');
        row.className = 'item-edicao-row';
        const nomeExibicao = item.nome || 'Item personalizado';
        row.innerHTML = `
            <span class="nome-item poppins-regular">${nomeExibicao}</span>
            <input type="number" class="quantidade-item poppins-regular" value="${item.quantidade}" min="0" data-index="${index}" style="width: 80px; padding: 6px; border: 1px solid var(--border-color); border-radius: 6px;">
            <button class="btn-remover-item-modal poppins-medium" style="background:none; border:none; color:var(--danger); cursor:pointer;">🗑️ Remover</button>
        `;

        const btnRemover = row.querySelector('.btn-remover-item-modal');
        btnRemover.addEventListener('click', async () => {
            const confirmado = await criarModalConfirmacao('Tem certeza que deseja remover este item?');
            if (confirmado) {
                intencaoAtual.itens.splice(index, 1);
                renderizarItensEdicao(intencaoAtual.itens);
                toast('Item removido', 'info');
            }
        });

        const inputQtd = row.querySelector('.quantidade-item');
        inputQtd.addEventListener('change', (e) => {
            const novaQtd = parseFloat(e.target.value);
            if (!isNaN(novaQtd) && novaQtd >= 0) {
                intencaoAtual.itens[index].quantidade = novaQtd;
            }
        });

        return row;
    }

    // ==================== FUNÇÕES DO CATÁLOGO E ITENS PERSONALIZADOS ====================
    function renderizarCatalogo() {
        catalogoLista.innerHTML = '';
        itensCatalogo.forEach(item => {
            const catalogoRow = document.createElement('div');
            catalogoRow.className = 'catalogo-item-row';
            catalogoRow.style = 'display:flex; justify-content:space-between; align-items:center; padding: 8px 0; border-bottom: 1px solid var(--border-color);';
            catalogoRow.innerHTML = `
                <span class="catalogo-item-nome poppins-medium" style="font-size:13px;">${item.nome}</span>
                <button class="btn-adicionar-catalogo poppins-semibold" data-id="${item.id}" data-nome="${item.nome}" style="padding: 6px 12px; background:var(--purple-bg); color:var(--purple-primary); border:none; border-radius:6px; cursor:pointer; font-size:12px;">Adicionar</button>
            `;
            catalogoLista.appendChild(catalogoRow);
        });

        // Eventos de adicionar item do catálogo
        document.querySelectorAll('.btn-adicionar-catalogo').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                const nome = btn.dataset.nome;
                adicionarItemDoCatalogo(id, nome);
            });
        });
    }

    function adicionarItemDoCatalogo(id, nome) {
        if (!intencaoAtual) return;

        intencaoAtual.itens.push({
            id: id,
            nome: nome,
            quantidade: 1
        });
        renderizarItensEdicao(intencaoAtual.itens);
        toast(`Item "${nome}" adicionado.`, 'success');
    }



    // ==================== SALVAR E CONFIRMAR ====================
    async function salvarEdicaoLocal() {
        if (!intencaoAtual) return;

        try {
            const res = await Api.patch(`/api/intencao-doacao/${intencaoAtual.id}/status`, {
                status: 'pendente',
                itens: intencaoAtual.itens
            });
            if (res && (res.status === 200 || !res.erro)) {
                toast('Alterações salvas no servidor', 'success');
                fecharModalEdicao();
                await carregarIntencoes();
            } else {
                toast(res.erro || res.data?.erro || 'Erro ao salvar alterações.', 'error');
            }
        } catch (err) {
            toast('Erro de conexão ao salvar.', 'error');
        }
    }

    async function confirmarRecebimento() {
        if (!intencaoAtual) return;

        // Remove itens com quantidade zero
        intencaoAtual.itens = intencaoAtual.itens.filter(item => item.quantidade > 0);

        if (intencaoAtual.itens.length === 0) {
            toast('A intenção precisa ter pelo menos um item com quantidade maior que zero.', 'error');
            return;
        }

        const confirmado = await criarModalConfirmacao(
            `Confirmar recebimento da intenção ${intencaoAtual.codigo}?<br>As quantidades serão acrescidas ao estoque atual do Mercado.`
        );
        if (!confirmado) return;

        try {
            const res = await Api.patch(`/api/intencao-doacao/${intencaoAtual.id}/status`, {
                status: 'concluida',
                itens: intencaoAtual.itens
            });
            if (res && (res.status === 200 || !res.erro)) {
                toast(`Intenção ${intencaoAtual.codigo} confirmada e estoque atualizado!`, 'success');
                fecharModalEdicao();
                await carregarIntencoes();
            } else {
                toast(res.erro || res.data?.erro || 'Erro ao confirmar recebimento.', 'error');
            }
        } catch (err) {
            toast('Erro de conexão ao confirmar recebimento.', 'error');
        }
    }

    // ==================== EVENTOS ====================
    searchInput.addEventListener('input', (e) => {
        const resultados = filtrarIntencoes(e.target.value);
        renderizarLista(resultados);
    });

    closeModalBtn.addEventListener('click', fecharModalEdicao);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) fecharModalEdicao();
    });

    btnToggleCatalogo.addEventListener('click', () => {
        const estaVisivel = catalogoContainer.style.display !== 'none';
        if (estaVisivel) {
            catalogoContainer.style.display = 'none';
            btnToggleCatalogo.textContent = '📋 Adicionar item do catálogo';
        } else {
            catalogoContainer.style.display = 'block';
            btnToggleCatalogo.textContent = '📋 Ocultar catálogo';
            renderizarCatalogo();
        }
    });

    btnSalvarEdicao.addEventListener('click', salvarEdicaoLocal);
    btnConfirmarRecebimento.addEventListener('click', confirmarRecebimento);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            fecharModalEdicao();
        }
    });

    // Inicializar
    await carregarCatalogo();
    await carregarIntencoes();
});