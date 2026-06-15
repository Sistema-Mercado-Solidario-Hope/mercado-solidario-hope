// Mobile Dashboard Controller — Mercado Solidário
import Api from './api.js';

// Global Checkout State for Mobile
const mobileState = {
  selectedBeneficiary: null,
  cart: {
    "prod-2": 1, // Arroz Agulhinha Pacote 5kg (Qtd: 1)
    "prod-8": 2, // Feijão Preto Tipo 1 (Qtd: 2)
    "prod-3": 0, // Leite or Óleo depends on index seed
    "prod-10": 1 // Óleo de Soja (Qtd: 1)
  },
  products: [],
  beneficiaries: [],
};

// Se o Óleo de Soja padrão esgotou, mapeamos para prod-10 ou ajustamos com base no data.js para ficar 100% livre de erros
function ajustarSementesIniciais() {
  // Ajuste rápido para bater com os ids corretos do data.js
  mobileState.cart = {
    "prod-2": 1,   // Arroz Agulhinha Pacote 5kg -> Qtd 1
    "prod-8": 2,   // Feijão Preto Tipo 1 (1kg) -> Qtd 2
    "prod-7": 0,   // Leite Integral (Caixa 1L) -> Qtd 0 (Estoque crítico)
    "prod-1": 1    // Ovos ou sobressalente como óleo de soja
  };
}

function verificarSessao() {
  const token = localStorage.getItem('ms_token');
  if (!token) {
    window.location.href = './login.html';
    return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!verificarSessao()) return;
  ajustarSementesIniciais();

  // Carregar produtos iniciais
  await recarregarProdutosMoveis();

  // Configurar Busca de Beneficiário no Mobile
  configurarBuscaBeneficiarioMobile();

  // Abas categoria horizontais
  configurarTabsMoveis();

  // Configurar Bottom Sheet e confirmações
  configurarBottomSheetMenu();

  // Semente inicial de Beneficiário (Família Oliveira)
  await selecionarBeneficiarioMobile("ben-1");
  
  // Renderizar o primeiro carrinho
  atualizarFooterStatus();
});

// Busca os produtos vigentes
async function recarregarProdutosMoveis(categoriaFiltro = "") {
  let endpoint = '/api/estoque/produtos';
  if (categoriaFiltro) {
    endpoint += `?categoria=${encodeURIComponent(categoriaFiltro)}`;
  }
  const res = await Api.get(endpoint);
  if (res && res.produtos) {
    mobileState.products = res.produtos;
    renderizarListaProdutosMoveis();
  }
}

// Renderiza a lista de produtos (Padrão 1 coluna com Fotos 56x56 para Celular)
function renderizarListaProdutosMoveis() {
  const container = document.getElementById('lista-produtos-mobile');
  if (!container) return;

  container.innerHTML = '';

  if (mobileState.products.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-xs text-gray-400">Nenhum produto cadastrado nessa categoria.</div>`;
    return;
  }

  // Pegar e mapear apenas os 4 itens em destaque requisitados para ilustrar a semente do Figma
  mobileState.products.forEach(prod => {
    const qty = mobileState.cart[prod.id] || 0;
    const isEsgotado = prod.esgotado || prod.quantityEstoque <= 0;

    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition';
    
    // Status visual de estoque (verde regular vs vermelho crítico)
    let badgeEstoque = `<p class="text-xs font-semibold text-[#16A34A] mt-0.5">Estoque: ${prod.quantityEstoque} ${prod.unidade}</p>`;
    if (prod.estoqueCritico || prod.quantityEstoque <= 12) {
      badgeEstoque = `<p class="text-xs font-semibold text-red-500 mt-0.5">Estoque Crítico: ${prod.quantityEstoque} ${prod.unidade}</p>`;
    }
    if (isEsgotado) {
      badgeEstoque = `<p class="text-xs font-semibold text-red-600 mt-0.5 uppercase tracking-wide">ESGOTADO</p>`;
    }

    row.innerHTML = `
      <!-- Foto do produto (~56x56px, radius 8px) -->
      <div class="flex items-center gap-3.5 flex-1 min-w-0">
        <img src="${prod.foto}" alt="${prod.name}" class="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0 select-none" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=80'"/>
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 truncate pr-2" title="${prod.name}">${prod.name}</h3>
          ${badgeEstoque}
        </div>
      </div>

      <!-- Controle de quantidade (coluna direita, alinhada no centro) -->
      <div class="shrink-0 flex items-center gap-2.5">
        ${isEsgotado ? `
          <span class="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded-lg">Indisponível</span>
        ` : `
          <button class="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md text-gray-700 font-bold active:scale-90 transition text-sm shadow-sm" data-dec-mob="${prod.id}">−</button>
          <span class="font-extrabold text-gray-950 text-sm min-w-[20px] text-center" id="qty-lbl-mob-${prod.id}">${qty}</span>
          <button class="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md text-gray-700 font-bold active:scale-90 transition text-sm shadow-sm" data-inc-mob="${prod.id}">+</button>
        `}
      </div>
    `;

    if (!isEsgotado) {
      row.querySelector(`[data-dec-mob="${prod.id}"]`).onclick = () => alterarQuantidadeMovel(prod, -1);
      row.querySelector(`[data-inc-mob="${prod.id}"]`).onclick = () => alterarQuantidadeMovel(prod, 1);
    }

    container.appendChild(row);
  });
}

