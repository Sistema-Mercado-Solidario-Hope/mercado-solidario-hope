/**
 * Visão Geral Estoque - Funcionalidades específicas com dados dinâmicos
 */

import Api from './api.js?v=3';

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        initPagina();
    });

    async function initPagina() {
        // 1. Carregar dados reais do backend
        try {
            const data = await Api.get('/api/estoque/dashboard');
            if (data && !data.erro) {
                renderizarDashboard(data);
            } else {
                console.error("Erro ao carregar dados do dashboard:", data?.erro || "Desconhecido");
            }
        } catch (e) {
            console.error("Erro de conexão ao carregar dashboard:", e);
        }

        // 2. Configurar eventos dos filtros
        initFilterButtons();

        // 3. Efeitos de hover e scroll
        initHoverEffects();
        initSmoothScroll();
    }

    /**
     * Preenche a tela com os dados do dashboard recebidos do backend.
     */
    function renderizarDashboard(data) {
        // 1. Card Roxo - Produtos Cadastrados
        const cardRoxo = document.querySelector('.stat-card.purple');
        if (cardRoxo) {
            const h2 = cardRoxo.querySelector('h2');
            if (h2) h2.innerText = data.total_produtos;
        }

        // 2. Card Azul - Produtos com Baixa Quantidade
        const cardAzul = document.querySelector('.stat-card.blue');
        if (cardAzul) {
            const small = cardAzul.querySelector('small');
            if (small) small.innerText = 'Produtos com Baixa Quantidade';
            const h2 = cardAzul.querySelector('h2');
            if (h2) h2.innerText = data.total_baixo_estoque;
        }

        // 3. Card Marrom - Total Recebido
        const cardMarrom = document.querySelector('.stat-card.brown');
        if (cardMarrom) {
            const small = cardMarrom.querySelector('small');
            if (small) small.innerText = 'Total Recebido';
            const h2 = cardMarrom.querySelector('h2');
            if (h2) h2.innerText = `${data.total_recebido_kg.toLocaleString('pt-BR')} kg`;
        }

        // 4. Card Cinza - Itens Recebidos
        const cardCinza = document.querySelector('.stat-card.gray');
        if (cardCinza) {
            const small = cardCinza.querySelector('small');
            if (small) small.innerText = 'Itens Recebidos';
            const h2 = cardCinza.querySelector('h2');
            if (h2) h2.innerText = data.total_recebido_itens.toLocaleString('pt-BR');
        }

        // 5. Produtos com Maior Necessidade progress bars
        const goalsGrid = document.querySelector('.chart-panel .goals-grid');
        if (goalsGrid) {
            goalsGrid.innerHTML = '';
            if (data.produtos_maior_necessidade && data.produtos_maior_necessidade.length > 0) {
                data.produtos_maior_necessidade.forEach((prod) => {
                    const item = document.createElement('div');
                    let progressClass = '';
                    if (prod.percentual < 30) progressClass = 'red-progress';
                    else if (prod.percentual < 70) progressClass = 'brown-progress';
                    else progressClass = 'purple-progress';

                    const pctRounded = Math.round(prod.percentual);
                    const deficitLabel = prod.deficit > 0 ? `Faltam ${prod.deficit} unidades` : 'Meta Atingida';

                    item.innerHTML = `
                        <div class="goal-label">
                          <span>${prod.nome} (${prod.categoria})</span>
                          <strong>${pctRounded}% (${deficitLabel})</strong>
                        </div>
                        <div class="progress ${progressClass}"><span style="width: ${pctRounded}%"></span></div>
                    `;
                    goalsGrid.appendChild(item);
                });
            } else {
                goalsGrid.innerHTML = '<p class="poppins-regular" style="color:var(--text-muted); margin-top: 10px;">Nenhuma meta cadastrada ou ativa.</p>';
            }
        }

        // 6. Resumo por Categoria
        const categoriesGrid = document.querySelector('.goals-panel .goals-grid');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = '';
            if (data.resumo_categoria && data.resumo_categoria.length > 0) {
                data.resumo_categoria.forEach(cat => {
                    const item = document.createElement('div');
                    const pctRounded = Math.round(cat.percentual);
                    item.innerHTML = `
                        <div class="goal-label">
                            <span>${cat.nome}</span>
                            <strong>${pctRounded}%</strong>
                        </div>
                        <div class="progress"><span style="width: ${pctRounded}%"></span></div>
                    `;
                    categoriesGrid.appendChild(item);
                });
            } else {
                categoriesGrid.innerHTML = '<p class="poppins-regular" style="color:var(--text-muted); margin-top: 10px;">Nenhuma categoria ativa.</p>';
            }
        }

        // 7. Atividades Recentes
        const activitiesPanel = document.querySelector('.activities-panel');
        if (activitiesPanel) {
            const title = activitiesPanel.querySelector('h2');
            activitiesPanel.innerHTML = '';
            if (title) activitiesPanel.appendChild(title);

            if (data.atividades_recentes && data.atividades_recentes.length > 0) {
                data.atividades_recentes.forEach(act => {
                    const item = document.createElement('div');
                    item.className = 'activity';
                    let bgClass = 'blue-bg';
                    if (act.icon === '👥') bgClass = 'purple-bg';
                    else if (act.icon === '📦') bgClass = 'orange-bg';
                    else if (act.icon === '🔧') bgClass = 'blue-bg';
                    else if (act.icon === '📝') bgClass = 'purple-bg';

                    item.innerHTML = `
                      <span class="activity-icon ${bgClass}">${act.icon}</span>
                      <div>
                        <strong>${act.titulo}</strong>
                        <p>${act.descricao}</p>
                        <small>${act.tempo}</small>
                      </div>
                    `;
                    activitiesPanel.appendChild(item);
                });
            } else {
                const noAct = document.createElement('p');
                noAct.className = 'poppins-regular';
                noAct.style.color = 'var(--text-muted)';
                noAct.style.marginTop = '16px';
                noAct.innerText = 'Nenhuma atividade recente registrada.';
                activitiesPanel.appendChild(noAct);
            }
        }

        // 8. Low Stock alerts (Alerts grid)
        const alertsGrid = document.querySelector('.alerts-grid');
        if (alertsGrid) {
            alertsGrid.innerHTML = '';
            if (data.total_baixo_estoque > 0) {
                const alertCard = document.createElement('div');
                alertCard.className = 'alert-card danger';
                alertCard.innerHTML = `
                    <strong>Estoque Baixo</strong>
                    <p>Existem ${data.total_baixo_estoque} produtos abaixo da quantidade mínima cadastrada e precisam de reposição imediata.</p>
                `;
                alertsGrid.appendChild(alertCard);
            } else {
                const alertCard = document.createElement('div');
                alertCard.className = 'alert-card info';
                alertCard.innerHTML = `
                    <strong>Estoque Normal</strong>
                    <p>Todos os produtos estão com níveis saudáveis de estoque.</p>
                `;
                alertsGrid.appendChild(alertCard);
            }

            const infoCard = document.createElement('div');
            infoCard.className = 'alert-card info';
            infoCard.innerHTML = `
                <strong>Operação Normal</strong>
                <p>O fluxo de distribuição está funcionando perfeitamente. Registre saídas através do Frente de Caixa.</p>
            `;
            alertsGrid.appendChild(infoCard);
        }
    }

    function initFilterButtons() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                const originalText = this.innerText;
                this.innerText = 'Atualizando...';
                try {
                    const data = await Api.get('/api/estoque/dashboard');
                    if (data && !data.erro) {
                        renderizarDashboard(data);
                        if (typeof window.showToast === 'function') {
                            window.showToast('Dados atualizados com sucesso!', 'success');
                        }
                    }
                } catch (err) {
                    console.error("Erro ao atualizar dados:", err);
                }
                this.innerText = originalText;
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
})();