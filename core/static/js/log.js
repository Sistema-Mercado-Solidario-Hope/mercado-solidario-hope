// js/log.js - Módulo centralizado de registro de logs/histórico
export function registrarLog(acao, descricao) {
  // Recupera o usuário logado
  let usuario = 'Sistema';
  const userData = localStorage.getItem('ms_user');
  const adminData = localStorage.getItem('ms_admin');
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      usuario = user.nome || user.name || 'Usuário';
    } catch(e) {}
  } else if (adminData) {
    try {
      const admin = JSON.parse(adminData);
      usuario = admin.nome || 'Administrador';
    } catch(e) {}
  }
  
  // Carrega logs existentes
  let logs = [];
  const logsRaw = localStorage.getItem('ms_logs');
  if (logsRaw) {
    try {
      logs = JSON.parse(logsRaw);
    } catch(e) {}
  }
  
  // Adiciona novo log no início (mais recente primeiro)
  logs.unshift({
    data: new Date().toISOString(),
    usuario: usuario,
    acao: acao,
    descricao: descricao
  });
  
  // Mantém no máximo 500 registros
  if (logs.length > 500) logs.pop();
  
  localStorage.setItem('ms_logs', JSON.stringify(logs));
  
  // Dispara evento para atualizar a tela se estiver na aba Histórico
  window.dispatchEvent(new CustomEvent('log-registrado', { detail: { acao, descricao } }));
}