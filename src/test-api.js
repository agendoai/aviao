// Teste da configuração da API
console.log('🔍 TESTE DA CONFIGURAÇÃO DA API');

// Simular import.meta.env
const importMetaEnv = {
  VITE_BACKEND_URL: "http://72.60.62.143:4000"
};

console.log('✅ VITE_BACKEND_URL:', importMetaEnv.VITE_BACKEND_URL);

// Simular a função buildApiUrl
const buildApiUrl = (endpoint) => {
  const baseUrl = importMetaEnv.VITE_BACKEND_URL || '/api';
  const finalUrl = `${baseUrl}${endpoint}`;
  console.log('🔍 buildApiUrl:', { endpoint, baseUrl, finalUrl });
  return finalUrl;
};

// Testes
console.log('🎯 Testando URLs:');
console.log('Login:', buildApiUrl('/auth/login'));
console.log('Register:', buildApiUrl('/auth/register'));
console.log('Users:', buildApiUrl('/users'));

console.log('\n✅ Se tudo estiver funcionando, as URLs devem ser:');
console.log('http://72.60.62.143:4000/auth/login');
console.log('http://72.60.62.143:4000/auth/register');
console.log('http://72.60.62.143:4000/users');
