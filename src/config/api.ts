// Configuração centralizada da API
export const API_CONFIG = {
  // URL base do backend
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  
  // Endpoints específicos
  ENDPOINTS: {
    CALENDAR: '/api/calendar',
    AIRPORTS_COORDS: '/api/airports/coords',
    AIRCRAFTS: '/api/aircrafts',
    BOOKINGS: '/api/bookings',
    PAYMENTS: '/api/payments',
    USERS: '/api/users',
    ADMIN: '/api/admin',
    WEBHOOKS: '/api/webhooks',
  },
  
  // URLs completas
  get CALENDAR_URL() {
    return `${this.BACKEND_URL}${this.ENDPOINTS.CALENDAR}`;
  },
  
  get AIRPORTS_COORDS_URL() {
    return `${this.BACKEND_URL}${this.ENDPOINTS.AIRPORTS_COORDS}`;
  },
  
  get AIRCRAFTS_URL() {
    return `${this.BACKEND_URL}${this.ENDPOINTS.AIRCRAFTS}`;
  },
  
  get BOOKINGS_URL() {
    return `${this.BACKEND_URL}${this.ENDPOINTS.BOOKINGS}`;
  },
  
  get PAYMENTS_URL() {
    return `${this.BACKEND_URL}${this.ENDPOINTS.PAYMENTS}`;
  },
  
  get USERS_URL() {
    return `${this.BACKEND_URL}${this.ENDPOINTS.USERS}`;
  },
  
  get ADMIN_URL() {
    return `${this.BACKEND_URL}${this.ENDPOINTS.ADMIN}`;
  },
  
  get WEBHOOKS_URL() {
    return `${this.BACKEND_URL}${this.ENDPOINTS.WEBHOOKS}`;
  },
};

// Função buildApiUrl para manter compatibilidade com código existente
export const buildApiUrl = (endpoint: string): string => {
  // Remove /api se já estiver presente no endpoint
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  return `${API_CONFIG.BACKEND_URL}${cleanEndpoint}`;
};

// Função para debug das configurações
export const debugApiConfig = () => {
  console.log('🔧 API Config Debug:');
  console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
  console.log('BACKEND_URL:', API_CONFIG.BACKEND_URL);
  console.log('CALENDAR_URL:', API_CONFIG.CALENDAR_URL);
  console.log('AIRPORTS_COORDS_URL:', API_CONFIG.AIRPORTS_COORDS_URL);
};

// Exportar configuração padrão
export default API_CONFIG;
