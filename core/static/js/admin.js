import Api from './api.js?v=3';

document.addEventListener('DOMContentLoaded', async () => {

    let admin = null;
    let usuarios = [];

    // ==================== ABAS ====================
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
            if (tab.dataset.tab === 'historico') {
                renderizarHistorico(document.getElementById('searchHistorico').value);
            }
        });
    });

    // ==================== CARREGAR ADMIN DO BACKEND ====================
    async function carregarAdmin() {
        try {
            const data = await Api.get('/api/auth/usuario');
            if (data && !data.erro) {
                admin = data;
                document.getElementById('adminNome').textContent = admin.nome_completo || 'Administrador';
                document.getElementById('adminNomeCompleto').value = admin.nome_completo || '';
                document.getElementById('adminEmail').value = admin.email || '';
                document.getElementById('adminTelefone').value = admin.telefone || '';
                
                document.getElementById('adminAvatar').src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                
                const topbarNome = document.querySelector('.user-nome-label');
                if (topbarNome) topbarNome.textContent = admin.nome_completo;
            }
        } catch (e) {
            showToast('Erro ao carregar perfil do administrador.', 'error');
        }
    }

    // Máscara de telefone
    document.getElementById('adminTelefone').addEventListener('input', function(e) {
        let n = e.target.value.replace(/\D/g,'').substring(0,11);
        if (n.length <= 2) e.target.value = n.length ? `(${n}` : '';
        else if (n.length <= 7) e.target.value = `(${n.substring(0,2)}) ${n.substring(2)}`;
        else if (n.length === 11) e.target.value = `(${n.substring(0,2)}) ${n.substring(2,7)}-${n.substring(7)}`;
        else e.target.value = `(${n.substring(0,2)}) ${n.substring(2,6)}-${n.substring(6)}`;
    });

    // Upload de avatar (Mock frontend-only)
    document.getElementById('uploadAdminAvatar').addEventListener('change', function() {
        if (this.files[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('adminAvatar').src = e.target.result;
                showToast('Foto atualizada!');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Formulário de dados pessoais
    document.getElementById('formAdminDados').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('adminNomeCompleto').value.trim();
        const telefone = document.getElementById('adminTelefone').value.trim();

        if (!nome || telefone.replace(/\D/g,'').length < 10) {
            showToast('Preencha nome e telefone corretamente.', 'error');
            return;
        }

        try {
            const res = await Api.patch('/api/auth/usuario', {
                nome_completo: nome,
                telefone: telefone
            });
            if (res && (res.status === 200 || !res.erro)) {
                showToast('Dados atualizados!');
                await carregarAdmin();
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao salvar dados.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar dados.', 'error');
        }
    });

    // Formulário de alteração de senha
    document.getElementById('formAdminSenha').addEventListener('submit', async (e) => {
        e.preventDefault();
        const senhaAtual = document.getElementById('adminSenhaAtual').value;
        const novaSenha = document.getElementById('adminNovaSenha').value;
        const confirmarSenha = document.getElementById('adminConfirmarSenha').value;

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            showToast('Preencha todos os campos.', 'error');
            return;
        }
        if (novaSenha.length < 6) {
            showToast('A nova senha precisa ter no mínimo 6 caracteres.', 'error');
            return;
        }
        if (novaSenha !== confirmarSenha) {
            showToast('As senhas não conferem.', 'error');
            return;
        }

        try {
            const res = await Api.patch('/api/auth/usuario', {
                senha_atual: senhaAtual,
                nova_senha: novaSenha
            });
            if (res && (res.status === 200 || !res.erro)) {
                showToast('Senha atualizada!');
                e.target.reset();
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao alterar senha.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao alterar senha.', 'error');
        }
    });

    // ==================== USUÁRIOS ====================
    const usuariosBody = document.getElementById('usuariosTableBody');
    let usuarioEditando = null;

    async function carregarUsuarios() {
        try {
            const data = await Api.get('/api/usuarios');
            if (data && data.usuarios) {
                usuarios = data.usuarios.map(u => ({
                    id: u.id,
                    nome: u.nome,
                    email: u.email,
                    cargo: u.cargo,
                    status: u.status
                }));
                renderizarUsuarios(document.getElementById('searchUsuarios').value);
            }
        } catch (e) {
            showToast('Erro de conexão ao carregar funcionários.', 'error');
        }
    }

    function renderizarUsuarios(termo = '') {
        const filtrados = termo
            ? usuarios.filter(u => u.nome.toLowerCase().includes(termo.toLowerCase()) || u.email.toLowerCase().includes(termo.toLowerCase()))
            : usuarios;
        usuariosBody.innerHTML = '';
        filtrados.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${u.nome}</strong></td>
                <td>${u.email}</td>
                <td>${u.cargo === 'admin' ? 'Administrador' : 'Operador'}</td>
                <td><span class="status-badge status-${u.status}">${u.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                <td class="actions-cell">
                    <button class="btn-edit" data-id="${u.id}" title="Editar">✎</button>
                    <button class="btn-toggle-status" data-id="${u.id}" title="${u.status === 'ativo' ? 'Desativar' : 'Ativar'}">${u.status === 'ativo' ? '🔒' : '🔓'}</button>
                    <button class="btn-delete" data-id="${u.id}" title="Excluir">🗑</button>
                </td>
            `;
            usuariosBody.appendChild(tr);
        });
        document.querySelectorAll('#usuariosTableBody .btn-edit').forEach(b => b.addEventListener('click', () => editarUsuario(parseInt(b.dataset.id, 10))));
        document.querySelectorAll('#usuariosTableBody .btn-toggle-status').forEach(b => b.addEventListener('click', () => toggleStatusUsuario(parseInt(b.dataset.id, 10))));
        document.querySelectorAll('#usuariosTableBody .btn-delete').forEach(b => b.addEventListener('click', () => confirmarExclusaoUsuario(parseInt(b.dataset.id, 10))));
    }

    document.getElementById('searchUsuarios').addEventListener('input', e => renderizarUsuarios(e.target.value));

    // Modal editar usuário
    const modalUsuario = document.getElementById('modalUsuario');
    function abrirModalUsuario(titulo) {
        modalUsuario.classList.add('active');
        document.getElementById('modalUsuarioTitulo').textContent = titulo;
    }
    function fecharModalUsuario() {
        modalUsuario.classList.remove('active');
        document.getElementById('formUsuario').reset();
        usuarioEditando = null;
    }
    document.getElementById('closeModalUsuario').addEventListener('click', fecharModalUsuario);
    modalUsuario.addEventListener('click', e => { if (e.target === modalUsuario) fecharModalUsuario(); });

    // Handle form submission to create or update users
    document.getElementById('formUsuario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('usuarioNome').value.trim();
        const email = document.getElementById('usuarioEmail').value.trim();
        const cargo = document.getElementById('usuarioCargo').value;
        const status = document.getElementById('usuarioStatus').value;
        if (!nome || !email) { showToast('Nome e e-mail são obrigatórios.', 'error'); return; }

        const payload = {
            nome_completo: nome,
            email: email,
            cargo: cargo,
            status: status
        };

        try {
            let res;
            if (usuarioEditando) {
                res = await Api.patch(`/api/usuarios/${usuarioEditando}`, payload);
            } else {
                // Creates account with default password 'password'
                res = await Api.post('/api/usuarios', payload);
            }

            if (res && (res.status === 200 || res.status === 201 || !res.erro)) {
                showToast(usuarioEditando ? 'Funcionário atualizado!' : 'Funcionário cadastrado com sucesso!');
                fecharModalUsuario();
                await carregarUsuarios();
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao salvar funcionário.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar funcionário.', 'error');
        }
    });

    window.fecharModalUsuario = fecharModalUsuario; // expose globally as inline HTML button refers to it
    window.abrirModalUsuario = abrirModalUsuario; // expose globally as inline HTML button refers to it

    const btnNovoUsuario = document.getElementById('btnNovoUsuario');
    if (btnNovoUsuario) {
        btnNovoUsuario.addEventListener('click', () => abrirModalUsuario('Novo Funcionário'));
    }

    function editarUsuario(id) {
        const u = usuarios.find(u => u.id === id);
        if (!u) return;
        usuarioEditando = id;
        document.getElementById('usuarioNome').value = u.nome;
        document.getElementById('usuarioEmail').value = u.email;
        document.getElementById('usuarioCargo').value = u.cargo;
        document.getElementById('usuarioStatus').value = u.status;
        abrirModalUsuario('Editar Funcionário');
    }

    async function toggleStatusUsuario(id) {
        const u = usuarios.find(u => u.id === id);
        if (!u) return;
        const newStatus = u.status === 'ativo' ? 'inativo' : 'ativo';

        try {
            const res = await Api.patch(`/api/usuarios/${id}`, { status: newStatus });
            if (res && (res.status === 200 || !res.erro)) {
                showToast(`Funcionário ${newStatus === 'ativo' ? 'ativado' : 'desativado'}.`);
                await carregarUsuarios();
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao alterar status.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao alterar status.', 'error');
        }
    }

    let idExcluir = null;
    function confirmarExclusaoUsuario(id) {
        idExcluir = id;
        document.getElementById('modalExclusaoUsuario').classList.add('active');
    }
    document.getElementById('btnConfirmarExclusaoUsuario').addEventListener('click', async () => {
        if (idExcluir) {
            try {
                const res = await Api.delete(`/api/usuarios/${idExcluir}`);
                if (res && (res.status === 200 || !res.erro)) {
                    showToast('Funcionário excluído.');
                    await carregarUsuarios();
                } else {
                    showToast(res.erro || res.data?.erro || 'Erro ao excluir funcionário.', 'error');
                }
            } catch (err) {
                showToast('Erro de conexão ao excluir.', 'error');
            }
        }
        document.getElementById('modalExclusaoUsuario').classList.remove('active');
        idExcluir = null;
    });
    document.getElementById('btnCancelarExclusaoUsuario').addEventListener('click', () => {
        document.getElementById('modalExclusaoUsuario').classList.remove('active');
        idExcluir = null;
    });

    // ==================== HISTÓRICO (LOGS) ====================
    const historicoBody = document.getElementById('historicoTableBody');
    let logs = [];

    async function renderizarHistorico(termo = '') {
        try {
            const res = await Api.get('/api/historico');
            if (res && res.historico) {
                logs = res.historico;
                const filtrados = termo
                    ? logs.filter(l => l.usuario.toLowerCase().includes(termo.toLowerCase()) || l.acao.toLowerCase().includes(termo.toLowerCase()) || l.descricao.toLowerCase().includes(termo.toLowerCase()))
                    : logs;
                historicoBody.innerHTML = '';
                filtrados.slice(0, 100).forEach(log => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${log.data_hora}</td>
                        <td>${log.usuario}</td>
                        <td>${log.acao}</td>
                        <td>${log.descricao}</td>
                    `;
                    historicoBody.appendChild(tr);
                });
            }
        } catch (e) {
            console.error('Erro ao buscar histórico de logs', e);
        }
    }

    document.getElementById('searchHistorico').addEventListener('input', e => renderizarHistorico(e.target.value));

    // Limpar histórico via modal
    const modalLimparHistorico = document.getElementById('modalLimparHistorico');
    document.getElementById('btnLimparHistorico').addEventListener('click', () => {
        modalLimparHistorico.classList.add('active');
    });
    document.getElementById('btnConfirmarLimparHistorico').addEventListener('click', async () => {
        try {
            const res = await Api.delete('/api/historico');
            if (res && (res.status === 200 || !res.erro)) {
                showToast('Histórico limpo com sucesso.');
                document.getElementById('searchHistorico').value = '';
                await renderizarHistorico('');
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao limpar histórico.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao limpar histórico.', 'error');
        }
        modalLimparHistorico.classList.remove('active');
    });
    document.getElementById('btnCancelarLimparHistorico').addEventListener('click', () => {
        modalLimparHistorico.classList.remove('active');
    });
    modalLimparHistorico.addEventListener('click', (e) => {
        if (e.target === modalLimparHistorico) modalLimparHistorico.classList.remove('active');
    });

    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
    }

    // Inicializar renderizações
    await carregarAdmin();
    await carregarUsuarios();
    await renderizarHistorico();
});