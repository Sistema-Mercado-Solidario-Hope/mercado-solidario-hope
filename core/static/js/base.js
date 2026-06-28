import Api from './api.js';

// ============ REFERÊNCIAS DO DOM ============
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const toastContainer = document.getElementById('toastContainer');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

// ============ MENU LATERAL MOBILE ============

function openSidebar() {
    if (!sidebar || !sidebarOverlay) return;

    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");

    sidebarOverlay.setAttribute("aria-hidden", "false");
    mobileMenuBtn?.setAttribute("aria-expanded", "true");

    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    if (!sidebar || !sidebarOverlay) return;

    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");

    sidebarOverlay.setAttribute("aria-hidden", "true");
    mobileMenuBtn?.setAttribute("aria-expanded", "false");

    document.body.style.overflow = "";
}

function toggleSidebar(event) {
    event?.preventDefault();
    event?.stopImmediatePropagation();

    if (sidebar?.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

if (mobileMenuBtn && !mobileMenuBtn.dataset.menuBound) {
    mobileMenuBtn.dataset.menuBound = "true";
    mobileMenuBtn.addEventListener("click", toggleSidebar, true);
}

if (sidebarCloseBtn && !sidebarCloseBtn.dataset.menuBound) {
    sidebarCloseBtn.dataset.menuBound = "true";

    sidebarCloseBtn.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeSidebar();
        },
        true
    );
}

if (sidebarOverlay && !sidebarOverlay.dataset.menuBound) {
    sidebarOverlay.dataset.menuBound = "true";
    sidebarOverlay.addEventListener("click", closeSidebar, true);
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeSidebar();
    }
});

window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
        closeSidebar();
    }
});

if (sidebar) {
    sidebar.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            if (window.innerWidth <= 900) {
                closeSidebar();
            }
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
document.querySelectorAll(".mobile-nav-item").forEach(function (item) {
    item.addEventListener("click", function () {
        document.querySelectorAll(".mobile-nav-item").forEach(function (navItem) {
            navItem.classList.remove("active");
        });

        this.classList.add("active");

        // Sem preventDefault:
        // o navegador segue normalmente o href.
    });
});

// ============ SIDEBAR DROPDOWNS & ACTIVE LINK DETECTION ============
function initSidebarDropdowns() {
    const triggers = document.querySelectorAll('.dropdown-trigger');
    
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const containerId = trigger.getAttribute('aria-controls');
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            
            trigger.setAttribute('aria-expanded', !isExpanded);
            if (!isExpanded) {
                container.classList.add('open');
                container.style.maxHeight = container.scrollHeight + 'px';
            } else {
                container.classList.remove('open');
                container.style.maxHeight = '0px';
            }
        });
    });

    // Detect current path and mark active / expand parent
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a, .sidebar-footer a');
    
    const getFilename = (pathStr) => {
        if (!pathStr) return '';
        const lastSlash = pathStr.lastIndexOf('/');
        let name = lastSlash !== -1 ? pathStr.substring(lastSlash + 1) : pathStr;
        return name.split('?')[0];
    };
    
    const pathFile = getFilename(currentPath);

    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const hrefFile = getFilename(href);
        const isMatch = pathFile === hrefFile || (pathFile === '' && hrefFile === 'admin.html');
                        
        if (isMatch) {
            link.classList.add('active');
            
            // If the active item is inside a dropdown container, expand it
            const container = link.closest('.dropdown-container');
            if (container) {
                container.classList.add('open');
                container.style.maxHeight = container.scrollHeight + 'px';
                
                const triggerId = container.getAttribute('id');
                const trigger = document.querySelector(`[aria-controls="${triggerId}"]`);
                if (trigger) {
                    trigger.setAttribute('aria-expanded', 'true');
                }
            } else {
                // If it's a direct li child, add active to parent li
                const parentLi = link.closest('li');
                if (parentLi && !parentLi.classList.contains('sidebar-dropdown')) {
                    parentLi.classList.add('active');
                }
            }
        }
    });

    // Highlight mobile bottom nav items similarly
    const mobileBottomLinks = document.querySelectorAll('.mobile-bottom-nav a');
    mobileBottomLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const hrefFile = getFilename(href);
        const isMatch = pathFile === hrefFile || (pathFile === '' && hrefFile === 'admin.html');
                        
        if (isMatch) {
            link.classList.add('active');
        }
    });
}

// Call on load
initSidebarDropdowns();

// Expor showToast e initSidebarDropdowns globalmente
window.showToast = showToast;
window.initSidebarDropdowns = initSidebarDropdowns;