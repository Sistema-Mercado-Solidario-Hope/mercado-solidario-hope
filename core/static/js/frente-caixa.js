import { toast } from './toast.js';      // antes: './js/toast.js'
import Api from './api.js';              // antes: './js/api.js'
import { initLocalStorage } from './data.js'; // antes: './js/data.js'

initLocalStorage();
window.toast = toast;

// ==================== BASE.JS (integrado) ====================
(function() {
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);

const scrollToTopBtn = document.getElementById('scrollToTopBtn');
window.addEventListener('scroll', () => {
    if (scrollToTopBtn) scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
});
if (scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

mobileMenuBtn.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
sidebarOverlay.addEventListener('click', closeSidebar);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
});

sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 900) closeSidebar();
    });
});

// Notificações
const notificationBtn = document.getElementById('notificationBtn');
const notificationDropdown = document.getElementById('notificationDropdown');
const notificationList = document.getElementById('notificationList');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const notificationDot = document.querySelector('.notification-dot');

let notifications = [
    { id: 1, title: 'Estoque crítico', description: 'Leite Integral está com apenas 12 unidades.', time: 'Agora', icon: '📦', read: false },
    { id: 2, title: 'Doação concluída', description: 'Família Silva recebeu a cesta básica.', time: 'Há 10 min', icon: '✅', read: false },
    { id: 3, title: 'Lembrete', description: 'Verifique os vencimentos dos produtos.', time: 'Ontem', icon: '⏰', read: true }
];

function renderNotifications() {
    if (!notificationList) return;
    notificationList.innerHTML = '';
    const unreadCount = notifications.filter(n => !n.read).length;
    if (notificationDot) notificationDot.classList.toggle('hidden', unreadCount === 0);
    notifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = `notification-item ${notif.read ? '' : 'unread'} poppins-regular`;
        item.innerHTML = `
            <div class="notification-icon">${notif.icon}</div>
            <div class="notification-content">
                <div class="notification-title poppins-semibold">${notif.title}</div>
                <div class="notification-desc">${notif.description}</div>
                <div class="notification-time">${notif.time}</div>
            </div>
            <button class="notification-delete-btn" aria-label="Excluir">✕</button>
        `;
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-delete-btn')) {
                notif.read = true;
                renderNotifications();
            }
        });
        item.querySelector('.notification-delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            notifications = notifications.filter(n => n.id !== notif.id);
            renderNotifications();
        });
        notificationList.appendChild(item);
    });
}

notificationBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('active');
});
document.addEventListener('click', (e) => {
    if (!notificationDropdown?.contains(e.target) && e.target !== notificationBtn) {
        notificationDropdown?.classList.remove('active');
    }
});
markAllReadBtn?.addEventListener('click', () => {
    notifications.forEach(n => n.read = true);
    renderNotifications();
});
renderNotifications();

// Dropdown tabs
const dropdownToggle = document.getElementById('dropdownToggle');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownLabel = document.getElementById('dropdownLabel');
dropdownToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu?.classList.toggle('open');
});
document.addEventListener('click', (e) => {
    if (!dropdownToggle?.contains(e.target) && !dropdownMenu?.contains(e.target)) {
        dropdownMenu?.classList.remove('open');
    }
});
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        if (dropdownLabel) dropdownLabel.textContent = this.textContent.trim();
        dropdownMenu?.classList.remove('open');
    });
});

document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});
})();

// ==================== DASHBOARD.JS (gestão de estoque) ====================
function verificarSessao() {
const token = localStorage.getItem('ms_token');
if (!token) {
    window.location.href = './login.html';
    return false;
}
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
const user = JSON.parse(localStorage.getItem('ms_user') || '{"nome":"Operador","tipo":"operador"}');
document.querySelectorAll('.user-nome-label')?.forEach(el => el.textContent = user.nome);
document.querySelectorAll('.user-cargo-label')?.forEach(el => el.textContent = user.tipo === 'admin' ? 'Administrador' : 'Operador de Estoque');
}

async function carregarProdutos(categoria = '') {
const endpoint = categoria ? `/api/estoque/produtos?categoria=${encodeURIComponent(categoria)}` : '/api/estoque/produtos';
const data = await Api.get(endpoint);
if (data && data.produtos) {
    state.products = data.produtos.map(p => ({
        id: p.id,
        nome: p.nome || p.name || 'Sem nome',
        descricao: p.descricao || p.description || '',
        categoria: p.categoria || p.category || '',
        unidadeMedida: p.unidadeMedida || p.unidade || p.unidade_medida || '',
        estoqueAtual: (p.estoqueAtual ?? p.quantityEstoque ?? p.quantity ?? 0),
        estoqueCritico: Boolean(p.estoqueCritico) || (typeof p.quantityEstoque === 'number' && p.quantityEstoque <= 12),
        esgotado: Boolean(p.esgotado) || ((p.quantityEstoque ?? p.quantity ?? p.estoqueAtual) === 0),
        icone: p.icone || (p.foto ? `<img src="${p.foto}" alt="" style="width:28px;height:28px;border-radius:6px;object-fit:cover" />` : p.icone) || '📦'
    }));
    renderizarDesk();
    renderizarMob();
}
}

