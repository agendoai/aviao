// Configuração centralizada de chaves de API
export const API_KEYS = {
  // API AISWEB (DECEA) - Oficial brasileira
  AISWEB: {
    URL: 'https://aisweb.decea.mil.br/api',
    KEY: process.env.AISWEB_API_KEY || '2084251695',
    PASS: process.env.AISWEB_API_PASS || 'c406b683-631a-11f0-a1fe-0050569ac2e1',
    // Chave de teste (remover em produção)
    FALLBACK_KEY: 'test_key_here'
  },
  
  // API Asaas (Pagamentos)
  ASAAS: {
    KEY: process.env.ASAAS_API_KEY || '',
    WEBHOOK_TOKEN: process.env.ASAAS_WEBHOOK_TOKEN || ''
  }
};

// Função para verificar se uma API está configurada
export function isAPIKeyConfigured(apiName: keyof typeof API_KEYS): boolean {
  const api = API_KEYS[apiName];
  if (apiName === 'AISWEB') {
    return !!(api.KEY && api.PASS && api.KEY !== 'test_key_here');
  }
  return !!(api.KEY && api.KEY !== 'test_key_here');
}

// Função para obter chave de API com fallback
export function getAPIKey(apiName: keyof typeof API_KEYS): string {
  const api = API_KEYS[apiName];
  return api.KEY || api.FALLBACK_KEY || '';
}

// Função para obter credenciais AISWEB
export function getAISWEBCredentials(): { key: string; pass: string } {
  const api = API_KEYS.AISWEB;
  return {
    key: api.KEY || '',
    pass: api.PASS || ''
  };
}
