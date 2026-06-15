// Data Storage layer for Mercado Solidário

export const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Ovos (Dúzia)",
    description: "Lote 022 - Val: 15/10",
    category: "Cesta Básica",
    unidade: "UN",
    quantityEstoque: 42,
    lote: "022",
    validade: "15/10",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-2",
    name: "Arroz Agulhinha (Pacote 5kg)",
    description: "Pacote 1kg / 5kg",
    category: "Cesta Básica",
    unidade: "KG",
    quantityEstoque: 120,
    lote: "089",
    validade: "12/12",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-3",
    name: "Óleo de Soja (900ml)",
    description: "Garrafa 900ml",
    category: "Cesta Básica",
    unidade: "UN",
    quantityEstoque: 0,
    lote: "114",
    validade: "30/11",
    esgotado: true,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-4",
    name: "Feijão Carioca Tipo 1",
    description: "Lote 015",
    category: "Cesta Básica",
    unidade: "KG",
    quantityEstoque: 85,
    lote: "015",
    validade: "25/11",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-5",
    name: "Papel Higiênico",
    description: "Pct 4 rolos",
    category: "Higiene",
    unidade: "PK",
    quantityEstoque: 14,
    lote: "305",
    validade: "N/A",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-6",
    name: "Detergente Neutro",
    description: "Frasco 500ml",
    category: "Limpeza",
    unidade: "UN",
    quantityEstoque: 30,
    lote: "012",
    validade: "05/12",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1607006342411-9c140d73a0ef?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-7",
    name: "Leite Integral (Caixa 1L)",
    description: "Lote 410 - Estoque Crítico",
    category: "Cesta Básica",
    unidade: "UN",
    quantityEstoque: 12,
    lote: "410",
    validade: "02/09",
    esgotado: false,
    estoqueCritico: true,
    foto: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-8",
    name: "Feijão Preto Tipo 1 (1kg)",
    description: "Lote 016 - Preto",
    category: "Cesta Básica",
    unidade: "KG",
    quantityEstoque: 85,
    lote: "016",
    validade: "25/11",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-9",
    name: "Frango Desfiado (Cozido)",
    description: "Lote 789 - Congelado",
    category: "Proteína",
    unidade: "KG",
    quantityEstoque: 15,
    lote: "789",
    validade: "12/08",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-10",
    name: "Sardinha em Lata (Coqueiro)",
    description: "Lote 390",
    category: "Proteína",
    unidade: "UN",
    quantityEstoque: 60,
    lote: "390",
    validade: "10/10",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-11",
    name: "Sabonete Glicerina",
    description: "Frasco Líquido 250ml",
    category: "Higiene",
    unidade: "UN",
    quantityEstoque: 110,
    lote: "882",
    validade: "30/12",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1547483238-f400e65ccd56?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-12",
    name: "Fralda Infantil Premium",
    description: "Pct M c/ 24",
    category: "Infantil",
    unidade: "PK",
    quantityEstoque: 8,
    lote: "551",
    validade: "N/A",
    esgotado: false,
    estoqueCritico: true,
    foto: "https://images.unsplash.com/photo-1595244500059-d3ad51020202?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "prod-13",
    name: "Sabão em Pó Omo 1kg",
    description: "Saco 1kg",
    category: "Limpeza",
    unidade: "UN",
    quantityEstoque: 45,
    lote: "119",
    validade: "N/A",
    esgotado: false,
    estoqueCritico: false,
    foto: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=120"
  }
];

export const INITIAL_BENEFICIARIES = [
  {
    id: "ben-1",
    name: "Família Oliveira",
    nis: "12345678901",
    cpf: "123.456.789-01",
    status: "ACTIVE",
    members: 5,
    lastDeliveryDays: 12,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    cotaPercent: 75
  },
  {
    id: "ben-2",
    name: "Família Santos",
    nis: "98765432109",
    cpf: "987.654.321-09",
    status: "ACTIVE",
    members: 3,
    lastDeliveryDays: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    cotaPercent: 30
  },
  {
    id: "ben-3",
    name: "Família Souza",
    nis: "01234567890",
    cpf: "012.345.678-90",
    status: "ACTIVE",
    members: 6,
    lastDeliveryDays: 20,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
    cotaPercent: 15
  },
  {
    id: "ben-4",
    name: "Família Lima",
    nis: "55555555555",
    cpf: "555.555.555-55",
    status: "ACTIVE",
    members: 4,
    lastDeliveryDays: 3,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    cotaPercent: 90
  },
  {
    id: "ben-5",
    name: "Família Costa",
    nis: "22233344455",
    cpf: "222.333.444-55",
    status: "INACTIVE",
    members: 2,
    lastDeliveryDays: 25,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    cotaPercent: 0
  }
];

export const MOCK_USERS_SEED = [
  {
    id: "user-1",
    name: "Maria Silva",
    email: "maria@exemplo.com",
    cpfCnpj: "000.000.000-00",
    phone: "(11) 99999-9999",
    role: "admin",
    senha: "password"
  },
  {
    id: "user-2",
    name: "Gabriel Oliveira",
    email: "operador@mercadosolidario.com.br",
    cpfCnpj: "777.777.777-77",
    phone: "(11) 98888-8888",
    role: "operador",
    senha: "password"
  }
];

export function initLocalStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('ms_products')) {
    localStorage.setItem('ms_products', JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem('ms_beneficiaries')) {
    localStorage.setItem('ms_beneficiaries', JSON.stringify(INITIAL_BENEFICIARIES));
  }
  if (!localStorage.getItem('ms_users_db')) {
    localStorage.setItem('ms_users_db', JSON.stringify(MOCK_USERS_SEED));
  }
  if (!localStorage.getItem('ms_deliveries')) {
    localStorage.setItem('ms_deliveries', JSON.stringify([]));
  }
}

export function getProductsFromStorage() {
  initLocalStorage();
  const prods = localStorage.getItem('ms_products');
  return prods ? JSON.parse(prods) : INITIAL_PRODUCTS;
}

export function saveProductsToStorage(products) {
  localStorage.setItem('ms_products', JSON.stringify(products));
}

export function getBeneficiariesFromStorage() {
  initLocalStorage();
  const bens = localStorage.getItem('ms_beneficiaries');
  return bens ? JSON.parse(bens) : INITIAL_BENEFICIARIES;
}

export function saveBeneficiariesToStorage(bens) {
  localStorage.setItem('ms_beneficiaries', JSON.stringify(bens));
}

export function getUsersFromStorage() {
  initLocalStorage();
  const db = localStorage.getItem('ms_users_db');
  return db ? JSON.parse(db) : MOCK_USERS_SEED;
}

export function saveUsersToStorage(users) {
  localStorage.setItem('ms_users_db', JSON.stringify(users));
}

export function getDeliveriesFromStorage() {
  initLocalStorage();
  const dels = localStorage.getItem('ms_deliveries');
  return dels ? JSON.parse(dels) : [];
}

export function saveDeliveriesToStorage(deliveries) {
  localStorage.setItem('ms_deliveries', JSON.stringify(deliveries));
}
