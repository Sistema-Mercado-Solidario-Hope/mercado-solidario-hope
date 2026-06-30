import Api from './api.js?v=3';

document.addEventListener('DOMContentLoaded', async () => {

    let familias = [];

    // ==================== REFERÊNCIAS ====================
    const tableBody = document.getElementById('tableBody');
    const totalFamiliasEl = document.getElementById('totalFamilias');
    const familiasAtivasEl = document.getElementById('familiasAtivas');
    const totalMembrosEl = document.getElementById('totalMembros');
    const searchInput = document.getElementById('searchInput');
    const tableInfo = document.getElementById('tableInfo');
    const paginacaoContainer = document.getElementById('paginacao');
    const modalExclusao = document.getElementById('modalExclusao');
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');
    const btnCancelarExclusao = document.getElementById('btnCancelarExclusao');

    const ITENS_POR_PAGINA = 10;
    let paginaAtual = 1;
    let termoBusca = '';
    let idParaExcluir = null;
    let elementoFocoAnterior = null;

    // ==================== FUNÇÕES AUXILIARES ====================
    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
    }

    function formatarDataRelativa(dataStr) {
        if (!dataStr || dataStr === '—' || dataStr === 'undefined' || dataStr === 'null') return '—';
        const hoje = new Date();
        const data = new Date(dataStr + 'T00:00:00');
        if (isNaN(data.getTime())) return '—';
        const diffMs = hoje - data;
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDias < 0) return '—';
        if (diffDias === 0) return 'Hoje';
        if (diffDias === 1) return 'Ontem';
        return `${diffDias} dias atrás`;
    }

    function atualizarResumos() {
        totalFamiliasEl.textContent = familias.length;
        familiasAtivasEl.textContent = familias.filter(f => f.status === 'ativo').length;
        totalMembrosEl.textContent = familias.reduce((sum, f) => sum + f.numMembros, 0);
    }

    // ==================== FILTRO E PAGINAÇÃO ====================
    function filtrarFamilias(termo) {
        if (!termo) return familias;
        const lower = termo.toLowerCase();
        const cleanTerm = lower.replace(/\D/g, '');
        return familias.filter(f =>
            f.nome.toLowerCase().includes(lower) ||
            f.responsavel.toLowerCase().includes(lower) ||
            f.telefone.includes(termo) ||
            (f.cpf && f.cpf.replace(/\D/g, '').includes(cleanTerm)) ||
            (f.nis && f.nis.includes(termo))
        );
    }

    function renderizarTabela(termo = '', pagina = 1) {
        termoBusca = termo;
        const filtradas = filtrarFamilias(termo);
        const totalFiltradas = filtradas.length;
        const totalPaginas = Math.ceil(totalFiltradas / ITENS_POR_PAGINA) || 1;

        if (pagina > totalPaginas) pagina = totalPaginas;
        if (pagina < 1) pagina = 1;
        paginaAtual = pagina;

        const inicio = (pagina - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const exibidas = filtradas.slice(inicio, fim);

        tableBody.innerHTML = '';

        if (exibidas.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" class="poppins-regular" style="text-align:center; padding:32px; color:var(--text-muted);">Nenhuma família encontrada.</td></tr>`;
            tableInfo.textContent = 'Exibindo 0 famílias';
        } else {
            exibidas.forEach(f => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${f.nome}</strong></td>
                    <td>${f.responsavel}</td>
                    <td>${f.cpf || '—'}</td>
                    <td>${f.nis || '—'}</td>
                    <td>${f.telefone}</td>
                    <td>${f.numMembros}</td>
                    <td>${formatarDataRelativa(f.ultimaParticipacao)}</td>
                    <td><span class="status-badge status-${f.status}">${f.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                    <td class="actions-cell">
                        <a href="cadastro-familia.html?id=${f.id}" class="btn-edit" title="Editar">✎</a>
                        <button class="btn-delete" data-id="${f.id}" title="Excluir">🗑</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            const exibindo = inicio + 1;
            const ate = Math.min(fim, totalFiltradas);
            tableInfo.textContent = `Exibindo ${exibindo}-${ate} de ${totalFiltradas} famílias`;
        }

        renderizarPaginacao(totalPaginas);

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                abrirModalExclusao(id);
            });
        });
    }

    function renderizarPaginacao(totalPaginas) {
        if (!paginacaoContainer) return;
        paginacaoContainer.innerHTML = '';
        if (totalPaginas <= 1) return;

        // Botão Anterior
        const btnAnterior = document.createElement('button');
        btnAnterior.className = 'btn-pagina';
        btnAnterior.textContent = '‹';
        btnAnterior.disabled = paginaAtual === 1;
        btnAnterior.addEventListener('click', () => renderizarTabela(termoBusca, paginaAtual - 1));
        paginacaoContainer.appendChild(btnAnterior);

        // Números das páginas
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
            btn.addEventListener('click', () => renderizarTabela(termoBusca, i));
            paginacaoContainer.appendChild(btn);
        }

        // Botão Próximo
        const btnProximo = document.createElement('button');
        btnProximo.className = 'btn-pagina';
        btnProximo.textContent = '›';
        btnProximo.disabled = paginaAtual === totalPaginas;
        btnProximo.addEventListener('click', () => renderizarTabela(termoBusca, paginaAtual + 1));
        paginacaoContainer.appendChild(btnProximo);
    }

    // ==================== CARREGAR DADOS DA API ====================
    async function carregarERenderizar() {
        try {
            const data = await Api.get('/api/beneficiarios');
            if (data && data.beneficiarios) {
                familias = data.beneficiarios.map(b => ({
                    id: b.id,
                    nome: b.nome || b.nomeFamilia,
                    responsavel: b.responsavel || b.responsavel_nome,
                    cpf: b.cpf || b.cpf_nis || '',
                    nis: b.nis || '',
                    telefone: b.telefone,
                    endereco: b.endereco || '',
                    numMembros: b.members || b.numMembros || b.qtdIntegrantes || 1,
                    status: ['inactive', 'inativo'].includes((b.status_pt || b.status || '').toLowerCase()) ? 'inativo' : 'ativo',
                    ultimaParticipacao: b.ultimaParticipacao
                }));
                renderizarTabela(termoBusca, paginaAtual);
                atualizarResumos();
            } else {
                showToast(data.erro || 'Erro ao carregar famílias.', 'error');
            }
        } catch (e) {
            showToast('Erro de conexão ao buscar famílias.', 'error');
        }
    }

    // ==================== MODAL DE EXCLUSÃO (ACESSÍVEL) ====================
    function abrirModalExclusao(id) {
        idParaExcluir = id;
        elementoFocoAnterior = document.activeElement;
        modalExclusao.classList.add('active');
        modalExclusao.setAttribute('aria-hidden', 'false');

        const btnCancelar = document.getElementById('btnCancelarExclusao');
        if (btnCancelar) btnCancelar.focus();
    }

    function fecharModalExclusao() {
        modalExclusao.classList.remove('active');
        modalExclusao.setAttribute('aria-hidden', 'true');
        idParaExcluir = null;

        if (document.activeElement && modalExclusao.contains(document.activeElement)) {
            document.activeElement.blur();
        }

        if (elementoFocoAnterior && typeof elementoFocoAnterior.focus === 'function') {
            elementoFocoAnterior.focus();
            elementoFocoAnterior = null;
        }
    }

    // ==================== EVENTOS ====================
    btnConfirmarExclusao.addEventListener('click', async () => {
        if (idParaExcluir) {
            try {
                const res = await Api.delete(`/api/beneficiarios/${idParaExcluir}`);
                if (res && (res.status === 200 || !res.erro)) {
                    showToast('Família excluída com sucesso.', 'info');
                    await carregarERenderizar();
                } else {
                    showToast(res.erro || res.data?.erro || 'Erro ao excluir família.', 'error');
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

    searchInput.addEventListener('input', (e) => {
        renderizarTabela(e.target.value, 1);
    });

    // ==================== INICIALIZAÇÃO ====================
    await carregarERenderizar();
});