function renderizarDesk() {
const container = document.getElementById('grade-produtos');
if (!container) return;
container.innerHTML = '';
if (!state.products.length) {
    container.innerHTML = '<div style="color:var(--cinza-ph);font-size:14px;padding:24px 0">Nenhum produto nesta categoria.</div>';
    return;
}
state.products.forEach(p => {
    const qty = state.cart[p.id] || 0;
    const esgotado = p.estoqueAtual === 0;
    const critico = p.estoqueCritico && p.estoqueAtual > 0;
    const selecionado = qty > 0;
    const card = document.createElement('div');
    card.className = `produto-card${selecionado ? ' selecionado' : ''}${esgotado ? ' esgotado' : ''}`;
    card.innerHTML = `
        <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                <span style="font-size:22px">${p.icone || '📦'}</span>
                <span class="prod-stock-top" style="color:${esgotado ? 'var(--vermelho)' : 'var(--cinza-ph)'}">
                    ${esgotado ? 'ESGOTADO' : (p.estoqueAtual + ' ' + (p.unidadeMedida || ''))}
                </span>
            </div>
            <div class="produto-nome">${p.nome}</div>
            <div class="produto-sub">${p.descricao || ''}</div>
            ${critico ? `<div style="font-size:11px;color:var(--vermelho);font-weight:700;margin-top:4px">Estoque Crítico</div>` : ''}
        </div>
        <div class="qty-ctrl">
            <button class="qty-btn" data-id="${p.id}" data-action="dec" ${esgotado ? 'disabled' : ''}>−</button>
            <span class="qty-val" id="qty-desk-${p.id}">${qty > 0 ? qty : '0'}</span>
            <button class="qty-btn" data-id="${p.id}" data-action="inc" ${esgotado ? 'disabled' : ''}>+</button>
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
        <div style="width:56px;height:56px;background:var(--lilas-card);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">${p.icone || '📦'}</div>
        <div class="mob-prod-info">
            <div class="mob-prod-name">${p.nome}</div>
            <div class="mob-prod-stock${critico ? ' critico' : ''}">
                ${esgotado ? '<span style="color:var(--vermelho);font-weight:700">Estoque Crítico: ESGOTADO</span>' : `Estoque: ${p.estoqueAtual} ${p.unidadeMedida || 'UN'}${critico ? ' (Crítico)' : ''}`}
            </div>
        </div>
        <div class="mob-qty-ctrl">
            <button class="mob-qty-btn" data-id="${p.id}" data-action="dec" ${esgotado ? 'disabled' : ''}>−</button>
            <span class="mob-qty-val" id="qty-mob-${p.id}">${qty}</span>
            <button class="mob-qty-btn" data-id="${p.id}" data-action="inc" ${esgotado ? 'disabled' : ''}>+</button>
        </div>
    `;
    container.appendChild(item);
});
}

function atualizarQty(id, delta) {
const cur = state.cart[id] || 0;
const prod = state.products.find(p => p.id === id);
if (!prod) return;
let next = Math.max(0, cur + delta);
if (prod.estoqueAtual === 0) return;
state.cart[id] = next;
if (next === 0) delete state.cart[id];

const deskEl = document.getElementById(`qty-desk-${id}`);
const mobEl = document.getElementById(`qty-mob-${id}`);
if (deskEl) deskEl.textContent = next;
if (mobEl) mobEl.textContent = next;

document.querySelectorAll(`.produto-card`).forEach(card => {
    const btn = card.querySelector(`[data-id="${id}"]`);
    if (btn) card.classList.toggle('selecionado', next > 0);
});

atualizarPainelDireito();
atualizarFooterMob();
}

