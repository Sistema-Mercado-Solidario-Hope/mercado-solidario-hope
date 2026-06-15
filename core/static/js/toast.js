// Simple Visual Toast Notifications System — Mercado Solidário

export function toast(tipo, mensagem) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';

    // Aplicar posicionamento via estilos inline — evita dependência de utilitários Tailwind
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.maxWidth = '360px';
    container.style.width = '100%';

    // Desktop: bottom-right. Mobile (small widths): top center
    if (window.innerWidth < 768) {
      container.style.top = '16px';
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.right = 'auto';
      container.style.bottom = 'auto';
      container.style.maxWidth = '90%';
    } else {
      container.style.right = '16px';
      container.style.bottom = '16px';
      container.style.left = 'auto';
      container.style.transform = 'none';
    }

    document.body.appendChild(container);
  }

  const toastElement = document.createElement('div');
  
  // Custom icons based on toast level
  let icon = '🔔';
  if (tipo === 'sucesso') icon = '✅';
  if (tipo === 'erro') icon = '❌';
  if (tipo === 'aviso') icon = '⚠️';

  toastElement.className = `toast-notification ${tipo}`;
  toastElement.innerHTML = `
    <span class="text-base leading-none shrink-0">${icon}</span>
    <div class="flex-1 min-w-0">
      <p class="font-medium text-[13px] leading-tight text-gray-800">${mensagem}</p>
    </div>
    <button class="toast-close shrink-0" aria-label="Fechar">&times;</button>
  `;

  // Controlar o fechamento por clique no botão de fachar
  const closeBtn = toastElement.querySelector('.toast-close');
  closeBtn.onclick = () => {
    toastElement.style.opacity = '0';
    toastElement.style.transform = 'translateY(10px) scale(0.98)';
    setTimeout(() => {
      toastElement.remove();
    }, 300);
  };

  container.appendChild(toastElement);

  // Auto-destruição após 3500ms
  setTimeout(() => {
    if (toastElement.parentElement) {
      toastElement.style.opacity = '0';
      toastElement.style.transform = 'translateY(10px) scale(0.98)';
      setTimeout(() => {
        toastElement.remove();
      }, 300);
    }
  }, 3500);
}

// Vincula globalmente de fácil acesso
window.toast = toast;
