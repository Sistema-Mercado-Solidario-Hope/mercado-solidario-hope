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
            state.products = data.produtos.map(p => ({
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
                        p.foto
                            ? `<img
                                src="${p.foto}"
                                alt=""
                                style="width:28px;height:28px;border-radius:6px;object-fit:cover"
                               >`
                            : '📦'
                    ),
            }));

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

        card.innerHTML = `
            <div>
                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-start;
                        margin-bottom:10px;
                    "
                >
                    <span style="font-size:22px">
                        ${p.icone || '📦'}
                    </span>

                    <span
                        class="prod-stock-top"
                        style="
                            color:
                            ${esgotado
                                ? 'var(--vermelho)'
                                : 'var(--cinza-ph)'
                            };
                        "
                    >
                        ${
                            esgotado
                                ? 'ESGOTADO'
                                : `${p.estoqueAtual} ${p.unidadeMedida || ''}`
                        }
                    </span>
                </div>

                <div class="produto-nome">
                    ${p.nome}
                </div>

                <div class="produto-sub">
                    ${p.descricao || ''}
                </div>

                ${
                    critico
                        ? `
                            <div
                                style="
                                    font-size:11px;
                                    color:var(--vermelho);
                                    font-weight:700;
                                    margin-top:4px;
                                "
                            >
                                Estoque Crítico
                            </div>
                        `
                        : ''
                }
            </div>

            <div class="qty-ctrl">
                <button
                    type="button"
                    class="qty-btn"
                    data-id="${p.id}"
                    data-action="dec"
                    ${esgotado ? 'disabled' : ''}
                >
                    −
                </button>

                <span
                    class="qty-val"
                    id="qty-desk-${p.id}"
                >
                    ${qty}
                </span>

                <button
                    type="button"
                    class="qty-btn"
                    data-id="${p.id}"
                    data-action="inc"
                    ${esgotado ? 'disabled' : ''}
                >
                    +
                </button>
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
            const produto = state.products.find(
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

    const percentual = Math.min(100, quantidadeTotal * 20);

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
            delivEl.textContent = data.lastDeliveryDays
                ? `${data.lastDeliveryDays} dias`
                : '—';
        }

        if (statusEl) {
            statusEl.textContent =
                data.status ||
                data.situacao ||
                'Elegível';
        }
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
    if (!Object.keys(state.cart).length) {
        toast('erro', 'Selecione ao menos um item.');
        return;
    }

    state.cart = {};

    renderizarDesk();
    renderizarMob();
    atualizarPainelDireito();
    atualizarFooterMob();
    fecharBottomSheet();

    window.location.href = '/sucesso.html';
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

document.addEventListener('DOMContentLoaded', async () => {
    if (!verificarSessao()) return;

    carregarUsuario();

    await carregarProdutos();
    await carregarBeneficiario('ben-1');

    atualizarPainelDireito();
    atualizarFooterMob();

    configurarFiltros();
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

        if (event.key === 'F1') {
            event.preventDefault();

            document
                .getElementById('busca-beneficiario')
                ?.focus();
        }
    });
});