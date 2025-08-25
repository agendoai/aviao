// Função para buscar aeroportos usando base local
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000/api';

export interface Airport {
  icao: string;
  iata?: string;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Base de dados de aeroportos brasileiros (coordenadas oficiais verificadas)
const BRAZILIAN_AIRPORTS: Airport[] = [
  // São Paulo
  { icao: 'SBAU', iata: 'AQA', name: 'Araçatuba', city: 'Araçatuba', state: 'SP', country: 'BR', latitude: -21.1411, longitude: -50.4247 },
  { icao: 'SBSP', iata: 'CGH', name: 'Congonhas', city: 'São Paulo', state: 'SP', country: 'BR', latitude: -23.6273, longitude: -46.6566 },
  { icao: 'SBGR', iata: 'GRU', name: 'Guarulhos', city: 'São Paulo', state: 'SP', country: 'BR', latitude: -23.4356, longitude: -46.4731 },
  { icao: 'SBKP', iata: 'VCP', name: 'Viracopos', city: 'Campinas', state: 'SP', country: 'BR', latitude: -23.0074, longitude: -47.1345 },
  { icao: 'SBBS', iata: 'BAU', name: 'Bauru', city: 'Bauru', state: 'SP', country: 'BR', latitude: -22.3450, longitude: -49.0538 },
  { icao: 'SBRP', iata: 'RAO', name: 'Ribeirão Preto', city: 'Ribeirão Preto', state: 'SP', country: 'BR', latitude: -21.1344, longitude: -47.7742 },
  { icao: 'SBJD', iata: 'JDF', name: 'Jundiaí', city: 'Jundiaí', state: 'SP', country: 'BR', latitude: -23.1808, longitude: -46.9444 },
  { icao: 'SBSJ', iata: 'SJK', name: 'São José dos Campos', city: 'São José dos Campos', state: 'SP', country: 'BR', latitude: -23.2283, longitude: -45.8628 },
  
  // Rio de Janeiro
  { icao: 'SBRJ', iata: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro', state: 'RJ', country: 'BR', latitude: -22.9104, longitude: -43.1631 },
  { icao: 'SBGL', iata: 'GIG', name: 'Galeão', city: 'Rio de Janeiro', state: 'RJ', country: 'BR', latitude: -22.8089, longitude: -43.2500 },
  { icao: 'SBJR', iata: 'RIO', name: 'Jacarepaguá', city: 'Rio de Janeiro', state: 'RJ', country: 'BR', latitude: -22.9873, longitude: -43.3703 },
  
  // Minas Gerais
  { icao: 'SBBH', iata: 'BHZ', name: 'Belo Horizonte', city: 'Belo Horizonte', state: 'MG', country: 'BR', latitude: -19.8512, longitude: -43.9506 },
  { icao: 'SBUR', iata: 'UDI', name: 'Uberlândia', city: 'Uberlândia', state: 'MG', country: 'BR', latitude: -18.8828, longitude: -48.2256 },
  { icao: 'SBJF', iata: 'JDF', name: 'Juiz de Fora', city: 'Juiz de Fora', state: 'MG', country: 'BR', latitude: -21.7733, longitude: -43.3508 },
  { icao: 'SBCF', iata: 'CNF', name: 'Confins', city: 'Belo Horizonte', state: 'MG', country: 'BR', latitude: -19.6336, longitude: -43.9686 },
  
  // Bahia - Coordenadas oficiais do aeroporto de Salvador
  { icao: 'SBSV', iata: 'SSA', name: 'Salvador', city: 'Salvador', state: 'BA', country: 'BR', latitude: -12.9089, longitude: -38.3225 },
  { icao: 'SBIL', iata: 'IOS', name: 'Ilhéus', city: 'Ilhéus', state: 'BA', country: 'BR', latitude: -14.8158, longitude: -39.0333 },
  
  // Sergipe
  { icao: 'SBAR', iata: 'AJU', name: 'Aracaju', city: 'Aracaju', state: 'SE', country: 'BR', latitude: -10.9844, longitude: -37.0703 },
  
  // Ceará
  { icao: 'SBFZ', iata: 'FOR', name: 'Fortaleza', city: 'Fortaleza', state: 'CE', country: 'BR', latitude: -3.7761, longitude: -38.5322 },
  
  // Pernambuco
  { icao: 'SBPL', iata: 'REC', name: 'Recife', city: 'Recife', state: 'PE', country: 'BR', latitude: -8.1264, longitude: -34.9236 },
  { icao: 'SBRF', iata: 'REC', name: 'Recife', city: 'Recife', state: 'PE', country: 'BR', latitude: -8.1264, longitude: -34.9236 },
  
  // Alagoas
  { icao: 'SBMO', iata: 'MCZ', name: 'Maceió', city: 'Maceió', state: 'AL', country: 'BR', latitude: -9.5108, longitude: -35.7919 },
  
  // Rio Grande do Norte
  { icao: 'SBNT', iata: 'NAT', name: 'Natal', city: 'Natal', state: 'RN', country: 'BR', latitude: -5.7681, longitude: -35.3769 },
  
  // Paraíba
  { icao: 'SBJP', iata: 'JPA', name: 'João Pessoa', city: 'João Pessoa', state: 'PB', country: 'BR', latitude: -7.1484, longitude: -34.9506 },
  
  // Maranhão
  { icao: 'SBSL', iata: 'SLZ', name: 'São Luís', city: 'São Luís', state: 'MA', country: 'BR', latitude: -2.5322, longitude: -44.3028 },
  
  // Piauí
  { icao: 'SBTE', iata: 'THE', name: 'Teresina', city: 'Teresina', state: 'PI', country: 'BR', latitude: -5.0597, longitude: -42.8236 },
  
  // Pará
  { icao: 'SBBE', iata: 'BEL', name: 'Belém', city: 'Belém', state: 'PA', country: 'BR', latitude: -1.3797, longitude: -48.4763 },
  
  // Amazonas
  { icao: 'SBEG', iata: 'MAO', name: 'Manaus', city: 'Manaus', state: 'AM', country: 'BR', latitude: -3.0386, longitude: -60.0497 },
  
  // Acre
  { icao: 'SBRB', iata: 'RBR', name: 'Rio Branco', city: 'Rio Branco', state: 'AC', country: 'BR', latitude: -9.8692, longitude: -67.8939 },
  
  // Rondônia
  { icao: 'SBGL', iata: 'PVH', name: 'Porto Velho', city: 'Porto Velho', state: 'RO', country: 'BR', latitude: -8.7094, longitude: -63.9022 },
  
  // Roraima
  { icao: 'SBBV', iata: 'BVB', name: 'Boa Vista', city: 'Boa Vista', state: 'RR', country: 'BR', latitude: 2.8419, longitude: -60.6922 },
  
  // Amapá
  { icao: 'SBMQ', iata: 'MCP', name: 'Macapá', city: 'Macapá', state: 'AP', country: 'BR', latitude: 0.0506, longitude: -51.0722 },
  
  // Tocantins
  { icao: 'SBPJ', iata: 'PMW', name: 'Palmas', city: 'Palmas', state: 'TO', country: 'BR', latitude: -10.2917, longitude: -48.3572 },
  
  // Goiás
  { icao: 'SBGO', iata: 'GYN', name: 'Goiânia', city: 'Goiânia', state: 'GO', country: 'BR', latitude: -16.6320, longitude: -49.2206 },
  
  // Mato Grosso
  { icao: 'SBCG', iata: 'CGR', name: 'Campo Grande', city: 'Campo Grande', state: 'MS', country: 'BR', latitude: -20.4433, longitude: -54.6472 },
  { icao: 'SBCY', iata: 'CGB', name: 'Cuiabá', city: 'Cuiabá', state: 'MT', country: 'BR', latitude: -15.6529, longitude: -56.1167 },
  
  // Distrito Federal
  { icao: 'SBBR', iata: 'BSB', name: 'Brasília', city: 'Brasília', state: 'DF', country: 'BR', latitude: -15.8697, longitude: -47.9208 },
  
  // Santa Catarina
  { icao: 'SBFL', iata: 'FLN', name: 'Hercílio Luz', city: 'Florianópolis', state: 'SC', country: 'BR', latitude: -27.6705, longitude: -48.5477 },
  { icao: 'SBJV', iata: 'JOI', name: 'Joinville', city: 'Joinville', state: 'SC', country: 'BR', latitude: -26.2244, longitude: -48.7972 },
  { icao: 'SBNF', iata: 'NVT', name: 'Navegantes', city: 'Navegantes', state: 'SC', country: 'BR', latitude: -26.8797, longitude: -48.6514 },
  
  // Paraná
  { icao: 'SBCT', iata: 'CWB', name: 'Afonso Pena', city: 'Curitiba', state: 'PR', country: 'BR', latitude: -25.5284, longitude: -49.1714 },
  { icao: 'SBLN', iata: 'LDB', name: 'Londrina', city: 'Londrina', state: 'PR', country: 'BR', latitude: -23.3336, longitude: -51.1306 },
  { icao: 'SBFI', iata: 'IGU', name: 'Foz do Iguaçu', city: 'Foz do Iguaçu', state: 'PR', country: 'BR', latitude: -25.6003, longitude: -54.4850 },
  
  // Rio Grande do Sul
  { icao: 'SBPA', iata: 'POA', name: 'Salgado Filho', city: 'Porto Alegre', state: 'RS', country: 'BR', latitude: -29.9939, longitude: -51.1714 },
  { icao: 'SBCA', iata: 'CWB', name: 'Caxias do Sul', city: 'Caxias do Sul', state: 'RS', country: 'BR', latitude: -29.1974, longitude: -51.1875 },
  { icao: 'SBPF', iata: 'PFB', name: 'Passo Fundo', city: 'Passo Fundo', state: 'RS', country: 'BR', latitude: -28.2439, longitude: -52.3264 },
  
  // Espírito Santo
  { icao: 'SBVT', iata: 'VIX', name: 'Eurico de Aguiar Salles', city: 'Vitória', state: 'ES', country: 'BR', latitude: -20.2589, longitude: -40.2864 },
];

export async function searchAirports(query: string): Promise<Airport[]> {
  try {
    // Primeiro, buscar na base de dados local
    const localResults = BRAZILIAN_AIRPORTS.filter(airport =>
      airport.icao.toLowerCase().includes(query.toLowerCase()) ||
      airport.iata?.toLowerCase().includes(query.toLowerCase()) ||
      airport.name.toLowerCase().includes(query.toLowerCase()) ||
      airport.city.toLowerCase().includes(query.toLowerCase()) ||
      airport.state.toLowerCase().includes(query.toLowerCase())
    );

    // Se encontrou resultados locais, retornar
    if (localResults.length > 0) {
      return localResults;
    }

    // Se não encontrou nada, retornar aeroportos populares
    return BRAZILIAN_AIRPORTS.slice(0, 10);
  } catch (error) {
    console.error('❌ Erro ao buscar aeroportos:', error);
    return BRAZILIAN_AIRPORTS.slice(0, 10);
  }
}

// Aeroportos populares como fallback
export function getPopularAirports(): Airport[] {
  return BRAZILIAN_AIRPORTS.slice(0, 20); // Retorna os 20 mais populares
}

// Calcular distância entre dois aeroportos usando fórmula de Haversine (em milhas náuticas)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180; // φ, λ em radianos
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // Distância em metros
  return d / 1852; // Converter para milhas náuticas (1 NM = 1852 metros)
}

// Função para obter aeroportos por estado
export function getAirportsByState(state: string): Airport[] {
  return BRAZILIAN_AIRPORTS.filter(airport => 
    airport.state.toLowerCase() === state.toLowerCase()
  );
}

// Função para obter aeroportos por região
export function getAirportsByRegion(region: string): Airport[] {
  const regions = {
    'norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
    'nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    'centro-oeste': ['DF', 'GO', 'MT', 'MS'],
    'sudeste': ['ES', 'MG', 'RJ', 'SP'],
    'sul': ['PR', 'RS', 'SC']
  };

  const states = regions[region.toLowerCase() as keyof typeof regions] || [];
  return BRAZILIAN_AIRPORTS.filter(airport => states.includes(airport.state));
} 

export async function getAirportCoordinates(icao: string): Promise<{ lat: number, lon: number } | null> {
  try {
    // Primeiro, tentar buscar na base local
    const localAirport = BRAZILIAN_AIRPORTS.find(airport => 
      airport.icao.toUpperCase() === icao.toUpperCase()
    );
    
    if (localAirport) {
      return {
        lat: localAirport.latitude,
        lon: localAirport.longitude
      };
    }

    // API AISWEB não tem endpoint /api/airport - usando apenas base local
    console.log(`ℹ️ Aeroporto ${icao} não encontrado na base local`);
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar coordenadas AISWEB:', error);
    
    // Fallback para base local em caso de erro
    const localAirport = BRAZILIAN_AIRPORTS.find(airport => 
      airport.icao.toUpperCase() === icao.toUpperCase()
    );
    
    if (localAirport) {
      console.log(`Usando coordenadas locais para ${icao}`);
      return {
        lat: localAirport.latitude,
        lon: localAirport.longitude
      };
    }
    
    return null;
  }
} 

// Função para buscar coordenadas com timeout e fallback robusto
export async function getAirportCoordinatesWithFallback(icao: string): Promise<{ lat: number, lon: number } | null> {
  // Primeiro, sempre tentar a base local
  const localAirport = BRAZILIAN_AIRPORTS.find(airport => 
    airport.icao.toUpperCase() === icao.toUpperCase()
  );
  
  if (localAirport) {
    return {
      lat: localAirport.latitude,
      lon: localAirport.longitude
    };
  }

  // Se não encontrou na base local, chamar backend proxy (sem expor chaves)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${BACKEND_URL}/airports/coords?icao=${encodeURIComponent(icao)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data?.lat === 'number' && typeof data?.lon === 'number') {
      return { lat: data.lat, lon: data.lon };
    }
    return null;
  } catch {
    return null;
  }
} 

