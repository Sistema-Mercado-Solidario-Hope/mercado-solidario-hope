document.addEventListener('DOMContentLoaded', () => {
    // ==================== BOTÃO VOLTAR AO TOPO ====================
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==================== ATIVAÇÃO DE TABS ====================
    const topbarTabs = document.querySelectorAll('.tab-item');
    topbarTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const href = tab.getAttribute('href');
            if (!href || href === '#') e.preventDefault();
            topbarTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // ==================== MODAL PIX (com scroll travado e interno) ====================
    const modal = document.getElementById('pixModal');
    const openModalBtns = document.querySelectorAll('.btn-confirm-donation, #mobileDoarBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const copyPixBtn = document.getElementById('copyPixBtn');
    const copyFeedback = document.getElementById('copyFeedback');
    const pixKeySpan = document.getElementById('pixKeyModal');

    function openModal() {
        if (!modal) return;
        // Calcula a largura da barra de rolagem para evitar salto de layout
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