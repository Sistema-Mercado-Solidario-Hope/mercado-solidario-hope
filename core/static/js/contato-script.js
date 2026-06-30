import { Api } from './api.js';

function formatarTelefoneExibicao(tel) {
    if (!tel) return '';
    let limpo = tel.replace(/\D/g, '');
    if (limpo.startsWith('55') && limpo.length >= 12) {
        let pais = limpo.substring(0, 2);
        let ddd = limpo.substring(2, 4);
        let resto = limpo.substring(4);
        if (resto.length === 9) {
            return `+${pais} (${ddd}) ${resto.substring(0, 5)}-${resto.substring(5)}`;
        } else {
            return `+${pais} (${ddd}) ${resto.substring(0, 4)}-${resto.substring(4)}`;
        }
    }
    if (limpo.length === 11) {
        return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 7)}-${limpo.substring(7)}`;
    }
    if (limpo.length === 10) {
        return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 6)}-${limpo.substring(6)}`;
    }
    return tel;
}

document.addEventListener('DOMContentLoaded', async function() {
    const modal = document.getElementById('pixModal');
    const openModalBtns = document.querySelectorAll('.btn-confirm-donation, .mobile-doar-btn');
    const closeModalBtn = document.getElementById('closeModal');
    const copyPixBtn = document.getElementById('copyPixBtn');
    const copyFeedback = document.getElementById('copyFeedback');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    // ----- CARREGAR DADOS DO BACKEND -----
    async function loadConfig() {
        try {
            const config = await Api.get('/api/configuracoes');
            if (config && !config.erro) {
                // Endereço
                const addrText = document.getElementById('address-text');
                if (addrText && config.endereco_instituicao) {
                    addrText.innerHTML = config.endereco_instituicao.replace(/\n/g, '<br>');
                }
                const mapLink = document.getElementById('address-map-link');
                if (mapLink && config.endereco_instituicao) {
                    mapLink.href = `https://maps.google.com/?q=${encodeURIComponent(config.endereco_instituicao)}`;
                }
                const mapNote = document.getElementById('map-note');
                if (mapNote && config.endereco_instituicao) {
                    mapNote.textContent = `${config.endereco_instituicao} (em frente à Praça da Esperança)`;
                }
                const colAddress = document.getElementById('collection-address-modal');
                if (colAddress && config.endereco_instituicao) {
                    colAddress.textContent = config.endereco_instituicao;
                }

                // Telefone
                const phoneText = document.getElementById('phone-text');
                if (phoneText && config.telefone_contato) {
                    const formatted = formatarTelefoneExibicao(config.telefone_contato);
                    phoneText.innerHTML = `${formatted}<br>${formatted} (WhatsApp)`;
                }

                // E-mail
                const emailText = document.getElementById('email-text');
                if (emailText && config.email_contato) {
                    const domain = config.email_contato.split('@')[1] || 'mercadosolidario.org.br';
                    emailText.innerHTML = `${config.email_contato}<br>financeiro@${domain}`;
                }

                // Redes Sociais
                const instaLink = document.getElementById('instagram-link');
                const instaHandle = document.getElementById('instagram-handle');
                if (instaLink && config.instagram_link) {
                    instaLink.href = config.instagram_link;
                    if (instaHandle) {
                        const parts = config.instagram_link.replace(/\/$/, '').split('/');
                        const handle = parts[parts.length - 1] || 'ondadurahope';
                        instaHandle.textContent = `@${handle}`;
                    }
                }

                // Chave PIX
                const pixKeyModal = document.getElementById('pixKeyModal');
                if (pixKeyModal && config.pix_key) {
                    pixKeyModal.textContent = config.pix_key;
                }

                // QR Code URL
                const qrUrl = config.qr_code_image || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(config.pix_key || 'financeiro@mercadosolidario.org.br')}&color=6900B8&bgcolor=FFFFFF`;
                const qrImg = document.getElementById('pix-qr-code');
                const qrImgModal = document.getElementById('pix-qr-code-modal');
                if (qrImg) qrImg.src = qrUrl;
                if (qrImgModal) qrImgModal.src = qrUrl;

                // CNPJ
                const cnpjVal = document.getElementById('cnpj-value');
                const cnpjValModal = document.getElementById('cnpj-value-modal');
                if (cnpjVal && config.cnpj) cnpjVal.textContent = config.cnpj;
                if (cnpjValModal && config.cnpj) cnpjValModal.textContent = config.cnpj;
            }
        } catch (e) {
            console.error('Erro ao carregar configurações de contato:', e);
        }
    }

    // Carregar configurações dinâmicas
    await loadConfig();

    // ----- ABRIR MODAL -----
    function openModal() {
        if (!modal) return;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        // Guarda a largura da barra de rolagem para evitar salto de layout
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = scrollbarWidth + 'px';
    }

    // ----- FECHAR MODAL -----
    function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
    }

    // Eventos para abrir
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    // Evento para fechar (botão X)
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Fechar ao clicar no overlay (fundo escuro)
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }

    // Fechar com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // ----- COPIAR CHAVE PIX -----
    if (copyPixBtn) {
        copyPixBtn.addEventListener('click', function() {
            const pixKeyEl = document.getElementById('pixKeyModal');
            const pixKey = pixKeyEl ? pixKeyEl.innerText : 'financeiro@mercadosolidario.org.br';
            navigator.clipboard.writeText(pixKey).then(() => {
                if (copyFeedback) {
                    copyFeedback.classList.add('show');
                    setTimeout(() => copyFeedback.classList.remove('show'), 2000);
                }
            }).catch(() => {
                alert('Não foi possível copiar a chave. Copie manualmente.');
            });
        });
    }

    // ----- BOTÃO VOLTAR AO TOPO -----
    window.addEventListener('scroll', function() {
        if (!scrollToTopBtn) return;
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});