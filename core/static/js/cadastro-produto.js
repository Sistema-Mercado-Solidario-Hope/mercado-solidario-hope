import Api from './api.js';

document.addEventListener('DOMContentLoaded', () => {

    // ==================== REFERÊNCIAS ====================
    const form = document.getElementById('formCadastroProduto');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('imagemProduto');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const btnRemoveImage = document.getElementById('btnRemoveImage');
    const btnReset = document.getElementById('btnResetForm');

    // Campos do formulário
    const nomeInput = document.getElementById('nomeProduto');
    const categoriaSelect = document.getElementById('categoria');
    const unidadeSelect = document.getElementById('unidade');
    const estoqueMinInput = document.getElementById('estoqueMinimo');
    const estoqueMaxInput = document.getElementById('estoqueMaximo');
    const metaInput = document.getElementById('metaArrecadacao');
    const lgpdCheckbox = document.getElementById('lgpdConsent');

    // ==================== FUNÇÕES AUXILIARES ====================
    function sanitize(str) {
        if (!str) return '';
        return str.replace(/<[^>]*>/g, '').trim();
    }

    function showFieldError(field, message) {
        clearFieldError(field);
        field.classList.add('input-error');
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error poppins-regular';
        errorSpan.textContent = message;
        field.parentNode.appendChild(errorSpan);
    }

    // Limpeza de erros ao digitar/selecionar
    function clearFieldError(field) {
        field.classList.remove('input-error');
        const existing = field.parentNode.querySelector('.field-error');
        if (existing) existing.remove();
    }

    function clearAllErrors() {
        [nomeInput, categoriaSelect, unidadeSelect, estoqueMinInput, estoqueMaxInput, metaInput].forEach(clearFieldError);
        dropZone.classList.remove('input-error'); // limpa erro da imagem
        const lgpdError = document.querySelector('.lgpd-error');
        if (lgpdError) lgpdError.classList.remove('lgpd-error');
    }

    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        } else {
            console.log(`Toast (${type}): ${msg}`);
        }
    }

    // ==================== UPLOAD DE IMAGEM ====================
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showToast('Formato de imagem inválido. Use JPG, PNG ou WebP.', 'error');
            return;
        }
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            showToast('A imagem deve ter no máximo 2MB.', 'error');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadPlaceholder.classList.add('hidden');
            uploadPreview.classList.remove('hidden');
            dropZone.classList.remove('input-error');
        };
        reader.readAsDataURL(file);
    }

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
    });

    // Drag and drop
    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });
    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            handleFile(files[0]);
        }
    });

    btnRemoveImage.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        previewImage.src = '';
        uploadPreview.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
        dropZone.classList.remove('input-error');
    });

    // ==================== LIMPEZA DE ERROS AO DIGITAR/SELECIONAR ====================
    [nomeInput, estoqueMinInput, estoqueMaxInput, metaInput].forEach(input => {
        input.addEventListener('input', () => clearFieldError(input));
    });
    [categoriaSelect, unidadeSelect].forEach(select => {
        select.addEventListener('change', () => clearFieldError(select));
    });
    lgpdCheckbox.addEventListener('change', () => {
        const container = lgpdCheckbox.closest('.compliance-label');
        if (container) container.classList.remove('lgpd-error');
    });

    // ==================== RESET DO FORMULÁRIO ====================
    btnReset.addEventListener('click', () => {
        form.reset();
        clearAllErrors();
        fileInput.value = '';
        previewImage.src = '';
        uploadPreview.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
        showToast('Campos limpos', 'info');
    });

    // ==================== VALIDAÇÃO E ENVIO ====================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();
        let isValid = true;

        // 1. Nome do produto
        const nomeRaw = nomeInput.value;
        const nome = sanitize(nomeRaw);
        if (!nome) {
            showFieldError(nomeInput, 'O nome do produto é obrigatório.');
            isValid = false;
        } else if (nome !== nomeRaw) {
            nomeInput.value = nome;
        }

        // 2. Categoria
        if (!categoriaSelect.value) {
            showFieldError(categoriaSelect, 'Selecione uma categoria.');
            isValid = false;
        }

        // 3. Unidade de medida
        if (!unidadeSelect.value) {
            showFieldError(unidadeSelect, 'Selecione uma unidade de medida.');
            isValid = false;
        }

        // 4. Estoque mínimo e máximo
        let min = parseInt(estoqueMinInput.value, 10);
        let max = parseInt(estoqueMaxInput.value, 10);

        if (isNaN(min) || min < 0) {
            showFieldError(estoqueMinInput, 'Informe um valor mínimo válido (≥ 0).');
            isValid = false;
        }
        if (isNaN(max) || max < 0) {
            showFieldError(estoqueMaxInput, 'Informe um valor máximo válido (≥ 0).');
            isValid = false;
        }
        if (!isNaN(min) && !isNaN(max) && min > max) {
            showFieldError(estoqueMinInput, 'Mínimo não pode ser maior que o máximo.');
            showFieldError(estoqueMaxInput, 'Máximo não pode ser menor que o mínimo.');
            isValid = false;
        }

        // 5. Meta de arrecadação
        let meta = parseInt(metaInput.value, 10);
        if (isNaN(meta) || meta < 0) {
            showFieldError(metaInput, 'Informe uma meta de arrecadação válida (≥ 0).');
            isValid = false;
        }

        // 5. Imagem do produto (obrigatória)
        if (!fileInput.files.length || !previewImage.src) {
            dropZone.classList.add('input-error');
            showToast('A imagem do produto é obrigatória.', 'error');
            isValid = false;
        }

        // 6. LGPD
        if (!lgpdCheckbox.checked) {
            const container = lgpdCheckbox.closest('.compliance-label');
            if (container) container.classList.add('lgpd-error');
            showToast('Aceite a conformidade com a LGPD.', 'error');
            isValid = false;
        }

        if (!isValid) {
            showToast('Corrija os campos destacados.', 'error');
            return;
        }

        // Use a generic placeholder corresponding to selected category to look premium
        const imagePlaceholderMap = {
            'Cereais': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120',
            'Leguminosas': 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&w=120',
            'Higiene': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=120',
            'Proteínas': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=120',
            'Limpeza': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=120',
            'Outros': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120'
        };
        const photoUrl = imagePlaceholderMap[categoriaSelect.value] || imagePlaceholderMap['Outros'];

        const payload = {
            nome: nome,
            categoria: categoriaSelect.value,
            unidade: unidadeSelect.value,
            quantidade: 0,
            estoqueMinimo: min,
            estoque_maximo: max,
            meta: meta,
            imagem_url: photoUrl
        };

        try {
            const res = await Api.post('/api/estoque/produtos', payload);
            if (res && (res.status === 201 || !res.erro)) {
                showToast('Produto cadastrado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = 'gestao-estoque.html';
                }, 1500);
            } else {
                showToast(res.erro || res.data?.erro || 'Erro ao cadastrar produto.', 'error');
            }
        } catch (err) {
            showToast('Erro de conexão ao cadastrar produto.', 'error');
        }
    });

    // ==================== ESTILOS DINÂMICOS DE ERRO ====================
    const style = document.createElement('style');
    style.textContent = `
        .input-error {
            border-color: #EF4444 !important;
            background-color: #FFF5F5 !important;
        }
        .field-error {
            color: #EF4444;
            font-size: 12px;
            margin-top: 4px;
            display: block;
        }
        .lgpd-error .checkmark {
            border-color: #EF4444 !important;
        }
        .upload-zone.input-error {
            border-color: #EF4444 !important;
            background-color: #FFF5F5 !important;
        }
    `;
    document.head.appendChild(style);

});