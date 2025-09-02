// Teste da configuração da API
console.log('🔍 Testando configuração da API...');

// Simular variável de ambiente
process.env.VITE_BACKEND_URL = "http://72.60.62.143:4000";

// Simular import.meta.env
const importMetaEnv = {
  VITE_BACKEND_URL: "http://72.60.62.143:4000"
};

// Simular a função buildApiUrl
const buildApiUrl = (endpoint) => {
  const baseUrl = importMetaEnv.VITE_BACKEND_URL || '/api';
  return `${baseUrl}${endpoint}`;
};

// Testes
console.log('✅ VITE_BACKEND_URL:', importMetaEnv.VITE_BACKEND_URL);
console.log('✅ buildApiUrl("/auth"):', buildApiUrl('/auth'));
console.log('✅ buildApiUrl("/shared-missions"):', buildApiUrl('/shared-missions'));
console.log('✅ buildApiUrl("/bookings"):', buildApiUrl('/bookings'));

console.log('\n🎯 URLs finais:');
console.log('🔐 Login:', buildApiUrl('/auth/login'));
console.log('✈️ Missões:', buildApiUrl('/shared-missions'));
console.log('📅 Calendário:', buildApiUrl('/calendar'));
