
// Banco de dados de distâncias e tempos de voo entre aeroportos
interface Airport {
  code: string;
  name: string;
  city: string;
}

interface FlightRoute {
  from: string;
  to: string;
  distance: number; // em km
  flightTime: number; // em horas
}

export const airports: Airport[] = [
  { code: 'ABC', name: 'Araçatuba', city: 'Araçatuba' },
  { code: 'GRU', name: 'São Paulo (Guarulhos)', city: 'São Paulo' },
  { code: 'CGH', name: 'São Paulo (Congonhas)', city: 'São Paulo' },
  { code: 'VGF', name: 'Mato Grosso (Várzea Grande)', city: 'Cuiabá' },
  { code: 'CGB', name: 'Cuiabá', city: 'Cuiabá' },
  { code: 'BSB', name: 'Brasília', city: 'Brasília' },
  { code: 'SDU', name: 'Rio de Janeiro (Santos Dumont)', city: 'Rio de Janeiro' },
  { code: 'GIG', name: 'Rio de Janeiro (Galeão)', city: 'Rio de Janeiro' },
];

// Banco de dados de rotas com distâncias e tempos reais
const flightRoutes: FlightRoute[] = [
  // De Araçatuba
  { from: 'ABC', to: 'GRU', distance: 520, flightTime: 1.5 },
  { from: 'ABC', to: 'CGH', distance: 520, flightTime: 1.5 },
  { from: 'ABC', to: 'VGF', distance: 380, flightTime: 1.2 },
  { from: 'ABC', to: 'CGB', distance: 380, flightTime: 1.2 },
  { from: 'ABC', to: 'BSB', distance: 750, flightTime: 2.0 },
  { from: 'ABC', to: 'SDU', distance: 680, flightTime: 1.8 },
  { from: 'ABC', to: 'GIG', distance: 700, flightTime: 1.9 },
  
  // De São Paulo
  { from: 'GRU', to: 'ABC', distance: 520, flightTime: 1.5 },
  { from: 'GRU', to: 'VGF', distance: 880, flightTime: 2.2 },
  { from: 'GRU', to: 'CGB', distance: 880, flightTime: 2.2 },
  { from: 'GRU', to: 'BSB', distance: 870, flightTime: 2.1 },
  { from: 'GRU', to: 'SDU', distance: 360, flightTime: 1.0 },
  { from: 'GRU', to: 'GIG', distance: 360, flightTime: 1.0 },
  
  { from: 'CGH', to: 'ABC', distance: 520, flightTime: 1.5 },
  { from: 'CGH', to: 'VGF', distance: 880, flightTime: 2.2 },
  { from: 'CGH', to: 'CGB', distance: 880, flightTime: 2.2 },
  { from: 'CGH', to: 'BSB', distance: 870, flightTime: 2.1 },
  { from: 'CGH', to: 'SDU', distance: 360, flightTime: 1.0 },
  { from: 'CGH', to: 'GIG', distance: 360, flightTime: 1.0 },
  
  // De Mato Grosso
  { from: 'VGF', to: 'ABC', distance: 380, flightTime: 1.2 },
  { from: 'VGF', to: 'GRU', distance: 880, flightTime: 2.2 },
  { from: 'VGF', to: 'CGH', distance: 880, flightTime: 2.2 },
  { from: 'VGF', to: 'BSB', distance: 470, flightTime: 1.3 },
  { from: 'VGF', to: 'SDU', distance: 1050, flightTime: 2.5 },
  { from: 'VGF', to: 'GIG', distance: 1050, flightTime: 2.5 },
  
  { from: 'CGB', to: 'ABC', distance: 380, flightTime: 1.2 },
  { from: 'CGB', to: 'GRU', distance: 880, flightTime: 2.2 },
  { from: 'CGB', to: 'CGH', distance: 880, flightTime: 2.2 },
  { from: 'CGB', to: 'BSB', distance: 470, flightTime: 1.3 },
  { from: 'CGB', to: 'SDU', distance: 1050, flightTime: 2.5 },
  { from: 'CGB', to: 'GIG', distance: 1050, flightTime: 2.5 },
  
  // De Brasília
  { from: 'BSB', to: 'ABC', distance: 750, flightTime: 2.0 },
  { from: 'BSB', to: 'GRU', distance: 870, flightTime: 2.1 },
  { from: 'BSB', to: 'CGH', distance: 870, flightTime: 2.1 },
  { from: 'BSB', to: 'VGF', distance: 470, flightTime: 1.3 },
  { from: 'BSB', to: 'CGB', distance: 470, flightTime: 1.3 },
  { from: 'BSB', to: 'SDU', distance: 930, flightTime: 2.3 },
  { from: 'BSB', to: 'GIG', distance: 930, flightTime: 2.3 },
  
  // Do Rio de Janeiro
  { from: 'SDU', to: 'ABC', distance: 680, flightTime: 1.8 },
  { from: 'SDU', to: 'GRU', distance: 360, flightTime: 1.0 },
  { from: 'SDU', to: 'CGH', distance: 360, flightTime: 1.0 },
  { from: 'SDU', to: 'VGF', distance: 1050, flightTime: 2.5 },
  { from: 'SDU', to: 'CGB', distance: 1050, flightTime: 2.5 },
  { from: 'SDU', to: 'BSB', distance: 930, flightTime: 2.3 },
  { from: 'SDU', to: 'GIG', distance: 40, flightTime: 0.3 },
  
  { from: 'GIG', to: 'ABC', distance: 700, flightTime: 1.9 },
  { from: 'GIG', to: 'GRU', distance: 360, flightTime: 1.0 },
  { from: 'GIG', to: 'CGH', distance: 360, flightTime: 1.0 },
  { from: 'GIG', to: 'VGF', distance: 1050, flightTime: 2.5 },
  { from: 'GIG', to: 'CGB', distance: 1050, flightTime: 2.5 },
  { from: 'GIG', to: 'BSB', distance: 930, flightTime: 2.3 },
  { from: 'GIG', to: 'SDU', distance: 40, flightTime: 0.3 },
];

