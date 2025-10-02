import React from 'react';

const TestEnv: React.FC = () => {
  console.log('🔍 Testando variáveis de ambiente no React:');
  console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
  console.log('NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('MODE:', import.meta.env.MODE);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
  const calendarUrl = `${backendUrl}/calendar`;

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Teste de Variáveis de Ambiente</h3>
      <div className="space-y-2 text-sm">
        <div><strong>VITE_BACKEND_URL:</strong> {import.meta.env.VITE_BACKEND_URL || 'Não definido'}</div>
        <div><strong>Backend URL final:</strong> {backendUrl}</div>
        <div><strong>Calendar URL:</strong> {calendarUrl}</div>
        <div><strong>NODE_ENV:</strong> {import.meta.env.NODE_ENV}</div>
        <div><strong>MODE:</strong> {import.meta.env.MODE}</div>
      </div>
    </div>
  );
};

export default TestEnv;
