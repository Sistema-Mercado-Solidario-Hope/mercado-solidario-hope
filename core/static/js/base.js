import Api from './api.js';

// ============ REFERÊNCIAS DO DOM ============
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const toastContainer = document.getElementById('toastContainer');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

// ============ BOTÃO FECHAR PELO X (MOBILE) ============
if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeSidebar);
}

// ============ BOTÃO FLUTUANTE (VOLTAR AO TOPO) ============
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
window.addEventListener('scroll', () => {
    if (scrollToTopBtn) {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    }
});
if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============ MOBILE MENU TOGGLE ============
function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (sidebarOverlay) sidebarOverlay.setAttribute('aria-hidden', 'false');
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
    if (sidebarOverlay) sidebarOverlay.setAttribute('aria-hidden', 'true');
}

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        if (sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
    }
});

// Fechar sidebar ao clicar em qualquer link (mobile)
if (sidebar) {
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 900) closeSidebar();
        });
    });
}

// ============ SISTEMA DE TOAST ============
function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} poppins-medium`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || '✓'}</span> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3000);
}

// ============ SISTEMA DE NOTIFICAÇÕES (DROPDOWN) ============
const notificationBtn = document.getElementById('notificationBtn');
const notificationDropdown = document.getElementById('notificationDropdown');
const notificationList = document.getElementById('notificationList');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const notificationDot = document.querySelector('.notification-dot');

let notifications = [];

async function carregarNotificacoes() {
    try {
        const data = await Api.get('/api/notificacoes');
        if (data && data.notificacoes) {
            notifications = data.notificacoes;
            renderNotifications();
        }
    } catch (e) {
        console.error("Erro ao carregar notificações:", e);
    }
}

function renderNotifications() {
    if (!notificationList) return;
    notificationList.innerHTML = '';
    const unreadCount = notifications.filter(n => !n.read).length;
    if (notificationDot) {
        if (unreadCount > 0) notificationDot.classList.remove('hidden');
        else notificationDot.classList.add('hidden');
    }
    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="poppins-regular" style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhuma notificação no momento.</div>';
        return;
    }
    notifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = `notification-item ${notif.read ? '' : 'unread'} poppins-regular`;
        item.setAttribute('data-id', notif.id);
        item.innerHTML = `
            <div class="notification-icon">${notif.icon}</div>
            <div class="notification-content">
                <div class="notification-title poppins-semibold">${notif.title}</div>
                <div class="notification-desc">${notif.description}</div>
                <div class="notification-time">${notif.time}</div>
            </div>
            <button class="notification-delete-btn" aria-label="Excluir notificação">✕</button>
        `;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!e.target.closest('.notification-delete-btn')) markAsRead(notif.id);
        });
        const deleteBtn = item.querySelector('.notification-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNotification(notif.id);
        });
        notificationList.appendChild(item);
    });
}

function markAsRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) { 
        notif.read = true; 
        renderNotifications(); 
    }
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    renderNotifications();
}

function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    renderNotifications();
}

function toggleNotificationDropdown() {
    if (notificationDropdown.classList.contains('active')) {
        closeNotificationDropdown();
    } else {
        openNotificationDropdown();
    }
}

function openNotificationDropdown() {
    carregarNotificacoes();
    notificationDropdown.classList.add('active');
    notificationBtn.setAttribute('aria-expanded', 'true');
}

function closeNotificationDropdown() {
    notificationDropdown.classList.remove('active');
    notificationBtn.setAttribute('aria-expanded', 'false');
}

if (notificationBtn && notificationDropdown) {
    notificationBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleNotificationDropdown(); });
    document.addEventListener('click', (e) => {
        if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) closeNotificationDropdown();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && notificationDropdown.classList.contains('active')) closeNotificationDropdown();
    });
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', (e) => { e.stopPropagation(); markAllAsRead(); });
    }
    carregarNotificacoes();
}

// ============ DROPDOWN DAS TABS (TOPBAR) ============
const dropdownTabs = document.getElementById('dropdownTabs');
const dropdownToggle = document.getElementById('dropdownToggle');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownLabel = document.getElementById('dropdownLabel');
const dropdownItems = document.querySelectorAll('.dropdown-item');

function openDropdown() {
    if (dropdownMenu) dropdownMenu.classList.add('open');
}

function closeDropdown() {
    if (dropdownMenu) dropdownMenu.classList.remove('open');
}

if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.contains('open') ? closeDropdown() : openDropdown();
    });

    document.addEventListener('click', (e) => {
        if (dropdownTabs && !dropdownTabs.contains(e.target)) {
            closeDropdown();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdownMenu.classList.contains('open')) {
            closeDropdown();
        }
    });

    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownItems.forEach(i => {
                i.classList.remove('active', 'poppins-semibold');
                i.classList.add('poppins-medium');
            });
            this.classList.add('active', 'poppins-semibold');
            this.classList.remove('poppins-medium');

            if (dropdownLabel) {
                dropdownLabel.textContent = this.textContent.trim();
            }

            closeDropdown();
            window.location.href = this.getAttribute('href');
        });
    });
}

// ============ BARRA MOBILE BOTTOM ============
document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// Expor showToast globalmente
window.showToast = showToast;