export const getFlightTime = (fromCity: string, toCity: string): number => {
  // Extrair código do aeroporto (últimas 3 letras entre parênteses)
  const fromCode = extractAirportCode(fromCity);
  const toCode = extractAirportCode(toCity);
  
  const route = flightRoutes.find(r => 
    (r.from === fromCode && r.to === toCode) ||
    (r.from === toCode && r.to === fromCode)
  );
  
  return route ? route.flightTime : 2.0; // Default 2 horas se não encontrar
};

export const getDistance = (fromCity: string, toCity: string): number => {
  const fromCode = extractAirportCode(fromCity);
  const toCode = extractAirportCode(toCity);
  
  const route = flightRoutes.find(r => 
    (r.from === fromCode && r.to === toCode) ||
    (r.from === toCode && r.to === fromCode)
  );
  
  return route ? route.distance : 500; // Default 500km se não encontrar
};

const extractAirportCode = (cityName: string): string => {
  const match = cityName.match(/\(([A-Z]{3})\)$/);
  return match ? match[1] : 'ABC'; // Default para Araçatuba
};

export const calculateArrivalTime = (departureTime: string, flightDuration: number, departureDate?: string): { time: string; date: string } => {
  const baseDate = departureDate || '2024-01-01';
  const departureDateTime = new Date(`${baseDate}T${departureTime}`);
  
  // Adicionar tempo de voo em horas
  const arrivalDateTime = new Date(departureDateTime.getTime() + (flightDuration * 60 * 60 * 1000));
  
  return {
    time: arrivalDateTime.toTimeString().slice(0, 5),
    date: arrivalDateTime.toISOString().split('T')[0]
  };
};

export const formatFlightTime = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m > 0 ? ` ${m}min` : ''}`;
};

export const suggestDestinations = (query: string): Airport[] => {
  if (!query) return airports;
  
  const lowercaseQuery = query.toLowerCase();
  return airports.filter(airport => 
    airport.city.toLowerCase().includes(lowercaseQuery) ||
    airport.name.toLowerCase().includes(lowercaseQuery) ||
    airport.code.toLowerCase().includes(lowercaseQuery)
  );
};
