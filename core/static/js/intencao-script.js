document.addEventListener('DOMContentLoaded', () => {

    // ==================== LISTA DE ITENS (SIMULAÇÃO DO BACKEND) ====================
    const itensDisponiveis = [
        { id: 1, nome: 'Arroz (kg)', categoria: 'alimentos', icone: '🍚' },
        { id: 2, nome: 'Feijão Preto (kg)', categoria: 'alimentos', icone: '🫘' },
        { id: 3, nome: 'Óleo de Soja (ml)', categoria: 'alimentos', icone: '🛢️' },
        { id: 4, nome: 'Leite Integral (L)', categoria: 'alimentos', icone: '🥛' },
        { id: 5, nome: 'Sabonete', categoria: 'higiene', icone: '🧼' },
        { id: 6, nome: 'Creme Dental', categoria: 'higiene', icone: '🪥' },
        { id: 7, nome: 'Detergente', categoria: 'limpeza', icone: '🧴' },
        { id: 8, nome: 'Fralda Infantil (pacote)', categoria: 'infantil', icone: '👶' }
    ];

    const listaItensContainer = document.getElementById('listaItens');
    const btnAdicionarItem = document.getElementById('btnAdicionarItem');
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
    function renderizarItens() {
        listaItensContainer.innerHTML = '';

        itensDisponiveis.forEach(item => {
            const card = criarItemCard(item);
            listaItensContainer.appendChild(card);
        });
    }

    function criarItemCard(item) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'item-card';
        cardDiv.dataset.itemId = item.id;

        cardDiv.innerHTML = `
            <div class="item-info">
                <div class="item-icon">${item.icone}</div>
                <div class="item-details">
                    <span class="item-nome poppins-semibold">${item.nome}</span>
                    <span class="item-categoria poppins-regular">${item.categoria}</span>
                </div>
            </div>
            <div class="item-quantidade">
                <label for="qtd-${item.id}" class="poppins-medium">Quantidade:</label>
                <input type="number" id="qtd-${item.id}" name="qtd-${item.id}" min="0" value="0" class="poppins-regular" placeholder="0">
            </div>
        `;

        return cardDiv;
    }

    function adicionarItemExtra(nome = '', quantidade = '') {
        const extraDiv = document.createElement('div');
        extraDiv.className = 'item-extra-row';
        extraDiv.innerHTML = `
            <input type="text" class="poppins-regular item-extra-nome" placeholder="Nome do item" value="${nome}">
            <input type="number" class="poppins-regular item-extra-qtd" min="1" value="${quantidade}" placeholder="Qtd">
            <button type="button" class="btn-remover-item poppins-medium">
                <span>🗑️</span> Remover
            </button>
        `;

        extraDiv.querySelector('.btn-remover-item').addEventListener('click', () => {
            extraDiv.remove();
        });

        listaItensContainer.appendChild(extraDiv);
    }

    btnAdicionarItem.addEventListener('click', () => {
        adicionarItemExtra();
    });

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

    function mostrarModalSucesso(nomeDoador, totalItens, telefone) {
        const overlay = criarModalSucesso();
        
        const mensagem = overlay.querySelector('.sucesso-mensagem');
        mensagem.textContent = `Obrigado, ${nomeDoador}! Sua intenção de doação com ${totalItens} item(ns) foi registrada.`;

        const codigo = gerarCodigoIntencao();
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
                window.location.href = 'vitrineNecessidade.html';
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
    formIntencao.addEventListener('submit', (e) => {
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
            const qtdInput = document.getElementById(`qtd-${item.id}`);
            const quantidade = parseInt(qtdInput.value, 10);
            if (quantidade > 0) {
                doacao.itens.push({
                    id: item.id,
                    nome: item.nome,
                    quantidade
                });
            }
        });

        const extras = document.querySelectorAll('.item-extra-row');
        extras.forEach(extra => {
            const nomeExtra = extra.querySelector('.item-extra-nome').value.trim();
            const qtdExtra = parseInt(extra.querySelector('.item-extra-qtd').value, 10);
            if (nomeExtra && qtdExtra > 0) {
                doacao.itens.push({
                    id: null,
                    nome: nomeExtra,
                    quantidade: qtdExtra
                });
            }
        });

        if (doacao.itens.length === 0) {
            mostrarAviso('Adicione pelo menos um item com quantidade maior que zero.');
            return;
        }

        console.log('📦 Intenção de doação pronta para envio ao backend:', doacao);

        mostrarModalSucesso(nome.split(' ')[0], doacao.itens.length, telefone);

        formIntencao.reset();
        document.querySelectorAll('.item-extra-row').forEach(el => el.remove());
        itensDisponiveis.forEach(item => {
            const input = document.getElementById(`qtd-${item.id}`);
            if (input) input.value = 0;
        });
        limparErroLgpd();
    });

    // ==================== INICIALIZAÇÃO ====================
    renderizarItens();

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