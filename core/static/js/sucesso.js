document.addEventListener('DOMContentLoaded', () => {
    const summaryId = document.getElementById('summary-id');
    const summaryBeneficiary = document.getElementById('summary-beneficiary');
    const summaryDate = document.getElementById('summary-date');
    const summaryList = document.getElementById('summary-list');
    const btnNewDelivery = document.getElementById('btnNewDelivery');
    const btnBack = document.getElementById('btnBack');

    // Retrieve last delivery data
    const lastDeliveryData = sessionStorage.getItem('last_delivery');

    if (lastDeliveryData) {
        try {
            const delivery = JSON.parse(lastDeliveryData);

            if (summaryId && delivery.id) {
                summaryId.textContent = `Resumo da Entrega #${delivery.id.replace('del-', '')}`;
            }
            if (summaryBeneficiary && delivery.beneficiario) {
                summaryBeneficiary.textContent = `Beneficiário: ${delivery.beneficiario}`;
            }
            if (summaryDate && delivery.data) {
                const date = new Date(delivery.data);
                const formatTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const formatDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                summaryDate.textContent = `${formatDate}, às ${formatTime}`;
            }

            if (summaryList && delivery.itens && delivery.itens.length) {
                summaryList.innerHTML = '';
                delivery.itens.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'poppins-regular';
                    li.innerHTML = `
                        <span>${item.nome}</span>
                        <span class="poppins-semibold">${item.quantidade} ${item.unidade || 'un'}</span>
                    `;
                    summaryList.appendChild(li);
                });
            }
        } catch (e) {
            console.error('Erro ao processar dados da entrega no sessionStorage:', e);
        }
    }

    // Bind action events
    if (btnNewDelivery) {
        btnNewDelivery.addEventListener('click', () => {
            window.location.href = '/frente-caixa.html';
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.href = '/visao-geral-estoque.html';
        });
    }
});
