/**
 * Visão Geral Estoque - Funcionalidades específicas
 */

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        initPagina();
    });

    function initPagina() {
        // 1. Aplicar as alterações solicitadas
        aplicarAlteracoesDashboard();

        // 2. Preencher notificações de exemplo
        populateNotifications();

        // 3. Configurar eventos dos filtros
        initFilterButtons();

        // 4. Efeitos de hover e scroll
        initHoverEffects();
        initSmoothScroll();
    }

    /**
     * Aplica as modificações pedidas:
     * - Card azul: "Produtos com Baixa Quantidade"
     * - Card marrom: "Total Recebido" com valor "482 kg"
     * - Card cinza: "Itens Recebidos" com valor "1.284"
     */
    function aplicarAlteracoesDashboard() {
        // 1. Card azul (segundo card da stats-grid)
        const cardAzul = document.querySelector('.stat-card.blue');
        if (cardAzul) {
            const smallAzul = cardAzul.querySelector('small');
            if (smallAzul) smallAzul.innerText = 'Produtos com Baixa Quantidade';
            // Mantém o valor 14 (pode ser alterado se desejar)
            // const h2Azul = cardAzul.querySelector('h2');
            // if (h2Azul) h2Azul.innerText = '14';
        }

        // 2. Card marrom (terceiro card)
        const cardMarrom = document.querySelector('.stat-card.brown');
        if (cardMarrom) {
            const smallMarrom = cardMarrom.querySelector('small');
            if (smallMarrom) smallMarrom.innerText = 'Total Recebido';
            const h2Marrom = cardMarrom.querySelector('h2');
            if (h2Marrom) h2Marrom.innerText = '482 kg';
        }

        // 3. Card cinza (quarto card)
        const cardCinza = document.querySelector('.stat-card.gray');
        if (cardCinza) {
            const smallCinza = cardCinza.querySelector('small');
            if (smallCinza) smallCinza.innerText = 'Itens Recebidos';
            const h2Cinza = cardCinza.querySelector('h2');
            if (h2Cinza) h2Cinza.innerText = '1.284';
        }

        // Opcional: ajustar o card roxo permanece "Produtos Cadastrados"
    }

    /**
     * Preenche a lista de notificações com dados simulados.
     */
    function populateNotifications() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;
        if (notificationList.children.length > 0 && !notificationList.innerHTML.includes('item-placeholder')) {
            return;
        }

        const sampleNotifications = [
            {
                title: 'Estoque baixo',
                desc: 'Arroz atingiu o estoque mínimo. Reposição necessária.',
                time: 'Há 10 minutos',
                unread: true,
                icon: '⚠️'
            },
            {
                title: 'Entrada registrada',
                desc: '50 kg de Feijão foram adicionados ao estoque.',
                time: 'Há 1 hora',
                unread: true,
                icon: '📦'
            },
            {
                title: 'Alta demanda',
                desc: 'Leite integral está entre os itens mais pedidos pelas famílias.',
                time: 'Há 3 horas',
                unread: false,
                icon: '📈'
            },
            {
                title: 'Novo cadastro',
                desc: 'Família Oliveira foi cadastrada no sistema.',
                time: 'Ontem',
                unread: false,
                icon: '👥'
            }
        ];

        notificationList.innerHTML = '';
        sampleNotifications.forEach(notif => {
            const item = document.createElement('div');
            item.className = `notification-item ${notif.unread ? 'unread' : ''}`;
            item.innerHTML = `
                <div class="notification-icon">${notif.icon}</div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-desc">${notif.desc}</div>
                    <div class="notification-time">${notif.time}</div>
                </div>
                <button class="notification-delete-btn" aria-label="Excluir notificação">×</button>
            `;
            const deleteBtn = item.querySelector('.notification-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.remove();
                    updateNotificationDot();
                });
            }
            notificationList.appendChild(item);
        });

        updateNotificationDot();
    }

    function updateNotificationDot() {
        const dot = document.querySelector('.notification-dot');
        if (!dot) return;
        const unreadItems = document.querySelectorAll('.notification-item.unread');
        dot.classList.toggle('hidden', unreadItems.length === 0);
    }

    function initFilterButtons() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const originalText = this.innerText;
                this.innerText = 'Atualizando...';
                setTimeout(() => {
                    this.innerText = originalText;
                    if (typeof window.showToast === 'function') {
                        window.showToast('Dados atualizados com sucesso!', 'success');
                    } else {
                        alert('Simulação: dados atualizados');
                    }
                }, 800);
            });
        });
    }

    function initHoverEffects() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.2s ease';
            });
        });

        const exitLinks = document.querySelectorAll('.text-exit');
        exitLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!confirm('Deseja realmente sair do sistema?')) {
                    e.preventDefault();
                }
            });
        });
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    window.visao-geral-estoqueHelpers = { updateNotificationDot };
})();