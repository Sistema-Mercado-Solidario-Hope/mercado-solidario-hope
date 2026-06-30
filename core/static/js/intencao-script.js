import Api from './api.js?v=3';

document.addEventListener('DOMContentLoaded', async () => {

    // ==================== LISTA DE ITENS (SIMULAÇÃO DO BACKEND) ====================
    let itensDisponiveis = [];

    function getIconePorCategoria(cat) {
        const icons = {
            'Cereais': '🍚',
            'Leguminosas': '🫘',
            'Higiene': '🧼',
            'Proteínas': '🥛',
            'Limpeza': '🧴',
            'Cesta Básica': '🧺'
        };
        return icons[cat] || '📦';
    }

    async function carregarCatalogo() {
        try {
            const data = await Api.get('/api/estoque/produtos');
            if (data && data.produtos) {
                itensDisponiveis = data.produtos.map(p => ({
                    id: p.id,
                    nome: p.nome,
                    unidade: p.unidade,
                    categoria: p.categoria,
                    icone: getIconePorCategoria(p.categoria),
                    quantidade: p.quantidade,
                    meta: p.meta || 0,
                    quantidadeDoadora: 0
                }));
                renderizarItens();
            }
        } catch (e) {
            console.error('Erro ao carregar catálogo:', e);
        }
    }

    const listaItensContainer = document.getElementById('listaItens');
    const formIntencao = document.getElementById('formIntencao');

    // Referências LGPD
    const lgpdCheckbox = document.getElementById('lgpdConsent');
    const lgpdSection = document.querySelector('.lgpd-section');

    // ==================== MÁSCARA DE TELEFONE ====================
    /**
     * Aplica a máscara (99) 99999-9999 mantendo a posição do cursor.
     * @param {HTMLInputElement} input - Campo de telefone.
     */
    function aplicarMascaraTelefone(input) {
        const valorAnterior = input.value;
        const cursorPosAnterior = input.selectionStart;

        // Remove tudo que não for dígito e limita a 11 caracteres
        let digitos = valorAnterior.replace(/\D/g, '');
        if (digitos.length > 11) digitos = digitos.slice(0, 11);

        // Monta a máscara conforme a quantidade de dígitos
        let valorFormatado = '';
        if (digitos.length > 0) {
            valorFormatado = '(' + digitos.substring(0, 2);
        }
        if (digitos.length > 2) {
            valorFormatado += ') ' + digitos.substring(2, 7);
        }
        if (digitos.length > 7) {
            valorFormatado += '-' + digitos.substring(7, 11);
        }

        // Atualiza o valor do campo
        input.value = valorFormatado;

        // Reposiciona o cursor baseado na quantidade de dígitos antes da posição anterior
        if (cursorPosAnterior !== null) {
            // Quantos dígitos existiam antes da posição do cursor no valor antigo
            const digitosAntesCursor = valorAnterior
                .slice(0, cursorPosAnterior)
                .replace(/\D/g, '').length;

            // Percorre o novo valor e conta os dígitos até encontrar a posição correspondente
            let novaPosicao = valorFormatado.length;
            let digitosPercorridos = 0;
            for (let i = 0; i < valorFormatado.length; i++) {
                if (/\d/.test(valorFormatado[i])) {
                    digitosPercorridos++;
                }
                // Quando atinge ou passa a quantidade de dígitos que estavam antes do cursor,
                // posiciona logo após o caractere atual (ou no final)
                if (digitosPercorridos >= digitosAntesCursor) {
                    novaPosicao = i + 1;
                    break;
                }
            }
            input.setSelectionRange(novaPosicao, novaPosicao);
        }
    }

    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        // Aplica a máscara enquanto digita
        telefoneInput.addEventListener('input', function () {
            aplicarMascaraTelefone(this);
        });

        // Garante que a máscara funcione ao colar (Ctrl+V)
        telefoneInput.addEventListener('paste', function () {
            setTimeout(() => aplicarMascaraTelefone(this), 0);
        });
    }

    // ==================== RENDERIZAÇÃO DOS ITENS ====================
    function renderizarItens(termo = '') {
        listaItensContainer.innerHTML = '';

        const filtrados = itensDisponiveis.filter(item => {
            return item.nome.toLowerCase().includes(termo) ||
                   item.categoria.toLowerCase().includes(termo);
        });

        if (filtrados.length === 0) {
            listaItensContainer.innerHTML = '<p class="poppins-regular" style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted);">Nenhum produto encontrado com este nome.</p>';
            return;
        }

        filtrados.forEach(item => {
            const card = criarItemCard(item);
            listaItensContainer.appendChild(card);
        });
    }

    function criarItemCard(item) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'item-card';
        cardDiv.dataset.itemId = item.id;

        const achievedPct = item.meta > 0 ? Math.min(100, Math.round((item.quantidade / item.meta) * 100)) : 0;
        let metaBadge = '';
        if (item.meta > 0) {
            if (achievedPct >= 100) {
                metaBadge = `<span class="meta-badge-meta-atingida" style="font-size: 12px; background: #DEF7EC; color: #03543F; padding: 4px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; margin-left: auto;">100% da meta de arrecadação</span>`;
            } else {
                metaBadge = `<span class="meta-badge-deficit" style="font-size: 12px; background: #FDE8E8; color: #9B1C1C; padding: 4px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; margin-left: auto;">${achievedPct}% da meta de arrecadação</span>`;
            }
        }

        cardDiv.innerHTML = `
            <div class="item-info">
                <div class="item-icon">${item.icone}</div>
                <div class="item-details">
                    <span class="item-nome poppins-semibold">${item.nome}</span>
                    <span class="item-categoria poppins-regular">${item.categoria}</span>
                </div>
                ${metaBadge}
            </div>
            <div class="item-quantidade">
                <label for="qtd-${item.id}" class="poppins-medium">Qtd (${item.unidade || 'un'}):</label>
                <input type="number" id="qtd-${item.id}" name="qtd-${item.id}" min="0" value="${item.quantidadeDoadora || 0}" class="poppins-regular" placeholder="0">
            </div>
        `;

        const input = cardDiv.querySelector('input');
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            item.quantidadeDoadora = val >= 0 ? val : 0;
        });

        return cardDiv;
    }



    // ==================== VALIDAÇÃO LGPD ====================
    function limparErroLgpd() {
        if (lgpdSection) {
            lgpdSection.classList.remove('lgpd-error-state');
        }
    }

    function mostrarErroLgpd() {
        if (lgpdSection) {
            lgpdSection.classList.remove('lgpd-error-state');
            void lgpdSection.offsetWidth;
            lgpdSection.classList.add('lgpd-error-state');
            if (lgpdCheckbox) {
                lgpdCheckbox.focus();
            }
        }
    }

    if (lgpdCheckbox) {
        lgpdCheckbox.addEventListener('change', () => {
            if (lgpdCheckbox.checked) {
                limparErroLgpd();
            }
        });
    }

    // ==================== MODAL DE SUCESSO ====================
    function criarModalSucesso() {
        const existente = document.querySelector('.modal-sucesso-overlay');
        if (existente) existente.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-sucesso-overlay';
        overlay.innerHTML = `
            <div class="modal-sucesso-card">
                <div class="sucesso-icon-circle">
                    <img src="/img/sacola.png" alt="Ícone de doação" class="sucesso-icon">
                </div>
                <h3 class="poppins-bold sucesso-titulo">Doação Registrada!</h3>
                <p class="poppins-regular sucesso-mensagem"></p>
                <div class="sucesso-codigo-wrapper">
                    <span class="poppins-medium sucesso-codigo-label">Código da intenção (salve-o):</span>
                    <span class="poppins-bold sucesso-codigo-valor" id="codigoIntencao"></span>
                </div>
                <p class="poppins-medium sucesso-detalhe"></p>
                <button class="btn-fechar-sucesso poppins-semibold" id="btnFecharSucesso">
                    <span>✓</span> Entendi
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    }

    function mostrarModalSucesso(nomeDoador, totalItens, codigo) {
        const overlay = criarModalSucesso();
        
        const mensagem = overlay.querySelector('.sucesso-mensagem');
        mensagem.textContent = `Obrigado, ${nomeDoador}! Sua intenção de doação com ${totalItens} item(ns) foi registrada.`;

        overlay.querySelector('#codigoIntencao').textContent = codigo;

        const detalhe = overlay.querySelector('.sucesso-detalhe');
        detalhe.innerHTML = `
            Agora é só separar os itens e entregá-los diretamente no
            <strong>Mercado Hope</strong>, no endereço:<br>
            <span style="display: inline-block; margin-top: 8px; background: #F6EAF9; padding: 8px 16px; border-radius: 8px;">
                Rua Aubé, 895 – Bairro Boa Vista – Joinville – SC
            </span>
        `;

        const btnFechar = overlay.querySelector('#btnFecharSucesso');
        const fecharModal = () => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = 'vitrine-necessidade.html';
            }, 300);
        };

        btnFechar.addEventListener('click', fecharModal);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                fecharModal();
            }
        });
    }

    // ==================== MODAL DE AVISO ====================
    function mostrarAviso(mensagem) {
        const existente = document.querySelector('.modal-aviso-overlay');
        if (existente) existente.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-aviso-overlay';
        overlay.innerHTML = `
            <div class="modal-aviso-card">
                <div class="aviso-icon-circle">
                    <span class="aviso-icon">!</span>
                </div>
                <p class="poppins-medium aviso-mensagem">${mensagem}</p>
                <button class="btn-ok-aviso poppins-semibold" id="btnOkAviso">OK</button>
            </div>
        `;

        document.body.appendChild(overlay);

        const fecharAviso = () => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.remove();
            }, 250);
        };

        overlay.querySelector('#btnOkAviso').addEventListener('click', fecharAviso);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) fecharAviso();
        });
    }

    function gerarCodigoIntencao() {
        const ano = new Date().getFullYear();
        const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `#DOA-${ano}-${randomPart}`;
    }

    // ==================== SUBMISSÃO DO FORMULÁRIO ====================
    formIntencao.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nomeCompleto').value.trim();
        // O telefone já vem formatado, mas podemos remover a máscara para enviar apenas números
        const telefoneComMascara = document.getElementById('telefone').value.trim();
        const telefone = telefoneComMascara.replace(/\D/g, ''); // apenas dígitos

        if (!nome || !telefone) {
            mostrarAviso('Por favor, preencha seu nome completo e telefone para contato.');
            return;
        }

        if (!lgpdCheckbox || !lgpdCheckbox.checked) {
            mostrarErroLgpd();
            if (lgpdSection) {
                lgpdSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        limparErroLgpd();

        const doacao = {
            doador: { nome, telefone },
            itens: [],
            lgpdConsent: true
        };

        itensDisponiveis.forEach(item => {
            const quantidade = item.quantidadeDoadora || 0;
            if (quantidade > 0) {
                doacao.itens.push({
                    id: item.id,
                    nome: item.nome,
                    quantidade
                });
            }
        });

        if (doacao.itens.length === 0) {
            mostrarAviso('Adicione pelo menos um item com quantidade maior que zero.');
            return;
        }

        console.log('📦 Intenção de doação pronta para envio ao backend:', doacao);

        try {
            const res = await Api.post('/api/intencao-doacao', {
                status: 'pendente',
                doador: doacao.doador,
                itens: doacao.itens
            });
            if (res && (res.status === 201 || !res.erro)) {
                const trackingCode = res.data?.codigo_rastreamento || gerarCodigoIntencao();
                mostrarModalSucesso(nome.split(' ')[0], doacao.itens.length, trackingCode);

                formIntencao.reset();
                itensDisponiveis.forEach(item => {
                    item.quantidadeDoadora = 0;
                });
                renderizarItens();
                const searchInp = document.getElementById('searchInput');
                if (searchInp) searchInp.value = '';
                limparErroLgpd();
            } else {
                mostrarAviso(res.erro || res.data?.erro || 'Erro ao registrar intenção de doação.');
            }
        } catch (err) {
            mostrarAviso('Erro de conexão ao salvar intenção de doação.');
        }
    });

    // ==================== INICIALIZAÇÃO ====================
    await carregarCatalogo();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            renderizarItens(termo);
        });
    }

    // ==================== BOTÃO VOLTAR AO TOPO (FAB) ====================
    const fab = document.getElementById('scrollToTopBtn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            fab.classList.add('visible');
        } else {
            fab.classList.remove('visible');
        }
    });

    fab.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

});