function alterarQuantidadeMovel(produto, delta) {
  const currentVal = mobileState.cart[produto.id] || 0;
  let passo = produto.unidade === 'KG' ? 0.5 : 1;
  let novoVal = currentVal + (delta * passo);

  if (novoVal < 0) novoVal = 0;
  if (novoVal > produto.quantityEstoque) {
    novoVal = produto.quantityEstoque;
    window.toast('aviso', `Físico limitado a ${produto.quantityEstoque} ${produto.unidade}`);
  }

  if (novoVal === 0) {
    delete mobileState.cart[produto.id];
  } else {
    mobileState.cart[produto.id] = novoVal;
  }

  // Atualiza contador visual instantâneo
  const lbl = document.getElementById(`qty-lbl-mob-${produto.id}`);
  if (lbl) lbl.textContent = novoVal;

  atualizarFooterStatus();
}

// Configura o cabeçalho flutuante da cesta inferior
function atualizarFooterStatus() {
  const selectedKeys = Object.keys(mobileState.cart);
  const count = selectedKeys.length;
  
  const labelCount = document.getElementById('itens-selecionados-count-mobile');
  if (labelCount) {
    labelCount.textContent = `${count} Itens Selecionados`;
  }

  const btnConfirmar = document.getElementById('btn-confirmar-doacao-mobile');
  if (btnConfirmar) {
    btnConfirmar.disabled = count === 0;
  }
}

// Configura abas horizontais no Celular
function configurarTabsMoveis() {
  const tabs = document.querySelectorAll('.item-tab-mobile');
  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      tabs.forEach(t => {
        t.className = "item-tab-mobile bg-white border border-gray-200 text-gray-700 font-medium text-xs px-4 py-2 rounded-full cursor-pointer transition whitespace-nowrap active:scale-95";
      });
      tab.className = "item-tab-mobile bg-[#7B2FBE] text-white font-semibold text-xs px-4 py-2 rounded-full cursor-pointer transition whitespace-nowrap active:scale-95";
      
      const cat = tab.getAttribute('data-category');
      await recarregarProdutosMoveis(cat);
    });
  });
}

// Configura Autocomplete e busca de beneficiário móvel
function configurarBuscaBeneficiarioMobile() {
  const searchInput = document.getElementById('busca-beneficiario-mobile');
  if (!searchInput) return;

  const listContainer = document.createElement('div');
  listContainer.className = 'absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto hidden';
  searchInput.parentElement.style.position = 'relative';
  searchInput.parentElement.appendChild(listContainer);

  let timer;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = searchInput.value.trim();
      if (!q) {
        listContainer.classList.add('hidden');
        return;
      }

      const res = await Api.get(`/api/beneficiarios/busca?q=${encodeURIComponent(q)}`);
      if (res && res.beneficiarios) {
        listContainer.innerHTML = '';
        if (res.beneficiarios.length === 0) {
          listContainer.innerHTML = '<div class="p-3 text-xs text-gray-400 italic">Nenhum Registro.</div>';
          listContainer.classList.remove('hidden');
          return;
        }

        res.beneficiarios.forEach(b => {
          const row = document.createElement('div');
          row.className = 'p-3 hover:bg-purple-50 cursor-pointer flex items-center justify-between border-b last:border-0';
          row.innerHTML = `
            <div class="flex items-center gap-2">
              <img src="${b.avatar}" class="w-7 h-7 rounded-full object-cover" />
              <div class="min-w-0">
                <p class="text-xs font-bold text-gray-900 truncate">${b.name}</p>
                <p class="text-[9px] text-gray-400">CPF: ${b.cpf}</p>
              </div>
            </div>
          `;
          row.addEventListener('click', async () => {
            listContainer.classList.add('hidden');
            searchInput.value = '';
            await selecionarBeneficiarioMobile(b.id);
          });
          listContainer.appendChild(row);
        });
        listContainer.classList.remove('hidden');
      }
    }, 200);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !listContainer.contains(e.target)) {
      listContainer.classList.add('hidden');
    }
  });

  // Botão Trocar Beneficiário do Banner flutuante focando busca
  const btnTrocar = document.getElementById('btn-trocar-ben');
  if (btnTrocar) {
    btnTrocar.addEventListener('click', () => {
      searchInput.scrollIntoView({ behavior: 'smooth' });
      searchInput.focus();
    });
  }
}

async function selecionarBeneficiarioMobile(id) {
  const b = await Api.get(`/api/beneficiarios/${id}`);
  if (b && !b.erro) {
    mobileState.selectedBeneficiary = b;
    
    // Atualiza o Banner fixado do topo
    const nameLabel = document.getElementById('ben-name-mob');
    const avatar = document.getElementById('ben-avatar-mob');
    if (nameLabel) nameLabel.textContent = b.name;
    if (avatar) avatar.src = b.avatar;

    window.toast('sucesso', `Sincronizado: ${b.name} ativo.`);
  }
}

