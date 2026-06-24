import Api from './api.js?v=3';

document.addEventListener('DOMContentLoaded', async () => {

    let usuario = null;

    // ==================== FUNÇÕES AUXILIARES ====================
    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        }
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

    // ==================== CARREGAR USUÁRIO DO BACKEND ====================
    async function carregarUsuario() {
        try {
            const data = await Api.get('/api/auth/usuario');
            if (data && !data.erro) {
                usuario = data;
                document.getElementById('nomeCompleto').value = usuario.nome_completo || '';
                document.getElementById('email').value = usuario.email || '';
                document.getElementById('telefone').value = usuario.telefone || '';
                document.getElementById('perfilNome').textContent = usuario.nome_completo || 'Usuário';
                document.getElementById('perfilCargo').textContent = usuario.cargo === 'admin' ? 'Administrador' : 'Operador';
                
                document.getElementById('perfilAvatar').src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                
                const nomeTopbar = document.querySelector('.user-nome-label');
                if (nomeTopbar) nomeTopbar.textContent = usuario.nome_completo;
            } else {
                showToast(data.erro || 'Erro ao carregar dados do usuário.', 'error');
            }
        } catch (e) {
            showToast('Erro de conexão ao buscar dados do perfil.', 'error');
        }
    }

    // ==================== MÁSCARA DE TELEFONE ====================
    const telefoneInput = document.getElementById('telefone');
    function aplicarMascaraTelefone(valor) {
        let numeros = valor.replace(/\D/g, '');
        numeros = numeros.substring(0, 11);
        if (numeros.length <= 2) return numeros.length ? `(${numeros}` : '';
        if (numeros.length <= 7) return `(${numeros.substring(0, 2)}) ${numeros.substring(2)}`;
        if (numeros.length === 11) return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
        return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }
    telefoneInput.addEventListener('input', (e) => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
    });

    // ==================== UPLOAD DE AVATAR (MOCK FRONTEND ONLY) ====================
    const fileInput = document.getElementById('uploadAvatar');
    const avatarImg = document.getElementById('perfilAvatar');
    const avatarWrapper = document.querySelector('.avatar-upload-wrapper');

    avatarWrapper.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            const file = fileInput.files[0];
            if (!file.type.startsWith('image/')) {
                showToast('Formato de imagem inválido.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarImg.src = e.target.result;
                showToast('Foto de perfil atualizada!', 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    // ==================== FORMULÁRIO DADOS PESSOAIS ====================
    const formDados = document.getElementById('formDadosPessoais');
    formDados.addEventListener('submit', async (e) => {
        e.preventDefault();
        ['nomeCompleto', 'telefone'].forEach(id => clearFieldError(document.getElementById(id)));

        const nome = document.getElementById('nomeCompleto').value.trim();
        const telefone = telefoneInput.value.trim();
        const numerosTelefone = telefone.replace(/\D/g, '');
        let valid = true;

        if (!nome) {
            showFieldError(document.getElementById('nomeCompleto'), 'Nome é obrigatório.');
            valid = false;
        }
        if (!telefone || numerosTelefone.length < 10) {
            showFieldError(telefoneInput, 'Telefone inválido (mínimo 10 dígitos).');
            valid = false;
        }

        if (!valid) {
            showToast('Corrija os campos destacados.', 'error');
            return;
        }

        try {
            const res = await Api.patch('/api/auth/usuario', {
                nome_completo: nome,
                telefone: telefone
            });
            if (res && (res.status === 200 || !res.erro)) {
                showToast('Dados atualizados com sucesso!', 'success');
                await carregarUsuario();
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao atualizar dados.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar dados do perfil.', 'error');
        }
    });

    // ==================== FORMULÁRIO ALTERAR SENHA ====================
    const formSenha = document.getElementById('formSenha');
    formSenha.addEventListener('submit', async (e) => {
        e.preventDefault();
        const senhaAtual = document.getElementById('senhaAtual');
        const novaSenha = document.getElementById('novaSenha');
        const confirmarSenha = document.getElementById('confirmarSenha');
        [senhaAtual, novaSenha, confirmarSenha].forEach(clearFieldError);

        let valid = true;

        if (!senhaAtual.value) {
            showFieldError(senhaAtual, 'Informe a senha atual.');
            valid = false;
        }
        if (!novaSenha.value || novaSenha.value.length < 6) {
            showFieldError(novaSenha, 'Mínimo 6 caracteres.');
            valid = false;
        }
        if (novaSenha.value !== confirmarSenha.value) {
            showFieldError(confirmarSenha, 'As senhas não conferem.');
            valid = false;
        }

        if (!valid) {
            showToast('Corrija os campos destacados.', 'error');
            return;
        }

        try {
            const res = await Api.patch('/api/auth/usuario', {
                senha_atual: senhaAtual.value,
                nova_senha: novaSenha.value
            });
            if (res && (res.status === 200 || !res.erro)) {
                showToast('Senha atualizada com sucesso!', 'success');
                formSenha.reset();
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao atualizar senha.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar nova senha.', 'error');
        }
    });

    // Limpeza de erros ao digitar
    ['nomeCompleto', 'telefone', 'senhaAtual', 'novaSenha', 'confirmarSenha'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => clearFieldError(el));
    });

    // Inicialização
    await carregarUsuario();
});