// Teste para verificar variáveis de ambiente
console.log('🔍 Testando variáveis de ambiente:');
console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);
console.log('MODE:', import.meta.env.MODE);

// Teste de fallback
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://72.60.62.143:4000/api';
console.log('Backend URL final:', backendUrl);

// Teste de URL completa
const calendarUrl = `${backendUrl}/calendar`;
console.log('Calendar URL:', calendarUrl);
