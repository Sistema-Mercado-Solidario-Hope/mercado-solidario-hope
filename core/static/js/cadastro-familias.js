import Api from './api.js?v=3';

document.addEventListener('DOMContentLoaded', async () => {

    // ==================== REFERÊNCIAS ====================
    const form = document.getElementById('formFamilia');
    const idInput = document.getElementById('familiaId');
    const nomeInput = document.getElementById('nomeFamilia');
    const responsavelInput = document.getElementById('responsavel');
    const cpfNisInput = document.getElementById('cpf_nis');
    const telefoneInput = document.getElementById('telefone');
    const enderecoInput = document.getElementById('endereco');
    const numMembrosInput = document.getElementById('numMembros');
    const statusSelect = document.getElementById('status');
    const btnSalvar = document.getElementById('btnSalvar');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const lgpdCheckbox = document.getElementById('lgpdConsent');

    // ==================== FUNÇÕES AUXILIARES ====================
    function sanitize(str) {
        return str.replace(/<[^>]*>/g, '').trim();
    }

    function showFieldError(field, msg) {
        clearFieldError(field);
        field.classList.add('input-error');
        const error = document.createElement('span');
        error.className = 'field-error poppins-regular';
        error.textContent = msg;
        field.parentNode.appendChild(error);
    }

    function clearFieldError(field) {
        field.classList.remove('input-error');
        const existing = field.parentNode.querySelector('.field-error');
        if (existing) existing.remove();
    }

    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        }
    }

    // ==================== MÁSCARA DE TELEFONE ====================
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
                if (cpfNisInput) cpfNisInput.value = data.cpf_nis || data.nis || data.cpf || '';
                numMembrosInput.value = data.members || data.numMembros || 1;
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

    // ==================== VALIDAÇÃO E ENVIO ====================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        [nomeInput, responsavelInput, cpfNisInput, telefoneInput, enderecoInput, numMembrosInput].forEach(clearFieldError);

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
        const cpfNis = cpfNisInput ? sanitize(cpfNisInput.value) : '';
        let telefone = telefoneInput.value.trim();
        const numerosTelefone = telefone.replace(/\D/g, '');
        const endereco = sanitize(enderecoInput.value);
        const numMembros = parseInt(numMembrosInput.value, 10);
        const status = statusSelect.value;

        if (!responsavel) {
            showFieldError(responsavelInput, 'Responsável é obrigatório.');
            valid = false;
        }
        if (!cpfNis) {
            showFieldError(cpfNisInput, 'CPF ou NIS é obrigatório.');
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
            cpf_nis: cpfNis,
            numMembros: numMembros,
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
    [nomeInput, responsavelInput, cpfNisInput, telefoneInput, enderecoInput, numMembrosInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => clearFieldError(input));
        }
    });

});