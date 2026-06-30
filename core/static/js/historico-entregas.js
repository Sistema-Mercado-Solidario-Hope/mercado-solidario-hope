import { toast } from './toast.js';
import Api from './api.js';

window.toast = toast;

document.addEventListener('DOMContentLoaded', async () => {
    // Session load
    carregarUsuario();

    const inputBusca = document.getElementById('busca-beneficiario');
    const suggestionsContainer = document.getElementById('busca-suggestions');
    const familyInfoCard = document.getElementById('family-info-card');
    const timelinePlaceholder = document.getElementById('timeline-placeholder');
    const timelineContainer = document.getElementById('timeline-container');

    // Family Info elements
    const familyName = document.getElementById('family-name');
    const familyStatus = document.getElementById('family-status');
    const familyResponsible = document.getElementById('family-responsible');
    const familyCpfNis = document.getElementById('family-cpf-nis');
    const familyPhone = document.getElementById('family-phone');
    const totalDeliveriesCount = document.getElementById('total-deliveries-count');
    const totalItemsCount = document.getElementById('total-items-count');

    let debounceTimer;

    // Autocomplete events
    if (inputBusca) {
        inputBusca.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = inputBusca.value.trim();
            if (query.length < 2) {
                suggestionsContainer.classList.add('hidden');
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const data = await Api.get(`/api/beneficiarios/busca?q=${encodeURIComponent(query)}`);
                    if (data && data.beneficiarios) {
                        renderSuggestions(data.beneficiarios);
                    }
                } catch (e) {
                    console.error('Erro na busca de beneficiários:', e);
                }
            }, 300);
        });

        // Click outside close suggestions
        document.addEventListener('click', (e) => {
            if (e.target !== inputBusca && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.classList.add('hidden');
            }
        });
    }

    function renderSuggestions(list) {
        suggestionsContainer.innerHTML = '';
        if (list.length === 0) {
            suggestionsContainer.classList.add('hidden');
            return;
        }

        list.forEach(b => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <div class="suggestion-name poppins-semibold">${b.nomeFamilia || b.nome}</div>
                <div class="suggestion-details poppins-regular">Responsável: ${b.responsavel_nome} | CPF: ${b.cpf || '—'} | NIS: ${b.nis || '—'}</div>
            `;
            div.addEventListener('click', () => {
                suggestionsContainer.classList.add('hidden');
                inputBusca.value = b.nomeFamilia || b.nome;
                selecionarFamilia(b.id);
            });
            suggestionsContainer.appendChild(div);
        });

        suggestionsContainer.classList.remove('hidden');
    }

    async function selecionarFamilia(id) {
        try {
            // 1. Get family detailed details
            const data = await Api.get(`/api/beneficiarios/${id}`);
            if (!data) return;

            // Render info fields
            familyName.textContent = data.nomeFamilia || data.name || 'Família';
            
            // Status badge class
            familyStatus.textContent = data.elegivel ? 'Ativo' : 'Inativo';
            familyStatus.className = `badge-status ${data.elegivel ? 'status-ativo' : 'status-inativo'}`;
            
            familyResponsible.textContent = data.responsavel_nome || '—';
            familyCpfNis.textContent = `${data.cpf || '—'} / ${data.nis || '—'}`;
            familyPhone.textContent = data.telefone || '—';
            
            familyInfoCard.classList.remove('hidden');

            // 2. Fetch delivery history
            const histData = await Api.get(`/api/beneficiarios/${id}/entregas`);
            if (histData && histData.entregas) {
                renderTimeline(histData.entregas);
            }
        } catch (e) {
            console.error('Erro ao selecionar beneficiário:', e);
            toast('Erro ao buscar informações da família.', 'danger');
        }
    }

    function renderTimeline(entregas) {
        timelineContainer.innerHTML = '';
        timelinePlaceholder.classList.add('hidden');
        
        let totalItems = 0;
        
        if (entregas.length === 0) {
            totalDeliveriesCount.textContent = '0';
            totalItemsCount.textContent = '0';
            
            timelineContainer.innerHTML = `
                <div class="poppins-regular" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    Nenhuma entrega/atendimento registrado para esta família no sistema.
                </div>
            `;
            timelineContainer.classList.remove('hidden');
            return;
        }

        entregas.forEach(d => {
            const card = document.createElement('div');
            card.className = 'delivery-card';
            
            const cleanId = d.id.toString().replace('del-', '');
            
            // Compute items summary
            let itemsHTML = '';
            let deliveryTotalQty = 0;
            
            if (d.itens && d.itens.length > 0) {
                itemsHTML = `<div class="delivery-items-grid">`;
                d.itens.forEach(it => {
                    deliveryTotalQty += it.quantidade;
                    totalItems += it.quantidade;
                    itemsHTML += `
                        <div class="delivery-item-tag poppins-regular">
                            <span class="delivery-item-name">${it.produto_nome}</span>
                            <span class="delivery-item-qty">${it.quantidade} ${it.unidade}</span>
                        </div>
                    `;
                });
                itemsHTML += `</div>`;
            } else {
                itemsHTML = `<p class="poppins-regular" style="font-size: 13px; color: var(--text-muted); margin: 0;">Nenhum item discriminado.</p>`;
            }

            card.innerHTML = `
                <div class="delivery-header">
                    <h4 class="poppins-bold delivery-title">Entrega #${cleanId}</h4>
                    <span class="poppins-medium delivery-date">${d.data}</span>
                </div>
                <div class="delivery-meta poppins-regular">
                    <strong>Registrado por:</strong> ${d.operador} | 
                    <strong>Quantidade total de itens:</strong> ${deliveryTotalQty}
                </div>
                <div class="delivery-items-title poppins-semibold">Itens entregues:</div>
                ${itemsHTML}
            `;
            
            timelineContainer.appendChild(card);
        });

        // Set summary counters
        totalDeliveriesCount.textContent = entregas.length;
        totalItemsCount.textContent = totalItems;

        timelineContainer.classList.remove('hidden');
    }

    function carregarUsuario() {
        const user = JSON.parse(
            localStorage.getItem('ms_user') || '{"nome":"Operador","tipo":"operador"}'
        );
        document.querySelectorAll('.user-nome-label').forEach(el => {
            el.textContent = user.nome;
        });
        document.querySelectorAll('.user-cargo-label').forEach(el => {
            el.textContent = user.tipo === 'admin' ? 'Administrador' : 'Operador de Estoque';
        });
    }
});
