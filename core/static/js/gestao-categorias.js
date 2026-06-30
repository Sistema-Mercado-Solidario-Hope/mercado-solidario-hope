import Api from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    let categoriesList = [];
    let editingId = null;

    const tbody = document.getElementById('categoriasTableBody');
    const form = document.getElementById('formCategoria');
    const inputNome = document.getElementById('catNome');
    const inputDescricao = document.getElementById('catDescricao');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const formCardTitle = document.getElementById('formCardTitle');

    // Toast helpers
    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        }
    }

    function clearFieldError(field) {
        if (!field) return;
        field.classList.remove('input-error');
        const existing = field.parentNode.querySelector('.field-error');
        if (existing) existing.remove();
    }

    function showFieldError(field, msg) {
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

    // Carregar categorias
    async function carregarCategorias() {
        try {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">
                        Carregando categorias...
                    </td>
                </tr>
            `;
            const data = await Api.get('/api/estoque/categorias');
            if (data && data.categorias) {
                categoriesList = data.categorias;
                renderCategorias();
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center; padding:30px; color:var(--danger);">
                            Erro ao obter categorias.
                        </td>
                    </tr>
                `;
            }
        } catch (e) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:30px; color:var(--danger);">
                        Erro de rede ao carregar categorias.
                    </td>
                </tr>
            `;
        }
    }

    // Renderizar categorias na tabela
    function renderCategorias() {
        tbody.innerHTML = '';
        if (categoriesList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">
                        Nenhuma categoria cadastrada.
                    </td>
                </tr>
            `;
            return;
        }

        categoriesList.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:14px 16px; font-weight:600; color:var(--text-dark);">${c.nome}</td>
                <td style="padding:14px 16px; color:var(--text-main);">${c.descricao || '—'}</td>
                <td style="padding:14px 16px; text-align:center;">
                    <span class="badge-count">${c.qtd_produtos}</span>
                </td>
                <td style="padding:14px 16px; text-align:center;">
                    <div class="actions-cell" style="justify-content:center;">
                        <button class="btn-edit-cat" data-id="${c.id}" title="Editar Categoria">✏️</button>
                        <button class="btn-delete-cat" data-id="${c.id}" title="Excluir Categoria">🗑️</button>
                    </div>
                </td>
            `;

            // Bind events
            tr.querySelector('.btn-edit-cat').addEventListener('click', () => setEditMode(c));
            tr.querySelector('.btn-delete-cat').addEventListener('click', () => confirmarExclusao(c));

            tbody.appendChild(tr);
        });
    }

    // Entrar em modo de edição
    function setEditMode(category) {
        editingId = category.id;
        inputNome.value = category.nome;
        inputDescricao.value = category.descricao || '';
        formCardTitle.textContent = 'Editar Categoria';
        btnSubmit.textContent = 'Salvar Alterações';
        btnCancelEdit.classList.remove('hidden');
        clearFieldError(inputNome);
        inputNome.focus();
    }

    // Sair do modo de edição
    function resetForm() {
        editingId = null;
        form.reset();
        formCardTitle.textContent = 'Nova Categoria';
        btnSubmit.textContent = 'Criar Categoria';
        btnCancelEdit.classList.add('hidden');
        clearFieldError(inputNome);
    }

    btnCancelEdit.addEventListener('click', resetForm);

    // Enviar formulário (Criar / Editar)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFieldError(inputNome);

        const nome = inputNome.value.trim();
        const descricao = inputDescricao.value.trim();

        if (!nome) {
            showFieldError(inputNome, 'O nome da categoria é obrigatório.');
            return;
        }

        try {
            btnSubmit.disabled = true;
            if (editingId) {
                // Editar
                const res = await Api.patch(`/api/estoque/categorias/${editingId}`, { nome, descricao });
                if (res && !res.erro) {
                    showToast('Categoria atualizada com sucesso!');
                    resetForm();
                    await carregarCategorias();
                } else {
                    showToast(res.erro || 'Erro ao atualizar categoria.', 'error');
                }
            } else {
                // Criar
                const res = await Api.post('/api/estoque/categorias', { nome, descricao });
                if (res && !res.erro) {
                    showToast('Categoria criada com sucesso!');
                    resetForm();
                    await carregarCategorias();
                } else {
                    showToast(res.erro || 'Erro ao criar categoria.', 'error');
                }
            }
        } catch (err) {
            showToast('Erro de conexão ao salvar categoria.', 'error');
        } finally {
            btnSubmit.disabled = false;
        }
    });

    // Confirmar e executar exclusão
    async function confirmarExclusao(category) {
        if (category.qtd_produtos > 0) {
            showToast('Não é possível excluir uma categoria que possui produtos associados.', 'error');
            return;
        }

        const confirmacao = confirm(`Deseja realmente excluir a categoria "${category.nome}"?`);
        if (!confirmacao) return;

        try {
            const res = await Api.delete(`/api/estoque/categorias/${category.id}`);
            if (res && res.sucesso) {
                showToast('Categoria excluída com sucesso!');
                if (editingId === category.id) {
                    resetForm();
                }
                await carregarCategorias();
            } else {
                showToast(res.erro || 'Erro ao excluir categoria.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao excluir categoria.', 'error');
        }
    }

    // Limpar erros ao digitar
    inputNome.addEventListener('input', () => clearFieldError(inputNome));

    // Inicializar
    carregarCategorias();
});
