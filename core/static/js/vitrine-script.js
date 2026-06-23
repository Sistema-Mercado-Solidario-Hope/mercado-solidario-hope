import Api from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    const productsGrid = document.getElementById('productsGrid');
    const filterBtns = document.querySelectorAll('.pill');
    const searchInput = document.getElementById('searchInput');

    let allProducts = [];

    // ==================== 1. CARREGAR E RENDERIZAR PRODUTOS ====================
    async function carregarVitrine() {
        try {
            const data = await Api.get('/api/estoque/produtos');
            if (data && data.produtos) {
                // Filtra apenas produtos com meta > 0
                allProducts = data.produtos.filter(p => p.meta > 0 || (p.estoque_maximo && p.meta > 0)); // p.meta ou p.meta_arrecadacao
                // Para retrocompatibilidade se a API não retornar meta na simulação fallback
                allProducts = data.produtos.map(p => ({
                    id: p.id,
                    nome: p.nome || p.name,
                    categoria: p.categoria || p.category,
                    unidade: p.unidade || p.unidade_medida,
                    quantidade: p.quantidade || p.estoque_atual || 0,
                    meta: p.meta || 0,
                    foto: p.foto || p.imagem_url || ''
                })).filter(p => p.meta > 0);

                renderizarVitrine();
            }
        } catch (e) {
            console.error("Erro ao buscar produtos para vitrine:", e);
            productsGrid.innerHTML = '<p class="poppins-regular" style="text-align:center; padding:32px; color:var(--text-muted); grid-column: 1/-1;">Erro de conexão ao buscar produtos.</p>';
        }
    }

    function renderizarVitrine() {
        if (!productsGrid) return;
        productsGrid.innerHTML = '';

        if (allProducts.length === 0) {
            productsGrid.innerHTML = '<p class="poppins-regular" style="text-align:center; padding:32px; color:var(--text-muted); grid-column: 1/-1;">Nenhuma necessidade cadastrada no momento.</p>';
            return;
        }

        allProducts.forEach(p => {
            const achievedPct = Math.min(100, (p.quantidade / p.meta) * 100);
            const deficit = Math.max(0, p.meta - p.quantidade);

            // Mapeamento de categorias para classes do filtro
            let dataCats = [];
            const catLower = p.categoria.toLowerCase();
            const nameLower = p.nome.toLowerCase();

            if (catLower.includes('cereal') || catLower.includes('legum') || catLower.includes('prote') || catLower.includes('alimento')) {
                dataCats.push('alimentos');
            }
            if (catLower.includes('higien')) {
                dataCats.push('higiene');
            }
            if (catLower.includes('limpez')) {
                dataCats.push('limpeza');
            }
            if (catLower.includes('infantil') || nameLower.includes('infantil') || nameLower.includes('bebê') || nameLower.includes('bebe') || nameLower.includes('fralda')) {
                dataCats.push('infantil');
            }
            if (dataCats.length === 0) {
                dataCats.push('outros');
            }
            const categoryAttr = dataCats.join(' ');

            const card = document.createElement('div');
            
            // Meta Atingida
            if (deficit <= 0) {
                card.className = 'card';
                card.setAttribute('data-category', categoryAttr);
                card.innerHTML = `
                    <div class="card-image-wrapper overlay-dark">
                        <span class="badge-centered poppins-bold">META ATINGIDA</span>
                        <img src="${p.foto || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}" alt="${p.nome}">
                    </div>
                    <div class="card-content">
                        <h3 class="poppins-semibold item-title">${p.nome}</h3>
                        <div class="progress-info">
                            <span class="poppins-bold text-gold">100% Concluído</span>
                            <svg class="garfo-colher-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M6 2v20M6 2l-4 4M6 2l4 4M18 2v20M18 2l-4 4M18 2l4 4"/>
                                <line x1="2" y1="16" x2="22" y2="16"/>
                            </svg>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar fill-gold" style="width: 100%;"></div>
                        </div>
                    </div>
                `;
            } else if (achievedPct < 30) {
                // Crítico
                card.className = 'card card-border-red';
                card.setAttribute('data-category', categoryAttr);
                card.innerHTML = `
                    <div class="card-image-wrapper">
                        <span class="badge badge-red poppins-semibold">Crítico</span>
                        <img src="${p.foto || 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80'}" alt="${p.nome}">
                    </div>
                    <div class="card-content">
                        <h3 class="poppins-semibold item-title">${p.nome}</h3>
                        <div class="progress-info">
                            <span class="poppins-medium text-red">Progresso: ${Math.round(achievedPct)}%</span>
                            <span class="poppins-bold text-purple-primary">Faltam ${deficit} ${p.unidade}</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar fill-red" style="width: ${achievedPct}%;"></div>
                        </div>
                    </div>
                `;
            } else {
                // Urgente/Normal
                card.className = 'card card-border-blue';
                card.setAttribute('data-category', categoryAttr);
                card.innerHTML = `
                    <div class="card-image-wrapper">
                        <span class="badge badge-blue poppins-semibold">Urgente</span>
                        <img src="${p.foto || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'}" alt="${p.nome}">
                    </div>
                    <div class="card-content">
                        <h3 class="poppins-semibold item-title">${p.nome}</h3>
                        <div class="progress-info">
                            <span class="poppins-medium text-muted">Progresso: ${Math.round(achievedPct)}%</span>
                            <span class="poppins-bold text-purple-primary">Faltam ${deficit} ${p.unidade}</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar fill-blue" style="width: ${achievedPct}%;"></div>
                        </div>
                    </div>
                `;
            }

            productsGrid.appendChild(card);
        });

        filterAndSearchProducts();
    }

    // ==================== 2. FILTRO E BUSCA ====================
    function filterAndSearchProducts() {
        const activeFilterBtn = document.querySelector('.pill.active');
        const filterValue = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'todos';
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const cards = document.querySelectorAll('#productsGrid .card');
        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const title = card.querySelector('.item-title')?.textContent.toLowerCase() || '';

            const matchFilter = filterValue === 'todos' || (cardCategory && cardCategory.includes(filterValue));
            const matchSearch = !searchText || title.includes(searchText);

            if (matchFilter && matchSearch) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Filtro por categoria
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterAndSearchProducts();
        });
    });

    // Busca por texto
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterAndSearchProducts();
        });
    }

    // ==================== 3. BOTÃO VOLTAR AO TOPO ====================
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==================== 4. MODAL PIX ====================
    const modal = document.getElementById('pixModal');
    const openModalBtns = document.querySelectorAll('.btn-confirm-donation, #mobileDoarBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const copyPixBtn = document.getElementById('copyPixBtn');
    const copyFeedback = document.getElementById('copyFeedback');
    const pixKeySpan = document.getElementById('pixKeyModal');

    function openModal() {
        if (!modal) return;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = scrollbarWidth + 'px';
        document.body.classList.add('modal-open');
        modal.classList.add('active');
        const mobileDoar = document.getElementById('mobileDoarBtn');
        if (mobileDoar) mobileDoar.classList.add('doar-active');
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        if (copyFeedback) copyFeedback.classList.remove('show');
        const mobileDoar = document.getElementById('mobileDoarBtn');
        if (mobileDoar) mobileDoar.classList.remove('doar-active');
    }

    openModalBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', openModal);
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeModal();
        }
    });

    if (copyPixBtn && pixKeySpan) {
        copyPixBtn.addEventListener('click', async () => {
            const chave = pixKeySpan.textContent.trim();
            try {
                await navigator.clipboard.writeText(chave);
                if (copyFeedback) copyFeedback.classList.add('show');
                setTimeout(() => copyFeedback?.classList.remove('show'), 2500);
            } catch (err) {
                const textarea = document.createElement('textarea');
                textarea.value = chave;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                if (copyFeedback) copyFeedback.classList.add('show');
                setTimeout(() => copyFeedback?.classList.remove('show'), 2500);
            }
        });
    }

    // Inicialização
    await carregarVitrine();
});