// Função para testar a disponibilidade da API AISWEB
export async function testAISWEBConnection(): Promise<boolean> {
  console.log('ℹ️ API AISWEB não tem endpoint /api/airport - usando apenas base local');
  return false;
} 

// Função para verificar se as distâncias estão corretas
export function verifyDistances() {
  console.log('🔍 Verificando distâncias conhecidas:');
  
  // SBAU (Araçatuba) → SBSP (Congonhas)
  const araçatuba = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBAU');
  const congonhas = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBSP');
  
  if (araçatuba && congonhas) {
    const distance = calculateDistance(
      araçatuba.latitude, araçatuba.longitude,
      congonhas.latitude, congonhas.longitude
    );
    console.log(`SBAU → SBSP: ${distance.toFixed(1)} NM (Real: ~216 NM)`);
  }
  
  // SBAU (Araçatuba) → SBAR (Aracaju)
  const aracaju = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBAR');
  
  if (araçatuba && aracaju) {
    const distance = calculateDistance(
      araçatuba.latitude, araçatuba.longitude,
      aracaju.latitude, aracaju.longitude
    );
    console.log(`SBAU → SBAR: ${distance.toFixed(1)} NM (Real: ~648 NM)`);
  }
  
  // SBSP (Congonhas) → SBGR (Guarulhos)
  const guarulhos = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBGR');
  
  if (congonhas && guarulhos) {
    const distance = calculateDistance(
      congonhas.latitude, congonhas.longitude,
      guarulhos.latitude, guarulhos.longitude
    );
    console.log(`SBSP → SBGR: ${distance.toFixed(1)} NM (Real: ~13.5 NM)`);
  }
} 