// Configura o painel expansivo (Cesta Bottom Sheet) para o fechamento/confirmação
function configurarBottomSheetMenu() {
  const modal = document.getElementById('bottom-sheet-cesta');
  const btnVerLista = document.getElementById('btn-ver-lista-mobile');
  const btnCloseSheet = document.getElementById('btn-close-sheet');
  const btnConfirmarFooter = document.getElementById('btn-confirmar-doacao-mobile');
  const btnConfirmarSheet = document.getElementById('btn-confirmar-sheet');

  if (!modal) return;

  const abrirSheet = () => {
    renderizarItensBottomSheet();
    modal.showModal();
    // Forçar reflow CSS para animação slideUp suave
    setTimeout(() => {
      modal.style.transform = 'translateY(0)';
    }, 10);
  };

  const fecharSheet = () => {
    modal.style.transform = 'translateY(100%)';
    setTimeout(() => {
      modal.close();
    }, 250);
  };

  if (btnVerLista) btnVerLista.onclick = abrirSheet;
  if (btnCloseSheet) btnCloseSheet.onclick = fecharSheet;

  // Fecha clicando no backdrop escuro
  modal.addEventListener('click', (e) => {
    const rect = modal.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      fecharSheet();
    }
  });

  // Evento das Confirmações Finais de Doação (no flutuante ou na sheet)
  const executarCheckoutMovel = async () => {
    if (!mobileState.selectedBeneficiary) {
      window.toast('erro', 'Defina a família beneficiada primeiro.');
      return;
    }

    const selectedKeys = Object.keys(mobileState.cart);
    const itens = selectedKeys.map(id => ({
      produto_id: id,
      quantidade: mobileState.cart[id]
    }));

    if (itens.length === 0) {
      window.toast('erro', 'Adicione produtos no carrinho.');
      return;
    }

    try {
      const { status, data } = await Api.post('/api/entregas/confirmar', {
        beneficiario_id: mobileState.selectedBeneficiary.id,
        itens
      });

      if (status === 201) {
        window.toast('sucesso', 'Doação confirmada com sucesso!');
        // Reset
        mobileState.cart = {};
        
        // Fechar se tiver aberto
        if (modal.open) fecharSheet();

        // Recarregar
        await recarregarProdutosMoveis();
        atualizarFooterStatus();
      } else {
        window.toast('erro', data.erro);
      }
    } catch (e) {
      window.toast('erro', 'Conexão falhou.');
    }
  };

  if (btnConfirmarFooter) btnConfirmarFooter.onclick = executarCheckoutMovel;
  if (btnConfirmarSheet) btnConfirmarSheet.onclick = executarCheckoutMovel;
}

// Renderiza a lista interna da Cesta do Bottom Sheet
function renderizarItensBottomSheet() {
  const container = document.getElementById('sheet-lista-itens');
  const cotaVal = document.getElementById('sheet-cota-value');
  const cotaBar = document.getElementById('sheet-cota-bar');
  if (!container) return;

  container.innerHTML = '';

  const keys = Object.keys(mobileState.cart);
  if (keys.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-4">Seu carrinho está vazio.</p>`;
    if (cotaVal) cotaVal.textContent = "0%";
    if (cotaBar) cotaBar.style.width = "0%";
    return;
  }

  let projectedCota = mobileState.selectedBeneficiary ? mobileState.selectedBeneficiary.cotaPercent : 0;

  keys.forEach(id => {
    const prod = mobileState.products.find(p => p.id === id);
    if (!prod) return;

    const qty = mobileState.cart[id];
    projectedCota += prod.unidade === 'KG' ? qty * 5 : qty * 3;

    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100';
    row.innerHTML = `
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-bold text-gray-800 truncate">${prod.name}</h4>
        <p class="text-[9px] text-[#16A34A] font-semibold mt-0.5">${qty} ${prod.unidade} Selecionado</p>
      </div>
      <!-- Remover -->
      <button class="text-xs font-bold text-red-500 hover:text-red-750 p-1 active:scale-90 transition cursor-pointer" data-del-sheet="${prod.id}">REMOVER</button>
    `;

    row.querySelector(`[data-del-sheet="${prod.id}"]`).onclick = () => {
      delete mobileState.cart[prod.id];
      
      // tenta resetar o label da tela de trás para sync
      const rearLbl = document.getElementById(`qty-lbl-mob-${prod.id}`);
      if (rearLbl) rearLbl.textContent = '0';

      renderizarItensBottomSheet();
      atualizarFooterStatus();
    };

    container.appendChild(row);
  });

  const finalCota = Math.min(100, Math.round(projectedCota));
  if (cotaVal) cotaVal.textContent = `${finalCota}%`;
  if (cotaBar) {
    cotaBar.style.width = `${finalCota}%`;
    if (finalCota >= 90) cotaBar.className = 'h-full bg-red-500 rounded-full';
    else if (finalCota >= 70) cotaBar.className = 'h-full bg-amber-500 rounded-full';
    else cotaBar.className = 'h-full bg-[#7B2FBE] rounded-full';
  }
}