function atualizarPainelDireito() {
const lista = document.getElementById('carrinho-lista-itens');
const count = document.getElementById('itens-selecionados-count');
const cotaPct = document.getElementById('cota-percent-label');
const cotaBar = document.getElementById('cota-progress-bar');
if (!lista) return;

const itens = Object.entries(state.cart).map(([id, qty]) => {
    const prod = state.products.find(p => p.id === id);
    return prod ? { prod, qty } : null;
}).filter(Boolean);

lista.innerHTML = '';
itens.forEach(({ prod, qty }) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
        <div>
            <div class="ci-name">${prod.nome}</div>
            <div class="ci-sub">${prod.descricao || ''}</div>
        </div>
        <div style="text-align:right">
            <div class="ci-qty">${qty} ${prod.unidadeMedida || 'UN'}</div>
            <div class="ci-rem" data-id="${prod.id}">REMOVER</div>
        </div>
    `;
    lista.appendChild(row);
});

const countBadge = document.getElementById('itens-selecionados-count');
if (countBadge) {
    const total = itens.length;
    countBadge.textContent = total === 1 ? '1 item' : `${total} itens`;
}
const pct = Math.min(100, itens.length * 20);
if (cotaPct) cotaPct.textContent = pct + '%';
if (cotaBar) cotaBar.style.width = pct + '%';
}

function atualizarFooterMob() {
if (!isMobile()) return;
const total = Object.values(state.cart).reduce((a, v) => a + v, 0);
const countEl = document.getElementById('mob-count');
if (countEl) countEl.textContent = total;
}

function abrirBottomSheet() {
if (!isMobile()) return;
const lista = document.getElementById('bs-lista');
if (!lista) return;
lista.innerHTML = '';
const itens = Object.entries(state.cart).map(([id, qty]) => {
    const prod = state.products.find(p => p.id === id);
    return prod ? { prod, qty } : null;
}).filter(Boolean);

if (!itens.length) {
    lista.innerHTML = '<p style="color:var(--cinza-ph);font-size:14px;text-align:center;padding:16px">Nenhum item selecionado.</p>';
} else {
    itens.forEach(({ prod, qty }) => {
        const item = document.createElement('div');
        item.className = 'bs-item';
        item.innerHTML = `
            <div>
                <div class="bi-name">${prod.nome}</div>
                <div class="bi-sub">${prod.descricao || ''}</div>
            </div>
            <div style="text-align:right">
                <div class="bi-qty">${qty} ${prod.unidadeMedida || 'UN'}</div>
                <div class="bi-rem" data-id="${prod.id}">REMOVER</div>
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
const data = await Api.get(`/api/beneficiarios/${id}`);
if (data) {
    state.beneficiary = data;
    const nameEl = document.getElementById('ben-name');
    const membEl = document.getElementById('ben-members');
    const delivEl = document.getElementById('ben-last-delivery');
    if (nameEl) nameEl.textContent = data.name || data.nomeFamilia || '';
    if (membEl) membEl.textContent = data.members || data.qtdIntegrantes || '—';
    if (delivEl) delivEl.textContent = data.lastDeliveryDays ? `${data.lastDeliveryDays} dias` : '—';
}
}

function configurarFiltros() {
document.getElementById('filtros-categoria')?.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    carregarProdutos(btn.dataset.categoria);
});
}

function configurarTabsMobile() {
if (!isMobile()) return;
const tabs = document.getElementById('mob-tabs');
if (!tabs) return;
tabs.addEventListener('click', e => {
    const btn = e.target.closest('.mob-tab');
    if (!btn) return;
    document.querySelectorAll('.mob-tab').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    carregarProdutos(btn.dataset.cat);
});
}

function bindMobileControls() {
document.getElementById('mob-ver-lista')?.addEventListener('click', abrirBottomSheet);
document.getElementById('bs-overlay')?.addEventListener('click', fecharBottomSheet);
document.getElementById('mob-btn-confirmar')?.addEventListener('click', confirmarEntrega);
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
} else {
    renderizarMob();
    atualizarFooterMob();
}
}

document.addEventListener('click', e => {
const btn = e.target.closest('[data-action]');
if (btn && (btn.classList.contains('qty-btn') || btn.classList.contains('mob-qty-btn'))) {
    const id = btn.dataset.id;
    const delta = btn.dataset.action === 'inc' ? 1 : -1;
    atualizarQty(id, delta);
    return;
}
if (e.target.classList.contains('ci-rem')) {
    const id = e.target.dataset.id;
    delete state.cart[id];
    renderizarDesk();
    renderizarMob();
    atualizarPainelDireito();
    atualizarFooterMob();
    return;
}
if (e.target.classList.contains('bi-rem')) {
    const id = e.target.dataset.id;
    delete state.cart[id];
    renderizarDesk();
    renderizarMob();
    atualizarPainelDireito();
    atualizarFooterMob();
    abrirBottomSheet();
    return;
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

window.addEventListener('resize', sincronizarInterfaceMobile);

document.getElementById('btn-finalizar-entrega')?.addEventListener('click', confirmarEntrega);

document.getElementById('bs-confirmar-btn')?.addEventListener('click', confirmarEntrega);

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('btn-finalizar-entrega')?.click();
    }
    if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('busca-beneficiario')?.focus();
    }
});

function confirmarEntrega() {
    if (!Object.keys(state.cart).length) {
        toast('erro', 'Selecione ao menos um item.');
        return;
    }

    // Limpa o carrinho (comportamento antigo)
    state.cart = {};
    renderizarDesk();
    renderizarMob();
    atualizarPainelDireito();
    atualizarFooterMob();

    // Redireciona para a página de sucesso
    window.location.href = './sucesso.html';
}
});