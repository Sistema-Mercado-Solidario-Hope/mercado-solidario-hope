import { toast } from './toast.js';
import Api from './api.js';
import { initLocalStorage } from './data.js';

initLocalStorage();
window.toast = toast;

// ==================== FRENTE DE CAIXA ====================

function verificarSessao() {
    return true;
}

const state = {
    beneficiary: null,
    cart: {},
    products: [],
    beneficiaries: [],
    allProducts: {},
};

const MOBILE_BREAKPOINT = 880;
let mobileUIInicializada = false;

function isMobile() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function carregarUsuario() {
    const user = JSON.parse(
        localStorage.getItem('ms_user') ||
        '{"nome":"Operador","tipo":"operador"}'
    );

    document.querySelectorAll('.user-nome-label').forEach(el => {
        el.textContent = user.nome;
    });

    document.querySelectorAll('.user-cargo-label').forEach(el => {
        el.textContent =
            user.tipo === 'admin'
                ? 'Administrador'
                : 'Operador de Estoque';
    });
}

async function carregarProdutos(categoria = '') {
    const endpoint = categoria
        ? `/api/estoque/produtos?categoria=${encodeURIComponent(categoria)}`
        : '/api/estoque/produtos';

    try {
        const data = await Api.get(endpoint);

        if (data && data.produtos) {
            const loadedProducts = data.produtos.map(p => {
                const hasPhoto = p.foto && p.foto !== 'None' && !p.foto.endsWith('/None') && !p.foto.endsWith('/null') && p.foto.trim() !== '';
                return {
                    id: p.id,
                    nome: p.nome || p.name || 'Sem nome',
                    descricao: p.descricao || p.description || '',
                    categoria: p.categoria || p.category || '',
                    unidadeMedida:
                        p.unidadeMedida ||
                        p.unidade ||
                        p.unidade_medida ||
                        '',
                    estoqueAtual:
                        p.estoqueAtual ??
                        p.quantityEstoque ??
                        p.quantity ??
                        0,
                    estoqueCritico:
                        Boolean(p.estoqueCritico) ||
                        (
                            typeof p.quantityEstoque === 'number' &&
                            p.quantityEstoque <= 12
                        ),
                    esgotado:
                        Boolean(p.esgotado) ||
                        (
                            (
                                p.quantityEstoque ??
                                p.quantity ??
                                p.estoqueAtual
                            ) === 0
                        ),
                    icone:
                        p.icone ||
                        (
                            hasPhoto
                                ? `<img
                                    src="${p.foto}"
                                    alt=""
                                    style="width:28px;height:28px;border-radius:6px;object-fit:cover"
                                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                                   ><span class="fallback-icon" style="display:none;">📦</span>`
                                : '📦'
                        ),
                };
            });

            loadedProducts.forEach(prod => {
                state.allProducts[prod.id] = prod;
            });
            state.products = loadedProducts;

            renderizarDesk();
            renderizarMob();
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        toast('erro', 'Não foi possível carregar os produtos.');
    }
}

function renderizarDesk() {
    const container = document.getElementById('grade-produtos');

    if (!container) return;

    container.innerHTML = '';

    if (!state.products.length) {
        container.innerHTML = `
            <div
                style="
                    color:var(--cinza-ph);
                    font-size:14px;
                    padding:24px 0;
                "
            >
                Nenhum produto nesta categoria.
            </div>
        `;
        return;
    }

    state.products.forEach(p => {
        const qty = state.cart[p.id] || 0;
        const esgotado = p.estoqueAtual === 0;
        const critico = p.estoqueCritico && p.estoqueAtual > 0;
        const selecionado = qty > 0;

        const card = document.createElement('div');
        card.className =
            `produto-card` +
            `${selecionado ? ' selecionado' : ''}` +
            `${esgotado ? ' esgotado' : ''}`;

        const dispLabel = p.estoqueAtual === 1 ? 'disponível' : 'disponíveis';

        const stockBlock = esgotado
            ? `<span class="prod-esgotado-tag">Esgotado</span>`
            : `<div class="prod-stock-row">
                <span class="prod-stock-num">${p.estoqueAtual}</span>
                <span class="prod-stock-unit">${p.unidadeMedida || 'un'}</span>
               </div>
               <div class="prod-stock-label">${dispLabel}</div>`;

        card.innerHTML = `
            <div class="prod-header">
                <span class="prod-icon">${p.icone || '📦'}</span>
            </div>

            <div class="produto-nome">${p.nome}</div>

            ${stockBlock}

            <div class="qty-ctrl">
                <button type="button" class="qty-btn" data-id="${p.id}" data-action="dec" ${esgotado ? 'disabled' : ''}>−</button>
                <span class="qty-val" id="qty-desk-${p.id}">${qty}</span>
                <button type="button" class="qty-btn" data-id="${p.id}" data-action="inc" ${esgotado ? 'disabled' : ''}>+</button>
            </div>
        `;

        container.appendChild(card);
    });
}

function renderizarMob() {
    if (!isMobile()) return;

    const container = document.getElementById('mob-lista-produtos');

    if (!container) return;

    container.innerHTML = '';

    state.products.forEach(p => {
        const qty = state.cart[p.id] || 0;
        const esgotado = p.estoqueAtual === 0;
        const critico = p.estoqueCritico && p.estoqueAtual > 0;

        const item = document.createElement('div');

        item.className = 'mob-product-item';

        item.innerHTML = `
            <div
                style="
                    width:56px;
                    height:56px;
                    background:var(--lilas-card);
                    border-radius:10px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:26px;
                    flex-shrink:0;
                "
            >
                ${p.icone || '📦'}
            </div>

            <div class="mob-prod-info">
                <div class="mob-prod-name">
                    ${p.nome}
                </div>

                <div class="mob-prod-stock${critico ? ' critico' : ''}">
                    ${
                        esgotado
                            ? `
                                <span
                                    style="
                                        color:var(--vermelho);
                                        font-weight:700;
                                    "
                                >
                                    Estoque Crítico: ESGOTADO
                                </span>
                            `
                            : `
                                Estoque:
                                ${p.estoqueAtual}
                                ${p.unidadeMedida || 'UN'}
                                ${critico ? '(Crítico)' : ''}
                            `
                    }
                </div>
            </div>

            <div class="mob-qty-ctrl">
                <button
                    type="button"
                    class="mob-qty-btn"
                    data-id="${p.id}"
                    data-action="dec"
                    ${esgotado ? 'disabled' : ''}
                >
                    −
                </button>

                <span
                    class="mob-qty-val"
                    id="qty-mob-${p.id}"
                >
                    ${qty}
                </span>

                <button
                    type="button"
                    class="mob-qty-btn"
                    data-id="${p.id}"
                    data-action="inc"
                    ${esgotado ? 'disabled' : ''}
                >
                    +
                </button>
            </div>
        `;

        container.appendChild(item);
    });
}

function atualizarQty(id, delta) {
    const atual = state.cart[id] || 0;
    const produto = state.products.find(p => String(p.id) === String(id));

    if (!produto) return;
    if (produto.estoqueAtual === 0) return;

    let proximaQuantidade = Math.max(0, atual + delta);

    if (proximaQuantidade > produto.estoqueAtual) {
        proximaQuantidade = produto.estoqueAtual;
    }

    state.cart[id] = proximaQuantidade;

    if (proximaQuantidade === 0) {
        delete state.cart[id];
    }

    const deskEl = document.getElementById(`qty-desk-${id}`);
    const mobEl = document.getElementById(`qty-mob-${id}`);

    if (deskEl) {
        deskEl.textContent = proximaQuantidade;
    }

    if (mobEl) {
        mobEl.textContent = proximaQuantidade;
    }

    document.querySelectorAll('.produto-card').forEach(card => {
        const btn = card.querySelector(`[data-id="${id}"]`);

        if (btn) {
            card.classList.toggle(
                'selecionado',
                proximaQuantidade > 0
            );
        }
    });

    atualizarPainelDireito();
    atualizarFooterMob();
}

function obterItensCarrinho() {
    return Object.entries(state.cart)
        .map(([id, qty]) => {
            const produto = (state.allProducts && state.allProducts[id]) || state.products.find(
                p => String(p.id) === String(id)
            );

            return produto
                ? {
                    produto,
                    qty,
                }
                : null;
        })
        .filter(Boolean);
}

function atualizarPainelDireito() {
    const lista = document.getElementById('carrinho-lista-itens');
    const countBadge = document.getElementById(
        'carrinho-lista-itens-count'
    );
    const cotaPct = document.getElementById('cota-percent-label');
    const cotaBar = document.getElementById('cota-progress-bar');

    if (!lista) return;

    const itens = obterItensCarrinho();

    lista.innerHTML = '';

    itens.forEach(({ produto, qty }) => {
        const row = document.createElement('div');

        row.className = 'cart-item';

        row.innerHTML = `
            <div>
                <div class="ci-name">
                    ${produto.nome}
                </div>

                <div class="ci-sub">
                    ${produto.descricao || ''}
                </div>
            </div>

            <div style="text-align:right">
                <div class="ci-qty">
                    ${qty} ${produto.unidadeMedida || 'UN'}
                </div>

                <button
                    type="button"
                    class="ci-rem"
                    data-id="${produto.id}"
                >
                    REMOVER
                </button>
            </div>
        `;

        lista.appendChild(row);
    });

    if (countBadge) {
        countBadge.textContent = itens.length;
    }

    const quantidadeTotal = itens.reduce(
        (total, item) => total + item.qty,
        0
    );

    const limit = (state.beneficiary && state.beneficiary.cota_limite) ? state.beneficiary.cota_limite : 15;
    const percentual = Math.min(100, Math.round((quantidadeTotal / limit) * 100));

    if (cotaPct) {
        cotaPct.textContent = `${percentual}%`;
    }

    if (cotaBar) {
        cotaBar.style.width = `${percentual}%`;
    }
}

function atualizarFooterMob() {
    if (!isMobile()) return;

    const total = Object.values(state.cart).reduce(
        (soma, valor) => soma + valor,
        0
    );

    const countEl = document.getElementById('mob-count');

    if (countEl) {
        countEl.textContent = total;
    }
}

function abrirBottomSheet() {
    if (!isMobile()) return;

    const lista = document.getElementById('bs-lista');

    if (!lista) return;

    lista.innerHTML = '';

    const itens = obterItensCarrinho();

    if (!itens.length) {
        lista.innerHTML = `
            <p
                style="
                    color:var(--cinza-ph);
                    font-size:14px;
                    text-align:center;
                    padding:16px;
                "
            >
                Nenhum item selecionado.
            </p>
        `;
    } else {
        itens.forEach(({ produto, qty }) => {
            const item = document.createElement('div');

            item.className = 'bs-item';

            item.innerHTML = `
                <div>
                    <div class="bi-name">
                        ${produto.nome}
                    </div>

                    <div class="bi-sub">
                        ${produto.descricao || ''}
                    </div>
                </div>

                <div style="text-align:right">
                    <div class="bi-qty">
                        ${qty} ${produto.unidadeMedida || 'UN'}
                    </div>

                    <button
                        type="button"
                        class="bi-rem"
                        data-id="${produto.id}"
                    >
                        REMOVER
                    </button>
                </div>
            `;

            lista.appendChild(item);
        });
    }

    document.getElementById('bs-overlay')?.classList.add('open');
    document.getElementById('bottom-sheet')?.classList.add('open');
}

function fecharBottomSheet() {
    document.getElementById('bs-overlay')?.classList.remove('open');
    document.getElementById('bottom-sheet')?.classList.remove('open');
}

async function carregarBeneficiario(id) {
    try {
        const data = await Api.get(`/api/beneficiarios/${id}`);

        if (!data) return;

        state.beneficiary = data;

        const nameEl = document.getElementById('ben-name');
        const membEl = document.getElementById('ben-members');
        const delivEl = document.getElementById(
            'ben-last-delivery'
        );
        const statusEl = document.getElementById('ben-status');

        if (nameEl) {
            nameEl.textContent =
                data.name ||
                data.nomeFamilia ||
                'Família selecionada';
        }

        if (membEl) {
            membEl.textContent =
                data.members ||
                data.qtdIntegrantes ||
                '—';
        }

        if (delivEl) {
            delivEl.textContent = data.ultimaParticipacao || '—';
        }

        if (statusEl) {
            statusEl.textContent =
                data.status ||
                data.situacao ||
                'Elegível';
        }
        atualizarPainelDireito();
    } catch (error) {
        console.error('Erro ao carregar beneficiário:', error);
    }
}

function configurarFiltros() {
    document
        .getElementById('filtros-categoria')
        ?.addEventListener('click', event => {
            const btn = event.target.closest('.tab-btn');

            if (!btn) return;

            document.querySelectorAll('.tab-btn').forEach(item => {
                item.classList.remove('ativo');
            });

            btn.classList.add('ativo');

            carregarProdutos(btn.dataset.categoria || '');
        });
}

function configurarTabsMobile() {
    if (!isMobile()) return;

    const tabs = document.getElementById('mob-tabs');

    if (!tabs) return;

    tabs.addEventListener('click', event => {
        const btn = event.target.closest('.mob-tab');

        if (!btn) return;

        document.querySelectorAll('.mob-tab').forEach(item => {
            item.classList.remove('ativo');
        });

        btn.classList.add('ativo');

        carregarProdutos(btn.dataset.cat || '');
    });
}

async function confirmarEntrega() {
    if (!state.beneficiary) {
        toast('erro', 'Selecione uma família antes de confirmar a entrega.');
        return;
    }
    const cartKeys = Object.keys(state.cart);
    if (!cartKeys.length) {
        toast('erro', 'Selecione ao menos um item.');
        return;
    }

    const itens = cartKeys.map(id => ({
        produto_id: parseInt(id, 10),
        quantidade: state.cart[id]
    })).filter(item => item.quantidade > 0);

    if (!itens.length) {
        toast('erro', 'Selecione ao menos um item.');
        return;
    }

    const payload = {
        beneficiario_id: state.beneficiary.id,
        itens: itens
    };

    try {
        const res = await Api.post('/api/entregas/confirmar', payload);
        if (res && (res.status === 201 || !res.erro)) {
            // Save last delivery details to sessionStorage
            const dynamicItens = itens.map(it => {
                const prod = (state.allProducts && state.allProducts[it.produto_id]);
                return {
                    nome: prod ? prod.nome : 'Produto',
                    quantidade: it.quantidade,
                    unidade: prod ? prod.unidadeMedida : 'un'
                };
            });
            sessionStorage.setItem('last_delivery', JSON.stringify({
                id: (res.data && res.data.entrega && res.data.entrega.id) ? res.data.entrega.id : 'N/A',
                data: (res.data && res.data.entrega && res.data.entrega.data) ? res.data.entrega.data : new Date().toISOString(),
                beneficiario: (state.beneficiary && (state.beneficiary.nome || state.beneficiary.nomeFamilia)) ? (state.beneficiary.nome || state.beneficiary.nomeFamilia) : 'Beneficiário',
                itens: dynamicItens
            }));

            state.cart = {};
            renderizarDesk();
            renderizarMob();
            atualizarPainelDireito();
            atualizarFooterMob();
            fecharBottomSheet();
            window.location.href = '/sucesso.html';
        } else {
            toast('erro', res.erro || res.data?.erro || 'Erro ao confirmar entrega.');
        }
    } catch (err) {
        toast('erro', 'Erro de conexão ao confirmar entrega.');
    }
}

function bindMobileControls() {
    document
        .getElementById('mob-ver-lista')
        ?.addEventListener('click', abrirBottomSheet);

    document
        .getElementById('bs-overlay')
        ?.addEventListener('click', fecharBottomSheet);

    document
        .getElementById('mob-btn-confirmar')
        ?.addEventListener('click', confirmarEntrega);

    document
        .getElementById('bs-confirmar-btn')
        ?.addEventListener('click', confirmarEntrega);
}

function sincronizarInterfaceMobile() {
    const mobileAtivo = isMobile();

    if (mobileAtivo && !mobileUIInicializada) {
        configurarTabsMobile();
        bindMobileControls();
        mobileUIInicializada = true;
    }

    if (!mobileAtivo) {
        fecharBottomSheet();
        return;
    }

    renderizarMob();
    atualizarFooterMob();
}

document.addEventListener('click', event => {
    const btn = event.target.closest('[data-action]');

    if (
        btn &&
        (
            btn.classList.contains('qty-btn') ||
            btn.classList.contains('mob-qty-btn')
        )
    ) {
        const id = btn.dataset.id;
        const delta = btn.dataset.action === 'inc' ? 1 : -1;

        atualizarQty(id, delta);
        return;
    }

    const removerDesktop = event.target.closest('.ci-rem');

    if (removerDesktop) {
        const id = removerDesktop.dataset.id;

        delete state.cart[id];

        renderizarDesk();
        renderizarMob();
        atualizarPainelDireito();
        atualizarFooterMob();

        return;
    }

    const removerMobile = event.target.closest('.bi-rem');

    if (removerMobile) {
        const id = removerMobile.dataset.id;

        delete state.cart[id];

        renderizarDesk();
        renderizarMob();
        atualizarPainelDireito();
        atualizarFooterMob();
        abrirBottomSheet();
    }
});

function configurarBuscaBeneficiario() {
    const input = document.getElementById('busca-beneficiario');
    const suggestionsContainer = document.getElementById('busca-suggestions');
    if (!input || !suggestionsContainer) return;

    let timeout = null;

    input.addEventListener('input', () => {
        clearTimeout(timeout);
        const query = input.value.trim();
        if (!query) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.add('hidden');
            return;
        }

        timeout = setTimeout(async () => {
            try {
                const data = await Api.get(`/api/beneficiarios/busca?q=${encodeURIComponent(query)}`);
                if (data && data.beneficiarios) {
                    const activeOnly = data.beneficiarios.filter(b => b.status === 'ACTIVE' || b.status_pt === 'ativo');
                    if (activeOnly.length === 0) {
                        suggestionsContainer.innerHTML = '<div class="busca-suggestion-item">Nenhuma família elegível encontrada</div>';
                    } else {
                        suggestionsContainer.innerHTML = '';
                        activeOnly.forEach(b => {
                            const div = document.createElement('div');
                            div.className = 'busca-suggestion-item';
                            div.textContent = `${b.nome} (${b.responsavel}) - CPF: ${b.cpf || '—'}`;
                            div.addEventListener('click', () => {
                                carregarBeneficiario(b.id);
                                input.value = b.nome;
                                suggestionsContainer.innerHTML = '';
                                suggestionsContainer.classList.add('hidden');
                            });
                            suggestionsContainer.appendChild(div);
                        });
                    }
                    suggestionsContainer.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Erro ao buscar beneficiários:', err);
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.add('hidden');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!verificarSessao()) return;

    carregarUsuario();

    await carregarProdutos();
    
    try {
        const initialList = await Api.get('/api/beneficiarios');
        if (initialList && initialList.beneficiarios && initialList.beneficiarios.length > 0) {
            const firstActive = initialList.beneficiarios.find(b => b.status === 'ACTIVE' || b.status_pt === 'ativo');
            if (firstActive) {
                await carregarBeneficiario(firstActive.id);
            }
        }
    } catch (e) {
        console.error('Erro ao carregar beneficiário inicial:', e);
    }

    atualizarPainelDireito();
    atualizarFooterMob();

    configurarFiltros();
    configurarBuscaBeneficiario();
    sincronizarInterfaceMobile();

    window.addEventListener(
        'resize',
        sincronizarInterfaceMobile
    );

    document
        .getElementById('btn-finalizar-entrega')
        ?.addEventListener('click', confirmarEntrega);

    document.addEventListener('keydown', event => {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === 'Enter'
        ) {
            event.preventDefault();

            document
                .getElementById('btn-finalizar-entrega')
                ?.click();
        }
    });
});