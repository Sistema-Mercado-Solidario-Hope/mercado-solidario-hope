// Authentication Operations — Mercado Solidário
import Api from './api.js';

// Utilitários de Máscara de Input (sem bibliotecas externas)
export function aplicarMascaraCPF_CNPJ(value) {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    // CPF: 000.000.000-00
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return clean
      .substring(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
}

export function aplicarMascaraTelefone(value) {
  const clean = value.replace(/\D/g, '');
  // (00) 00000-0000 ou (00) 0000-0000
  if (clean.length > 10) {
    return clean
      .substring(0, 11)
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d{4})$/g, '$1-$2');
  } else if (clean.length > 2) {
    return clean
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{4})(\d{4})$/g, '$1-$2');
  }
  return clean;
}

// Configuração Geral das Telas de Login e Cadastro
document.addEventListener('DOMContentLoaded', () => {
  const redirectUser = (usuario) => {
    if (usuario && (usuario.tipo === 'admin' || usuario.tipo === 'operador' || usuario.tipo === 'colaborador')) {
      window.location.href = './visao-geral-estoque.html';
    } else {
      window.location.href = './home.html';
    }
  };

  // 1. Toggles de exibição de senha
  const passwordToggles = document.querySelectorAll('.toggle-senha');
  passwordToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      const input = parent.querySelector('input');
      const icon = btn.querySelector('i') || btn; // aceita tanto tag i ou próprio botão
      
      if (input.type === 'password') {
        input.type = 'text';
        // Alterna entre olho aberto/fechado
        if (icon.classList.contains('lucide-eye-off')) {
          icon.classList.remove('lucide-eye-off');
          icon.classList.add('lucide-eye');
        } else if (icon.textContent === '👁️') {
          icon.textContent = '🙈';
        }
      } else {
        input.type = 'password';
        if (icon.classList.contains('lucide-eye')) {
          icon.classList.remove('lucide-eye');
          icon.classList.add('lucide-eye-off');
        } else if (icon.textContent === '🙈') {
          icon.textContent = '👁️';
        }
      }
    });
  });

  // 2. Aplicar máscaras nos campos específicos se existirem
  const fieldCpfCnpj = document.querySelector('[data-mask="cpf_cnpj"]');
  if (fieldCpfCnpj) {
    fieldCpfCnpj.addEventListener('input', (e) => {
      e.target.value = aplicarMascaraCPF_CNPJ(e.target.value);
    });
  }

  const fieldPhone = document.querySelector('[data-mask="phone"]');
  if (fieldPhone) {
    fieldPhone.addEventListener('input', (e) => {
      e.target.value = aplicarMascaraTelefone(e.target.value);
    });
  }

  // Helper para criar mensagens de erro em modal centralizado
  const mostrarMensagemErro = (texto) => {
    let overlay = document.getElementById('error-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'error-modal-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '10000';
      overlay.style.transition = 'opacity 0.25s ease';
      
      const modalContainer = document.createElement('div');
      modalContainer.style.background = '#FFFFFF';
      modalContainer.style.borderRadius = '1.5rem';
      modalContainer.style.padding = '2.5rem 2rem';
      modalContainer.style.maxWidth = '400px';
      modalContainer.style.width = '90%';
      modalContainer.style.textAlign = 'center';
      modalContainer.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      modalContainer.style.fontFamily = 'Poppins, sans-serif';
      
      modalContainer.innerHTML = `
        <div style="width: 4rem; height: 4rem; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 2rem; height: 2rem;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; font-family: 'Poppins', sans-serif;">Atenção</h3>
        <p id="error-modal-text" style="color: #4b5563; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1.5rem; font-family: 'Poppins', sans-serif;"></p>
        <button id="error-modal-close-btn" style="background: linear-gradient(135deg, #6900B8 0%, #45007A 100%); color: white; border: none; padding: 0.875rem 1.5rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; width: 100%; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(105, 0, 184, 0.2); font-family: 'Poppins', sans-serif;">
          Fechar
        </button>
      `;
      
      overlay.appendChild(modalContainer);
      document.body.appendChild(overlay);
      
      const closeBtn = overlay.querySelector('#error-modal-close-btn');
      closeBtn.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 250);
      });
    }
    
    document.getElementById('error-modal-text').textContent = texto;
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    overlay.offsetHeight;
    overlay.style.opacity = '1';
  };

  // Helper para criar mensagens de sucesso em modal centralizado
  const mostrarMensagemSucesso = (texto) => {
    let overlay = document.getElementById('success-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'success-modal-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '10000';
      overlay.style.transition = 'opacity 0.25s ease';
      
      const modalContainer = document.createElement('div');
      modalContainer.style.background = '#FFFFFF';
      modalContainer.style.borderRadius = '1.5rem';
      modalContainer.style.padding = '2.5rem 2rem';
      modalContainer.style.maxWidth = '400px';
      modalContainer.style.width = '90%';
      modalContainer.style.textAlign = 'center';
      modalContainer.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      modalContainer.style.fontFamily = 'Poppins, sans-serif';
      
      modalContainer.innerHTML = `
        <div style="width: 4rem; height: 4rem; background: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 2rem; height: 2rem;">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; font-family: 'Poppins', sans-serif;">Sucesso</h3>
        <p id="success-modal-text" style="color: #4b5563; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1.5rem; font-family: 'Poppins', sans-serif;"></p>
        <button id="success-modal-close-btn" style="background: linear-gradient(135deg, #6900B8 0%, #45007A 100%); color: white; border: none; padding: 0.875rem 1.5rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; width: 100%; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(105, 0, 184, 0.2); font-family: 'Poppins', sans-serif;">
          Ok
        </button>
      `;
      
      overlay.appendChild(modalContainer);
      document.body.appendChild(overlay);
      
      const closeBtn = overlay.querySelector('#success-modal-close-btn');
      closeBtn.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 250);
      });
    }
    
    document.getElementById('success-modal-text').textContent = texto;
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    overlay.offsetHeight;
    overlay.style.opacity = '1';
  };

  // 3. SUBMIT DO FORMULÁRIO DE LOGIN
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const identificadorInput = document.getElementById('identificador');
      const senhaInput = document.getElementById('senha');
      const btnSubmit = formLogin.querySelector('button[type="submit"]');

      // Validar inputs vazios
      if (!identificadorInput.value.trim() || !senhaInput.value) {
        mostrarMensagemErro("Por favor, preencha todos os campos.");
        return;
      }

      // Adiciona estado de carregamento ao botão
      const btnOriginalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = 'Entrando...';

      let success = false;
      try {
        const { status, data } = await Api.post('/api/auth/login', {
          identificador: identificadorInput.value,
          senha: senhaInput.value
        });

        if (status === 200 && data.token) {
          success = true;
          localStorage.setItem('ms_token', data.token);
          localStorage.setItem('ms_user', JSON.stringify(data.usuario));
          
          mostrarMensagemSucesso(`Login realizado com sucesso! Bem-vindo(a) de volta, ${data.usuario.nome || 'usuário'}.`);
          
          setTimeout(() => {
            redirectUser(data.usuario);
          }, 1200);
        } else {
          mostrarMensagemErro(data.erro || "Combinação incorreta de login/senha.");
        }
      } catch (err) {
        mostrarMensagemErro("Ocorreu um erro de rede. Verifique seu sinal e tente novamente.");
      } finally {
        if (!success) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = btnOriginalText;
        } else {
          btnSubmit.innerHTML = 'Conectado!';
        }
      }
    });

    // Login com Google e Facebook simulado
    const btnGoogle = document.getElementById('btn-google');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', () => {
        window.toast('aviso', 'Simulando login seguro via Google...');
        setTimeout(() => {
          localStorage.setItem('ms_token', 'GOOGLE_MOCK_JWT_ACTIVE');
          localStorage.setItem('ms_user', JSON.stringify({ id: 'oauth-g', nome: 'Usuário Google', tipo: 'operador' }));
          window.toast('sucesso', 'Conectado com o Google!');
          setTimeout(() => { redirectUser({ tipo: 'operador' }); }, 800);
        }, 1000);
      });
    }

    const btnFacebook = document.getElementById('btn-facebook');
    if (btnFacebook) {
      btnFacebook.addEventListener('click', () => {
        window.toast('aviso', 'Simulando login seguro via Facebook...');
        setTimeout(() => {
          localStorage.setItem('ms_token', 'FACEBOOK_MOCK_JWT_ACTIVE');
          localStorage.setItem('ms_user', JSON.stringify({ id: 'oauth-fb', nome: 'Usuário Facebook', tipo: 'operador' }));
          window.toast('sucesso', 'Conectado com o Facebook!');
          setTimeout(() => { redirectUser({ tipo: 'operador' }); }, 800);
        }, 1000);
      });
    }
  }

  // 4. SUBMIT DO FORMULÁRIO DE CADASTRO
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nomeCompleto = document.getElementById('nome_completo').value.trim();
      const email = document.getElementById('email').value.trim();
      const cpfCnpj = document.getElementById('cpf_cnpj').value.trim();
      const telefone = document.getElementById('telefone').value.trim();
      const senha = document.getElementById('senha').value;
      const confirmarSenha = document.getElementById('confirmar_senha').value;
      const termosCheck = document.getElementById('termos');
      const btnSubmit = formCadastro.querySelector('button[type="submit"]');

      // Validar campos
      if (!nomeCompleto || !email || !cpfCnpj || !telefone || !senha || !confirmarSenha) {
        mostrarMensagemErro("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      if (senha.length < 8) {
        mostrarMensagemErro("A senha de acesso precisa conter o mínimo de 8 caracteres.");
        return;
      }

      if (senha !== confirmarSenha) {
        mostrarMensagemErro("Os campos de senha e confirmação devem ser idênticos.");
        return;
      }

      if (termosCheck && !termosCheck.checked) {
        mostrarMensagemErro("Você precisa marcar a caixa aceitando os Termos de Uso e Política de Privacidade.");
        return;
      }

      // Estado carregando
      const btnOriginalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `Criando Conta...`;

      try {
        const { status, data } = await Api.post('/api/auth/cadastro', {
          nome_completo: nomeCompleto,
          email,
          cpf_cnpj: cpfCnpj,
          telefone,
          senha,
          confirmar_senha: confirmarSenha
        });

        if (status === 201 && data.token) {
          localStorage.setItem('ms_token', data.token);
          localStorage.setItem('ms_user', JSON.stringify(data.usuario));
          
          if (window.toast) {
            window.toast('sucesso', 'Conta cadastrada com sucesso! Bem-vindo.');
          }
          
          setTimeout(() => {
            redirectUser(data.usuario);
          }, 800);
        } else {
          mostrarMensagemErro(data.erro || "Consulte suas credenciais de preenchimento.");
        }
      } catch (err) {
        mostrarMensagemErro("Erro ao cadastrar. Tente novamente em instantes.");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = btnOriginalText;
      }
    });
  }
  // 5. ESQUECEU A SENHA
  const btnEsqueceu = document.getElementById('btn-esqueceu');
  if (btnEsqueceu) {
    btnEsqueceu.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarMensagemSucesso('Entre em contato com o suporte para recuperar sua senha.');
    });
  }
});
