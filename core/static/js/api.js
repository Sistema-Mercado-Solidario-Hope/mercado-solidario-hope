// API Layer — Mercado Solidário
import { 
  getProductsFromStorage, 
  saveProductsToStorage, 
  getBeneficiariesFromStorage, 
  saveBeneficiariesToStorage,
  getUsersFromStorage, 
  saveUsersToStorage,
  getDeliveriesFromStorage,
  saveDeliveriesToStorage
} from './data.js';

// URL base de produção ou homologação (relativo ao mesmo host no Django)
const API_BASE = '';

const Api = {
  headers() {
    const token = localStorage.getItem('ms_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  },

  // Suporte a simulação local caso a API não esteja acessível
  isSimulationActive() {
    return false; // Desativa a simulação para usar a API Django real
  },

  async get(endpoint) {
    if (this.isSimulationActive()) {
      return this.simulateGet(endpoint);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { headers: this.headers() });
      if (res.status === 401) return this.logout();
      return res.json();
    } catch (e) {
      console.warn("Fallback para simulação por falha de conexão física de API:", e);
      return this.simulateGet(endpoint);
    }
  },

  async post(endpoint, body) {
    if (this.isSimulationActive()) {
      return this.simulatePost(endpoint, body);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body)
      });
      if (res.status === 401) {
        this.logout();
        return { status: 401, data: { erro: "Não autorizado" } };
      }
      return { status: res.status, data: await res.json() };
    } catch (e) {
      console.warn("Fallback para simulação por falha de conexão física de API:", e);
      return this.simulatePost(endpoint, body);
    }
  },

  async patch(endpoint, body) {
    if (this.isSimulationActive()) {
      return this.simulatePatch(endpoint, body);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: this.headers(),
        body: JSON.stringify(body)
      });
      if (res.status === 401) {
        this.logout();
        return { status: 401, data: { erro: "Não autorizado" } };
      }
      return { status: res.status, data: await res.json() };
    } catch (e) {
      console.warn("Fallback para simulação por falha de conexão física de API:", e);
      return this.simulatePatch(endpoint, body);
    }
  },

  async delete(endpoint) {
    if (this.isSimulationActive()) {
      return { status: 200, data: { sucesso: true } };
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: this.headers()
      });
      if (res.status === 401) {
        this.logout();
        return { status: 401, data: { erro: "Não autorizado" } };
      }
      return { status: res.status, data: await res.json() };
    } catch (e) {
      console.error(e);
      return { status: 500, data: { erro: "Erro de conexão" } };
    }
  },

  logout() {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_user');
    window.location.href = './login.html';
  },

  // --- MÉTODOS DE SIMULAÇÃO DE BACKEND ---

  simulateGet(endpoint) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // GET /api/estoque/produtos
        if (endpoint.startsWith('/api/estoque/produtos')) {
          const url = new URL(endpoint, 'http://localhost');
          const categoria = url.searchParams.get('categoria');
          let produtos = getProductsFromStorage();
          
          if (categoria) {
            // Conversão de termos livres de busca de categoria
            const normalCat = categoria.toLowerCase().replace('_', ' ');
            produtos = produtos.filter(p => p.category.toLowerCase() === normalCat);
          }
          resolve({ produtos });
          return;
        }

        // GET /api/beneficiarios/busca?q={termo}
        if (endpoint.startsWith('/api/beneficiarios/busca')) {
          const url = new URL(endpoint, 'http://localhost');
          const q = (url.searchParams.get('q') || '').toLowerCase().trim();
          const list = getBeneficiariesFromStorage();
          
          if (!q) {
            resolve({ beneficiarios: list });
            return;
          }

          const filtered = list.filter(b => 
            b.name.toLowerCase().includes(q) || 
            b.nis.replace(/\D/g, '').includes(q.replace(/\D/g, '')) || 
            b.cpf.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
          );
          resolve({ beneficiarios: filtered });
          return;
        }

        // GET /api/beneficiarios/:id
        if (endpoint.startsWith('/api/beneficiarios/')) {
          const id = endpoint.split('/').pop();
          const list = getBeneficiariesFromStorage();
          const beneficiary = list.find(b => b.id === id);
          if (beneficiary) {
            resolve({ 
              ...beneficiary, 
              elegivel: beneficiary.status === 'ACTIVE' 
            });
          } else {
            resolve({ erro: 'Beneficiário não encontrado' });
          }
          return;
        }

        resolve({ erro: "Rota não implementada na simulação" });
      }, 150);
    });
  },

  simulatePost(endpoint, body) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // POST /api/auth/login
        if (endpoint === '/api/auth/login') {
          const { identificador, senha } = body;
          const users = getUsersFromStorage();
          
          const user = users.find(u => 
            (u.email === identificador || u.cpfCnpj.replace(/\D/g, '') === identificador.replace(/\D/g, '')) && 
            u.senha === senha
          );

          if (user) {
            // Gerar token mock simples
            const mockToken = "JWT_MOCK_TOKEN_" + Math.random().toString(36).substring(2);
            resolve({
              status: 200,
              data: {
                token: mockToken,
                usuario: {
                  id: user.id,
                  nome: user.name,
                  tipo: user.role || "operador"
                }
              }
            });
          } else {
            resolve({
              status: 401,
              data: { erro: "Credenciais inválidas. Para testar use: operador@mercadosolidario.com.br / password" }
            });
          }
          return;
        }

        // POST /api/auth/cadastro
        if (endpoint === '/api/auth/cadastro') {
          const { nome_completo, email, cpf_cnpj, telefone, senha, confirmar_senha } = body;
          const users = getUsersFromStorage();

          if (users.some(u => u.email === email)) {
            resolve({
              status: 409,
              data: { erro: "E-mail ou CPF já cadastrado" }
            });
            return;
          }

          if (senha !== confirmar_senha) {
            resolve({
              status: 422,
              data: { erro: "As senhas não conferem" }
            });
            return;
          }

          const newUser = {
            id: "user-" + (users.length + 1),
            name: nome_completo,
            email,
            cpfCnpj: cpf_cnpj,
            phone: telefone,
            role: "operador",
            senha
          };

          users.push(newUser);
          saveUsersToStorage(users);

          const mockToken = "JWT_MOCK_TOKEN_" + Math.random().toString(36).substring(2);
          resolve({
            status: 201,
            data: {
              token: mockToken,
              usuario: {
                id: newUser.id,
                nome: newUser.name,
                tipo: newUser.role
              }
            }
          });
          return;
        }

        // POST /api/entregas/confirmar
        if (endpoint === '/api/entregas/confirmar') {
          const { beneficiario_id, itens } = body;
          const bens = getBeneficiariesFromStorage();
          const products = getProductsFromStorage();
          const deliveries = getDeliveriesFromStorage();

          const beneficiary = bens.find(b => b.id === beneficiario_id);
          if (!beneficiary) {
            resolve({
              status: 422,
              data: { erro: "Beneficiário não encontrado" }
            });
            return;
          }

          if (beneficiary.status !== 'ACTIVE') {
            resolve({
              status: 422,
              data: { erro: "Beneficiário inativo" }
            });
            return;
          }

          // Verificar estoque para cada produto e descontar
          for (const item of itens) {
            const prod = products.find(p => p.id === item.produto_id);
            if (!prod) {
              resolve({
                status: 422,
                data: { erro: `Produto ${item.produto_id} não encontrado` }
              });
              return;
            }
            if (prod.quantityEstoque < item.quantidade) {
              resolve({
                status: 422,
                data: { erro: `Item ${prod.name} esgotado ou sem estoque suficiente.` }
              });
              return;
            }
          }

          // Descontar estoque na simulação
          itens.forEach(item => {
            const prod = products.find(p => p.id === item.produto_id);
            prod.quantityEstoque -= item.quantidade;
            if (prod.quantityEstoque <= 0) {
              prod.quantityEstoque = 0;
              prod.esgotado = true;
            }
            if (prod.quantityEstoque <= 12) {
              prod.estoqueCritico = true;
            }
          });
          saveProductsToStorage(products);

          // Atualizar o percentual da cota do beneficiário
          beneficiary.cotaPercent = Math.min(100, beneficiary.cotaPercent + 15);
          beneficiary.lastDeliveryDays = 0;
          saveBeneficiariesToStorage(bens);

          // Registrar entrega
          const newDelivery = {
            id: "del-" + (deliveries.length + 1),
            data: new Date().toISOString(),
            beneficiario: beneficiary.name,
            total_itens: itens.reduce((acc, curr) => acc + curr.quantidade, 0),
            itens: itens.map(i => {
              const p = products.find(prod => prod.id === i.produto_id);
              return { nome: p ? p.name : i.produto_id, quantidade: i.quantidade };
            })
          };

          deliveries.push(newDelivery);
          saveDeliveriesToStorage(deliveries);

          resolve({
            status: 201,
            data: { entrega: newDelivery }
          });
          return;
        }

        resolve({ status: 404, data: { erro: "Rota POST não implementada" } });
      }, 150);
    });
  },

  simulatePatch(endpoint, body) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // PATCH /api/estoque/produtos/:id/quantidade
        if (endpoint.startsWith('/api/estoque/produtos/') && endpoint.endsWith('/quantidade')) {
          const parts = endpoint.split('/');
          const id = parts[parts.length - 2];
          const { quantidade } = body;
          const products = getProductsFromStorage();
          const prod = products.find(p => p.id === id);

          if (prod) {
            prod.quantityEstoque = Math.max(0, quantidade);
            prod.esgotado = prod.quantityEstoque === 0;
            prod.estoqueCritico = !prod.esgotado && prod.quantityEstoque <= 12;
            saveProductsToStorage(products);
            resolve({
              status: 200,
              data: { produto: { id: prod.id, quantidade_estoque: prod.quantityEstoque } }
            });
          } else {
            resolve({
              status: 404,
              data: { erro: "Produto não encontrado" }
            });
          }
          return;
        }

        resolve({ status: 404, data: { erro: "Rota PATCH não implementada" } });
      }, 150);
    });
  }
};

export default Api;
export { Api };

if (typeof window !== 'undefined') {
  window.Api = Api;
}

