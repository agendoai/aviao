import React, { useEffect } from 'react';
import { buildApiUrl } from '@/config/api';

const TestApiUrl: React.FC = () => {
  useEffect(() => {
    // console.log('🧪 TESTE DA CONFIGURAÇÃO DA API');
    // console.log('✅ import.meta.env completo:', import.meta.env);
    // console.log('✅ Todas as chaves:', Object.keys(import.meta.env));
    // console.log('✅ VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
    // console.log('✅ Tipo:', typeof import.meta.env.VITE_BACKEND_URL);
    // console.log('✅ Existe?', 'VITE_BACKEND_URL' in import.meta.env);
    // console.log('✅ buildApiUrl(""):', buildApiUrl(''));
    
    // Testar URLs
    // console.log('🎯 URLs de teste:');
    // console.log('Login:', buildApiUrl('/api/auth/login'));
    // console.log('Register:', buildApiUrl('/api/auth/register'));
    // console.log('Users:', buildApiUrl('/api/users'));
    
    // Fazer uma chamada de teste
    const testUrl = buildApiUrl('/api/auth/login');
    // console.log('🔍 Fazendo chamada de teste para:', testUrl);
    
    fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' })
    })
    .then(res => {
      // console.log('🔍 Resposta da API:', res.status, res.statusText);
      // console.log('🔍 URL usada:', res.url);
    })
    .catch(error => {
      console.error('❌ Erro na chamada:', error);
    });
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '10px' }}>
      <h3>🧪 Teste da Configuração da API</h3>
      <p>Abra o console (F12) para ver os logs de teste</p>
      <p>Verifique se as URLs estão sendo construídas corretamente</p>
      <p><strong>VITE_BACKEND_URL atual:</strong> {import.meta.env.VITE_BACKEND_URL || 'NÃO DEFINIDO'}</p>
      <p><strong>Todas as variáveis:</strong> {JSON.stringify(import.meta.env, null, 2)}</p>
    </div>
  );
};

export default TestApiUrl;
