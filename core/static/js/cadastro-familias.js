import Api from './api.js?v=3';

document.addEventListener('DOMContentLoaded', async () => {

    // ==================== REFERÊNCIAS ====================
    const form = document.getElementById('formFamilia');
    const idInput = document.getElementById('familiaId');
    const nomeInput = document.getElementById('nomeFamilia');
    const responsavelInput = document.getElementById('responsavel');
    const cpfInput = document.getElementById('cpf');
    const nisInput = document.getElementById('nis');
    const telefoneInput = document.getElementById('telefone');
    const enderecoInput = document.getElementById('endereco');
    const numMembrosInput = document.getElementById('numMembros');
    const cotaLimiteInput = document.getElementById('cotaLimite');
    const statusSelect = document.getElementById('status');
    const btnSalvar = document.getElementById('btnSalvar');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const lgpdCheckbox = document.getElementById('lgpdConsent');

    // ==================== FUNÇÕES AUXILIARES ====================
    function sanitize(str) {
        return str.replace(/<[^>]*>/g, '').trim();
    }

    // CPF Validation Helper
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g,'');
        if(cpf === '') return false;
        if (cpf.length !== 11 || 
            cpf === "00000000000" || 
            cpf === "11111111111" || 
            cpf === "22222222222" || 
            cpf === "33333333333" || 
            cpf === "44444444444" || 
            cpf === "55555555555" || 
            cpf === "66666666666" || 
            cpf === "77777777777" || 
            cpf === "88888888888" || 
            cpf === "99999999999")
                return false;       
        let add = 0;
        for (let i=0; i < 9; i ++)
            add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11)
            rev = 0;
        if (rev !== parseInt(cpf.charAt(9)))
            return false;       
        add = 0;
        for (let i = 0; i < 10; i ++)
            add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11)
            rev = 0;
        if (rev !== parseInt(cpf.charAt(10)))
            return false;       
        return true;   
    }

    // NIS Validation Helper
    function validarNIS(nis) {
        nis = nis.replace(/[^\d]+/g,'');
        if (nis.length !== 11 || nis === "00000000000") return false;
        const multiplicadores = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(nis.charAt(i)) * multiplicadores[i];
        }
        let resto = soma % 11;
        let digito = 11 - resto;
        if (digito === 10 || digito === 11) digito = 0;
        return digito === parseInt(nis.charAt(10));
    }

    function clearFieldError(field) {
        if (!field) return;
        field.classList.remove('input-error');
        const existing = field.parentNode.querySelector('.field-error');
        if (existing) existing.remove();
    }

    function showFieldError(field, msg) {
        if (!field) return;
        clearFieldError(field);
        field.classList.add('input-error');
        const error = document.createElement('span');
        error.className = 'field-error poppins-regular';
        error.style.color = 'var(--danger)';
        error.style.fontSize = '11px';
        error.style.marginTop = '4px';
        error.style.display = 'block';
        error.textContent = msg;
        field.parentNode.appendChild(error);
    }

    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        }
    }

    // ==================== MÁSCARAS DE ENTRADA ====================
    function aplicarMascaraTelefone(valor) {
        let numeros = valor.replace(/\D/g, '');
        numeros = numeros.substring(0, 11);
        if (numeros.length <= 2) return numeros.length ? `(${numeros}` : '';
        if (numeros.length <= 7) return `(${numeros.substring(0, 2)}) ${numeros.substring(2)}`;
        if (numeros.length === 11) return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
        return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }

    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            e.target.value = aplicarMascaraTelefone(e.target.value);
        });
    }

    function aplicarMascaraCPF(valor) {
        let numeros = valor.replace(/\D/g, '');
        numeros = numeros.substring(0, 11);
        if (numeros.length <= 3) return numeros;
        if (numeros.length <= 6) return `${numeros.substring(0, 3)}.${numeros.substring(3)}`;
        if (numeros.length <= 9) return `${numeros.substring(0, 3)}.${numeros.substring(3, 6)}.${numeros.substring(6)}`;
        return `${numeros.substring(0, 3)}.${numeros.substring(3, 6)}.${numeros.substring(6, 9)}-${numeros.substring(9)}`;
    }

    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            e.target.value = aplicarMascaraCPF(e.target.value);
        });
    }

    if (nisInput) {
        nisInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
        });
    }

    // ==================== VERIFICAR MODO EDIÇÃO ====================
    const urlParams = new URLSearchParams(window.location.search);
    const idEdicao = urlParams.get('id');

    if (idEdicao) {
        try {
            const data = await Api.get(`/api/beneficiarios/${idEdicao}`);
            if (data && !data.erro) {
                idInput.value = data.id;
                // Remove prefix "Família " if exists for input display
                nomeInput.value = (data.nome || data.name || '').replace(/^Família\s+/i, '');
                responsavelInput.value = data.responsavel || data.responsavel_nome || '';
                telefoneInput.value = data.telefone || '';
                enderecoInput.value = data.endereco || '';
                if (cpfInput) cpfInput.value = data.cpf || '';
                if (nisInput) nisInput.value = data.nis || '';
                numMembrosInput.value = data.members || data.numMembros || 1;
                if (cotaLimiteInput) cotaLimiteInput.value = data.cota_limite || 15;
                statusSelect.value = data.status_pt || (data.status === 'ACTIVE' ? 'ativo' : 'inativo');
                if (lgpdCheckbox) lgpdCheckbox.checked = true;

                pageTitle.textContent = 'Editar Família';
                pageSubtitle.textContent = `Editando "${data.nome || data.name}"`;
                btnSalvar.textContent = 'Salvar Alterações';
            } else {
                showToast(data.erro || 'Erro ao carregar dados da família.', 'error');
            }
        } catch (e) {
            showToast('Erro de conexão com o servidor.', 'error');
        }
    }

    if (numMembrosInput && cotaLimiteInput) {
        numMembrosInput.addEventListener('input', () => {
            const val = parseInt(numMembrosInput.value) || 1;
            if (!idEdicao) {
                cotaLimiteInput.value = Math.max(10, 10 + (val - 1) * 3);
            }
        });
    }

    // ==================== VALIDAÇÃO E ENVIO ====================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        [nomeInput, responsavelInput, cpfInput, nisInput, telefoneInput, enderecoInput, numMembrosInput, cotaLimiteInput].forEach(clearFieldError);

        let valid = true;

        let sobrenome = sanitize(nomeInput.value);
        if (!sobrenome) {
            showFieldError(nomeInput, 'Informe o sobrenome ou nome da família.');
            valid = false;
        } else {
            sobrenome = sobrenome.replace(/\s+/g, ' ').trim();
            sobrenome = sobrenome.replace(/\b\w/g, char => char.toUpperCase());
        }

        const responsavel = sanitize(responsavelInput.value);
        const cpf = cpfInput ? sanitize(cpfInput.value) : '';
        const nis = nisInput ? sanitize(nisInput.value) : '';
        let telefone = telefoneInput.value.trim();
        const numerosTelefone = telefone.replace(/\D/g, '');
        const endereco = sanitize(enderecoInput.value);
        const numMembros = parseInt(numMembrosInput.value, 10);
        const cotaLimite = cotaLimiteInput ? parseInt(cotaLimiteInput.value, 10) : 15;
        const status = statusSelect.value;

        if (!responsavel) {
            showFieldError(responsavelInput, 'Responsável é obrigatório.');
            valid = false;
        }
        if (!cpf) {
            showFieldError(cpfInput, 'CPF do responsável é obrigatório.');
            valid = false;
        } else if (!validarCPF(cpf)) {
            showFieldError(cpfInput, 'CPF inválido.');
            valid = false;
        }
        if (nis && !validarNIS(nis)) {
            showFieldError(nisInput, 'NIS inválido.');
            valid = false;
        }
        if (numerosTelefone.length < 10) {
            showFieldError(telefoneInput, 'Telefone inválido (mínimo 10 dígitos).');
            valid = false;
        }
        if (!endereco) {
            showFieldError(enderecoInput, 'Endereço é obrigatório.');
            valid = false;
        }
        if (isNaN(numMembros) || numMembros < 1) {
            showFieldError(numMembrosInput, 'Mínimo de 1 membro.');
            valid = false;
        }
        if (isNaN(cotaLimite) || cotaLimite < 1) {
            if (cotaLimiteInput) showFieldError(cotaLimiteInput, 'Cota deve ser no mínimo de 1 item.');
            valid = false;
        }
        if (lgpdCheckbox && !lgpdCheckbox.checked) {
            showToast('Aceite dos termos LGPD é obrigatório.', 'error');
            valid = false;
        }

        if (!valid) {
            showToast('Corrija os campos destacados.', 'error');
            return;
        }

        const nomeCompleto = `Família ${sobrenome}`;
        
        const payload = {
            nome: nomeCompleto,
            responsavel: responsavel,
            telefone: telefone,
            endereco: endereco,
            cpf: cpf,
            nis: nis || null,
            numMembros: numMembros,
            cotaLimite: cotaLimite,
            status: status,
            lgpdConsent: true
        };

        try {
            let res;
            if (idEdicao) {
                res = await Api.patch(`/api/beneficiarios/${idEdicao}`, payload);
            } else {
                res = await Api.post('/api/beneficiarios', payload);
            }

            if (res && (res.status === 201 || res.status === 200 || !res.erro)) {
                showToast(idEdicao ? 'Família atualizada com sucesso!' : 'Família cadastrada com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = 'familia-listagem.html';
                }, 800);
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao salvar dados da família.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar.', 'error');
        }
    });

    // Limpeza de erros ao digitar
    [nomeInput, responsavelInput, cpfInput, nisInput, telefoneInput, enderecoInput, numMembrosInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => clearFieldError(input));
        }
    });

});