// Função para verificar distância específica SBAU → SBSV
export function verifySBAUtoSBSV() {
  const araçatuba = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBAU');
  const salvador = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBSV');
  
  if (araçatuba && salvador) {
    const distance = calculateDistance(
      araçatuba.latitude, araçatuba.longitude,
      salvador.latitude, salvador.longitude
    );
    
    console.log('🔍 Verificação SBAU → SBSV:');
    console.log('🔍 Araçatuba:', araçatuba.latitude, araçatuba.longitude);
    console.log('🔍 Salvador:', salvador.latitude, salvador.longitude);
    console.log('🔍 Distância calculada:', distance.toFixed(1), 'NM');
    console.log('🔍 Distância real (Google Maps): ~1080 NM');
    console.log('🔍 Diferença:', Math.abs(distance - 1080).toFixed(1), 'NM');
    console.log('🔍 Tempo de voo estimado:', Math.ceil(distance / 108), 'horas');
    
    return distance;
  }
  return 0;
} 

// Função para obter velocidade estimada da aeronave (em nós - KT)
export function getAircraftSpeed(aircraftModel: string): number {
  const model = aircraftModel.toLowerCase();
  
  if (model.includes('cessna') || model.includes('172')) {
    return 97; // Cessna 172: ~97 KT (180 km/h)
  } else if (model.includes('piper') || model.includes('cherokee')) {
    return 103; // Piper Cherokee: ~103 KT (190 km/h)
  } else if (model.includes('beechcraft') || model.includes('bonanza') || model.includes('baron')) {
    return 119; // Beechcraft Baron: ~119 KT (220 km/h)
  } else if (model.includes('cirrus')) {
    return 135; // Cirrus SR22: ~135 KT (250 km/h)
  } else {
    return 108; // Velocidade padrão para aeronaves pequenas (~200 km/h)
  }
}
