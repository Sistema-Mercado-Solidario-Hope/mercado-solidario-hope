document.addEventListener('DOMContentLoaded', () => {
    
    // ==================== 1. FILTRO E BUSCA ====================
    const filterBtns = document.querySelectorAll('.pill');
    const productCards = document.querySelectorAll('.card');
    const searchInput = document.getElementById('searchInput');

    // Filtro por categoria
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterValue = btn.getAttribute('data-filter');
            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'todos' || (cardCategory && cardCategory.includes(filterValue))) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Busca por texto
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase();
            productCards.forEach(card => {
                const title = card.querySelector('.item-title')?.textContent.toLowerCase() || '';
                card.style.display = title.includes(searchText) ? 'flex' : 'none';
            });
            // Resetar filtro para "Todos"
            filterBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-filter="todos"]')?.classList.add('active');
        });
    }

    // ==================== 2. BOTÃO VOLTAR AO TOPO ====================
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==================== 3. ATIVAÇÃO DE TABS ====================
    const topbarTabs = document.querySelectorAll('.tab-item');
    topbarTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const href = tab.getAttribute('href');
            if (!href || href === '#') e.preventDefault();
            topbarTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // ==================== 4. MODAL PIX (COM SCROLL CORRETO) ====================
    const modal = document.getElementById('pixModal');
    const openModalBtns = document.querySelectorAll('.btn-confirm-donation, #mobileDoarBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const copyPixBtn = document.getElementById('copyPixBtn');
    const copyFeedback = document.getElementById('copyFeedback');
    const pixKeySpan = document.getElementById('pixKeyModal');

    // Função para travar o scroll da página e abrir modal
    function openModal() {
        if (!modal) return;

        // Calcula a largura da barra de rolagem para evitar salto de layout
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = scrollbarWidth + 'px';
        
        // Adiciona classe que trava o scroll (usando CSS)
        document.body.classList.add('modal-open');
        
        // Abre modal
        modal.classList.add('active');
        
        // Destaque visual para o botão Doar mobile (se existir)
        const mobileDoar = document.getElementById('mobileDoarBtn');
        if (mobileDoar) mobileDoar.classList.add('doar-active');
    }

    function closeModal() {
        if (!modal) return;
        
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = ''; // remove compensação
        
        // Esconde feedback de cópia se estiver visível
        if (copyFeedback) copyFeedback.classList.remove('show');
        
        const mobileDoar = document.getElementById('mobileDoarBtn');
        if (mobileDoar) mobileDoar.classList.remove('doar-active');
    }

    // Abrir modal pelos botões
    openModalBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', openModal);
    });

    // Fechar pelo botão X
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    // Fechar ao clicar no overlay (fundo escuro)
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Fechar com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeModal();
        }
    });

    // Copiar chave PIX
    if (copyPixBtn && pixKeySpan) {
        copyPixBtn.addEventListener('click', async () => {
            const chave = pixKeySpan.textContent.trim();
            try {
                await navigator.clipboard.writeText(chave);
                if (copyFeedback) copyFeedback.classList.add('show');
                setTimeout(() => copyFeedback?.classList.remove('show'), 2500);
            } catch (err) {
                // Fallback para navegadores antigos
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
});