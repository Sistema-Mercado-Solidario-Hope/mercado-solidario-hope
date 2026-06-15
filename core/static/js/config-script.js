import Api from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    'use strict';

    // ============ REFERÊNCIAS DO DOM ============
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainContent = document.getElementById('mainContent');
    const toastContainer = document.getElementById('toastContainer');
    const tabButtons = document.querySelectorAll('.tab-item[data-scroll]');
    const sectionContato = document.getElementById('section-contato');
    const sectionDoacoes = document.getElementById('section-doacoes');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

    // Evento de fechar pelo X
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }

    // 1. BOTÃO FLUTUANTE (Voltar ao Topo)
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ============ MOBILE MENU TOGGLE ============
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        sidebarOverlay.setAttribute('aria-hidden', 'false');
    }

    // Close menu
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
        sidebarOverlay.setAttribute('aria-hidden', 'true');
    }

    mobileMenuBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay.addEventListener('click', closeSidebar);

    // Fechar sidebar ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // Fechar sidebar ao clicar em um link (mobile)
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                closeSidebar();
            }
        });
    });

    // ============ SCROLL SUAVE PARA SEÇÕES ============
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-scroll');
            const target = document.getElementById(targetId);

            // Atualizar estado ativo das tabs
            tabButtons.forEach(b => {
                b.classList.remove('active', 'poppins-semibold');
                b.classList.add('poppins-medium');
            });
            btn.classList.add('active', 'poppins-semibold');
            btn.classList.remove('poppins-medium');

            if (target) {
                const topbarHeight = document.querySelector('.topbar').offsetHeight;
                const offset = topbarHeight + 24;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============ ATUALIZAR TABS AO ROLAR ============
    function updateActiveTabOnScroll() {
        const scrollPos = window.scrollY + 150;
        const doacoesTop = sectionDoacoes.getBoundingClientRect().top + window.pageYOffset;

        if (scrollPos >= doacoesTop) {
            tabButtons.forEach(b => {
                b.classList.remove('active', 'poppins-semibold');
                b.classList.add('poppins-medium');
            });
            const doacoesTab = document.querySelector('.tab-item[data-scroll="section-doacoes"]');
            if (doacoesTab) {
                doacoesTab.classList.add('active', 'poppins-semibold');
                doacoesTab.classList.remove('poppins-medium');
            }
        } else {
            tabButtons.forEach(b => {
                b.classList.remove('active', 'poppins-semibold');
                b.classList.add('poppins-medium');
            });
            const contatoTab = document.querySelector('.tab-item[data-scroll="section-contato"]');
            if (contatoTab) {
                contatoTab.classList.add('active', 'poppins-semibold');
                contatoTab.classList.remove('poppins-medium');
            }
        }
    }

    window.addEventListener('scroll', updateActiveTabOnScroll, { passive: true });

    // ============ SISTEMA DE TOAST ============
    function showToast(message, type = 'success') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} poppins-medium`;
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };
        toast.innerHTML = `<span>${icons[type] || '✓'}</span> ${message}`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    // ============ GERENCIAMENTO DE CARDS ============
    const allCards = document.querySelectorAll('.config-card');

    function checkCardModified(card) {
        const inputs = card.querySelectorAll('.field-input, textarea.field-input');
        let modified = false;
        inputs.forEach(input => {
            const original = input.getAttribute('data-original') || '';
            const current = input.value || '';
            if (original !== current) {
                modified = true;
            }
        });
        return modified;
    }

    function updateCardState(card) {
        const saveBtn = card.querySelector('.btn-save-card');
        const statusBadge = card.querySelector('.card-status-badge');
        const isModified = checkCardModified(card);

        if (isModified) {
            card.classList.remove('saved');
            card.classList.add('unsaved');
            if (statusBadge) {
                statusBadge.textContent = '⚠ Não salvo';
                statusBadge.className = 'card-status-badge status-unsaved poppins-medium';
            }
            if (saveBtn) saveBtn.disabled = false;
            card.querySelectorAll('.field-input, textarea.field-input').forEach(input => {
                const original = input.getAttribute('data-original') || '';
                if (input.value !== original) {
                    input.classList.add('modified');
                } else {
                    input.classList.remove('modified');
                }
            });
        } else {
            card.classList.remove('unsaved');
            card.classList.add('saved');
            if (statusBadge) {
                statusBadge.textContent = '✓ Salvo';
                statusBadge.className = 'card-status-badge status-saved poppins-medium';
            }
            if (saveBtn) saveBtn.disabled = true;
            card.querySelectorAll('.field-input, textarea.field-input').forEach(input => {
                input.classList.remove('modified');
            });
        }
    }

    // ============ FUNÇÃO DE SALVAMENTO ============
    async function saveCard(cardId) {
        const card = document.querySelector(`.config-card[data-card-id="${cardId}"]`);
        if (!card) return;

        const saveBtn = card.querySelector('.btn-save-card');
        if (!saveBtn || saveBtn.disabled) return;

        card.classList.add('saving');
        saveBtn.classList.add('saving');
        saveBtn.disabled = true;

        const telWhatsapp = document.getElementById('tel-whatsapp').value.trim();
        const cnpj = document.getElementById('cnpj-input').value.trim();
        
        const logradouro = document.getElementById('logradouro').value.trim();
        const numero = document.getElementById('numero').value.trim();
        const bairro = document.getElementById('bairro').value.trim();
        const cep = document.getElementById('cep').value.trim();
        
        let endereco = logradouro;
        if (numero) endereco += `, ${numero}`;
        if (bairro) endereco += `, ${bairro}`;
        if (cep) endereco += `, ${cep}`;

        const pixKey = document.getElementById('pix-key-field').value.trim();
        
        const previewImg = document.getElementById('qrPreviewImg');
        const hasCustomImage = document.getElementById('qrFileInput').getAttribute('data-has-custom') === 'true';
        const qrCodeImage = hasCustomImage ? (previewImg ? previewImg.src : '') : '';

        const payload = {
            telefone_contato: telWhatsapp,
            cnpj: cnpj,
            endereco_instituicao: endereco,
            pix_key: pixKey,
            qr_code_image: qrCodeImage
        };

        try {
            const res = await Api.post('/api/configuracoes', payload);
            if (res && (res.status === 200 || !res.erro)) {
                // Update original values
                const inputs = card.querySelectorAll('.field-input, textarea.field-input');
                inputs.forEach(input => {
                    input.setAttribute('data-original', input.value || '');
                    input.classList.remove('modified');
                });

                card.classList.remove('saving');
                saveBtn.classList.remove('saving');
                saveBtn.disabled = true;

                updateCardState(card);
                const cardTitle = card.querySelector('.card-title')?.textContent || 'Configuração';
                showToast(`${cardTitle} salvo com sucesso!`, 'success');
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao salvar configurações.', 'error');
                card.classList.remove('saving');
                saveBtn.classList.remove('saving');
                saveBtn.disabled = false;
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar configurações.', 'error');
            card.classList.remove('saving');
            saveBtn.classList.remove('saving');
            saveBtn.disabled = false;
        }
    }

    // ============ MÁSCARA DE CNPJ ============
    const cnpjInput = document.getElementById('cnpj-input');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            value = value.substring(0, 14);
            if (value.length > 12) {
                value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
            } else if (value.length > 8) {
                value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
            } else if (value.length > 5) {
                value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
            }
            this.value = value;
            this.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    // ============ MÁSCARA DE CEP ============
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            value = value.substring(0, 8);
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d{0,3})/, '$1-$2');
            }
            this.value = value;
            this.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    // ============ MÁSCARA DE TELEFONE ============
    function applyPhoneMask(input, isCelular = true) {
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if (isCelular) {
                value = value.substring(0, 11);
                if (value.length > 10) {
                    value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
                } else if (value.length > 6) {
                    value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
                } else if (value.length > 2) {
                    value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
                } else if (value.length > 0) {
                    value = value.replace(/^(\d{0,2})/, '($1');
                }
            } else {
                value = value.substring(0, 10);
                if (value.length > 6) {
                    value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
                } else if (value.length > 2) {
                    value = value.replace(/^(\d{2})(\d{0,4})$/, '($1) $2');
                } else if (value.length > 0) {
                    value = value.replace(/^(\d{0,2})/, '($1');
                }
            }
            this.value = value;
            this.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    const telWhatsapp = document.getElementById('tel-whatsapp');
    if (telWhatsapp) applyPhoneMask(telWhatsapp, true);

    // ============ UPLOAD QR CODE (DRAG & DROP) ============
    const qrUploadArea = document.getElementById('qrUploadArea');
    const qrFileInput = document.getElementById('qrFileInput');
    const qrPreview = document.getElementById('qrPreview');
    const qrPreviewImg = document.getElementById('qrPreviewImg');
    const qrRemoveBtn = document.getElementById('qrRemoveBtn');
    const uploadIcon = document.getElementById('uploadIcon');
    const uploadText = document.getElementById('uploadText');

    function handleFileSelect(file) {
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Formato de imagem não suportado. Use PNG, JPG ou WEBP.', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('A imagem deve ter no máximo 2 MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            qrPreviewImg.src = e.target.result;
            qrPreview.style.display = 'block';
            uploadIcon.style.display = 'none';
            uploadText.textContent = 'Imagem carregada. Clique para trocar.';
            qrFileInput.setAttribute('data-has-custom', 'true');

            // Force modification visual state for the qrcode card
            const qrCard = document.querySelector('.config-card[data-card-id="qrcode"]');
            if (qrCard) {
                qrCard.classList.remove('saved');
                qrCard.classList.add('unsaved');
                const saveBtn = qrCard.querySelector('.btn-save-card');
                if (saveBtn) saveBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file);
    }

    qrUploadArea.addEventListener('click', (e) => {
        if (e.target === qrRemoveBtn) return;
        qrFileInput.click();
    });

    qrFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    });

    qrUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        qrUploadArea.classList.add('dragover');
    });

    qrUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        qrUploadArea.classList.remove('dragover');
    });

    qrUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        qrUploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    });

    qrRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        qrPreview.style.display = 'none';
        qrPreviewImg.src = '';
        uploadIcon.style.display = '';
        uploadText.textContent = 'Arraste o QR Code ou clique para fazer upload';
        qrFileInput.value = '';
        qrFileInput.setAttribute('data-has-custom', 'false');

        const qrCard = document.querySelector('.config-card[data-card-id="qrcode"]');
        if (qrCard) {
            // Force mod state
            qrCard.classList.remove('saved');
            qrCard.classList.add('unsaved');
            const saveBtn = qrCard.querySelector('.btn-save-card');
            if (saveBtn) saveBtn.disabled = false;
        }
    });

    // ============ CARREGAR DADOS DO BACKEND ============
    async function carregarConfiguracoes() {
        try {
            const data = await Api.get('/api/configuracoes');
            if (data && !data.erro) {
                document.getElementById('tel-whatsapp').value = data.telefone_contato || '';
                document.getElementById('cnpj-input').value = data.cnpj || '';

                const addr = data.endereco_instituicao || '';
                const parts = addr.split(',').map(p => p.trim());
                if (parts.length >= 4) {
                    document.getElementById('logradouro').value = parts[0];
                    document.getElementById('numero').value = parts[1];
                    document.getElementById('bairro').value = parts[2];
                    document.getElementById('cep').value = parts[3];
                } else {
                    document.getElementById('logradouro').value = addr;
                }

                document.getElementById('pix-key-field').value = data.pix_key || '';

                if (data.qr_code_image) {
                    document.getElementById('qrPreviewImg').src = data.qr_code_image;
                    document.getElementById('qrPreview').style.display = 'block';
                    document.getElementById('uploadIcon').style.display = 'none';
                    document.getElementById('uploadText').textContent = 'Imagem carregada. Clique para trocar.';
                    document.getElementById('qrFileInput').setAttribute('data-has-custom', 'true');
                }

                // Initial tracking state
                allCards.forEach(card => {
                    const inputs = card.querySelectorAll('.field-input, textarea.field-input');
                    inputs.forEach(input => {
                        input.setAttribute('data-original', input.value || '');
                        input.addEventListener('input', () => updateCardState(card));
                        input.addEventListener('change', () => updateCardState(card));
                    });
                    updateCardState(card);
                });
            }
        } catch (e) {
            showToast('Erro ao carregar configurações do servidor.', 'error');
        }
    }

    // Associate save buttons
    allCards.forEach(card => {
        const saveBtn = card.querySelector('.btn-save-card');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const cardId = card.getAttribute('data-card-id');
                if (cardId) {
                    saveCard(cardId);
                }
            });
        }
    });

    await carregarConfiguracoes();

    // ============ Ctrl+S shortcut ============
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const focusedElement = document.activeElement;
            if (focusedElement) {
                const card = focusedElement.closest('.config-card');
                if (card) {
                    const cardId = card.getAttribute('data-card-id');
                    const saveBtn = card.querySelector('.btn-save-card');
                    if (saveBtn && !saveBtn.disabled && cardId) {
                        saveCard(cardId);
                    }
                }
            }
        }
    });
});