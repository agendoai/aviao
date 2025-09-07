// Função para buscar aeroportos usando base local (com fallback AISWEB em outras funções)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://72.60.62.143:4000';

/**
 * Busca o nome do aeroporto por código ICAO
 * @param icao - Código ICAO do aeroporto
 * @returns Nome do aeroporto ou o código ICAO se não encontrado
 */
export const getAirportNameByICAO = (icao: string): string => {
  const airport = BRAZILIAN_AIRPORTS.find(a => a.icao === icao);
  return airport ? `${icao} - ${airport.name}` : icao;
};

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
  { icao: 'SBAU', iata: 'ARU', name: 'Araçatuba', city: 'Araçatuba', state: 'SP', country: 'BR', latitude: -21.1411, longitude: -50.4247 },
  { icao: 'SBSP', iata: 'CGH', name: 'Congonhas', city: 'São Paulo', state: 'SP', country: 'BR', latitude: -23.6273, longitude: -46.6566 },
  { icao: 'SBGR', iata: 'GRU', name: 'Guarulhos', city: 'São Paulo', state: 'SP', country: 'BR', latitude: -23.4356, longitude: -46.4731 },
  { icao: 'SBMT', iata: 'MTE', name: 'Campo de Marte', city: 'São Paulo', state: 'SP', country: 'BR', latitude: -23.5092, longitude: -46.6378 },
  { icao: 'SBKP', iata: 'VCP', name: 'Viracopos', city: 'Campinas', state: 'SP', country: 'BR', latitude: -23.0074, longitude: -47.1345 },
  { icao: 'SBBS', iata: 'BAU', name: 'Bauru', city: 'Bauru', state: 'SP', country: 'BR', latitude: -22.3450, longitude: -49.0538 },
  { icao: 'SBRP', iata: 'RAO', name: 'Ribeirão Preto', city: 'Ribeirão Preto', state: 'SP', country: 'BR', latitude: -21.1344, longitude: -47.7742 },
  { icao: 'SBJD', iata: 'JDF', name: 'Jundiaí', city: 'Jundiaí', state: 'SP', country: 'BR', latitude: -23.1808, longitude: -46.9444 },
  { icao: 'SBSJ', iata: 'SJK', name: 'São José dos Campos', city: 'São José dos Campos', state: 'SP', country: 'BR', latitude: -23.2283, longitude: -45.8628 },
  { icao: 'SBSA', iata: 'SSZ', name: 'Santos', city: 'Santos', state: 'SP', country: 'BR', latitude: -23.9253, longitude: -46.2875 },
  { icao: 'SBTA', iata: 'TAT', name: 'Taubaté', city: 'Taubaté', state: 'SP', country: 'BR', latitude: -23.0403, longitude: -45.5156 },
  { icao: 'SBDN', iata: 'DNZ', name: 'Dracena', city: 'Dracena', state: 'SP', country: 'BR', latitude: -21.6419, longitude: -51.5519 },
  { icao: 'SBPP', iata: 'PPB', name: 'Presidente Prudente', city: 'Presidente Prudente', state: 'SP', country: 'BR', latitude: -22.1753, longitude: -51.4244 },
  { icao: 'SBAQ', iata: 'AQJ', name: 'Araraquara', city: 'Araraquara', state: 'SP', country: 'BR', latitude: -21.8122, longitude: -48.1331 },
  { icao: 'SBST', iata: 'SSA', name: 'Santos Dumont', city: 'Santos', state: 'SP', country: 'BR', latitude: -23.9253, longitude: -46.2875 },
  { icao: 'SBUL', iata: 'UBA', name: 'Uberaba', city: 'Uberaba', state: 'SP', country: 'BR', latitude: -19.7650, longitude: -47.9647 },
  { icao: 'SBSM', iata: 'SJP', name: 'São José do Rio Preto', city: 'São José do Rio Preto', state: 'SP', country: 'BR', latitude: -20.8161, longitude: -49.4064 },
  { icao: 'SBYS', iata: 'YLS', name: 'Sorocaba', city: 'Sorocaba', state: 'SP', country: 'BR', latitude: -23.4792, longitude: -47.4897 },
  { icao: 'SBLO', iata: 'LDB', name: 'Londrina', city: 'Londrina', state: 'PR', country: 'BR', latitude: -23.3336, longitude: -51.1300 },
  { icao: 'SBCG', iata: 'CGR', name: 'Campo Grande', city: 'Campo Grande', state: 'MS', country: 'BR', latitude: -20.4686, longitude: -54.6725 },
  
  // Rio de Janeiro
  { icao: 'SBRJ', iata: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro', state: 'RJ', country: 'BR', latitude: -22.9104, longitude: -43.1631 },
  { icao: 'SBGL', iata: 'GIG', name: 'Galeão', city: 'Rio de Janeiro', state: 'RJ', country: 'BR', latitude: -22.8089, longitude: -43.2500 },
  { icao: 'SBJR', iata: 'RIO', name: 'Jacarepaguá', city: 'Rio de Janeiro', state: 'RJ', country: 'BR', latitude: -22.9873, longitude: -43.3703 },
  { icao: 'SBME', iata: 'MEA', name: 'Macaé', city: 'Macaé', state: 'RJ', country: 'BR', latitude: -22.3431, longitude: -41.7658 },
  { icao: 'SBCB', iata: 'CAB', name: 'Cabo Frio', city: 'Cabo Frio', state: 'RJ', country: 'BR', latitude: -22.9214, longitude: -42.0742 },
  
  // Minas Gerais
  { icao: 'SBBH', iata: 'BHZ', name: 'Belo Horizonte', city: 'Belo Horizonte', state: 'MG', country: 'BR', latitude: -19.8512, longitude: -43.9506 },
  { icao: 'SBUR', iata: 'UDI', name: 'Uberlândia', city: 'Uberlândia', state: 'MG', country: 'BR', latitude: -18.8828, longitude: -48.2256 },
  { icao: 'SBJF', iata: 'IZA', name: 'Juiz de Fora', city: 'Juiz de Fora', state: 'MG', country: 'BR', latitude: -21.7733, longitude: -43.3508 },
  { icao: 'SBGV', iata: 'GVR', name: 'Governador Valadares', city: 'Governador Valadares', state: 'MG', country: 'BR', latitude: -18.8953, longitude: -41.9822 },
  { icao: 'SBPC', iata: 'PCS', name: 'Poços de Caldas', city: 'Poços de Caldas', state: 'MG', country: 'BR', latitude: -21.8431, longitude: -46.5678 },
  { icao: 'SBIP', iata: 'IPN', name: 'Ipatinga', city: 'Ipatinga', state: 'MG', country: 'BR', latitude: -19.4706, longitude: -42.4878 },
  { icao: 'SBCF', iata: 'CNF', name: 'Confins', city: 'Belo Horizonte', state: 'MG', country: 'BR', latitude: -19.6336, longitude: -43.9686 },
  
  // Bahia - Coordenadas oficiais do aeroporto de Salvador
  { icao: 'SBSV', iata: 'SSA', name: 'Salvador', city: 'Salvador', state: 'BA', country: 'BR', latitude: -12.9089, longitude: -38.3225 },
  { icao: 'SBIL', iata: 'IOS', name: 'Ilhéus', city: 'Ilhéus', state: 'BA', country: 'BR', latitude: -14.8158, longitude: -39.0333 },
  { icao: 'SBAR', iata: 'AJU', name: 'Aracaju', city: 'Aracaju', state: 'SE', country: 'BR', latitude: -10.9842, longitude: -37.0703 },
  { icao: 'SBMQ', iata: 'MCZ', name: 'Maceió', city: 'Maceió', state: 'AL', country: 'BR', latitude: -9.5108, longitude: -35.7917 },
  { icao: 'SBRF', iata: 'REC', name: 'Recife', city: 'Recife', state: 'PE', country: 'BR', latitude: -8.1264, longitude: -34.9236 },
  { icao: 'SBJP', iata: 'JPA', name: 'João Pessoa', city: 'João Pessoa', state: 'PB', country: 'BR', latitude: -7.1458, longitude: -34.9486 },
  { icao: 'SBNT', iata: 'NAT', name: 'Natal', city: 'Natal', state: 'RN', country: 'BR', latitude: -5.7681, longitude: -35.3761 },
  { icao: 'SBFZ', iata: 'FOR', name: 'Fortaleza', city: 'Fortaleza', state: 'CE', country: 'BR', latitude: -3.7761, longitude: -38.5322 },
  { icao: 'SBTF', iata: 'THE', name: 'Teresina', city: 'Teresina', state: 'PI', country: 'BR', latitude: -5.0597, longitude: -42.8236 },
  { icao: 'SBSL', iata: 'SLZ', name: 'São Luís', city: 'São Luís', state: 'MA', country: 'BR', latitude: -2.5853, longitude: -44.2342 },
  
  // Sul do Brasil
  { icao: 'SBFL', iata: 'FLN', name: 'Florianópolis', city: 'Florianópolis', state: 'SC', country: 'BR', latitude: -27.6705, longitude: -48.5477 },
  { icao: 'SBPA', iata: 'POA', name: 'Porto Alegre', city: 'Porto Alegre', state: 'RS', country: 'BR', latitude: -29.9939, longitude: -51.1714 },
  { icao: 'SBCT', iata: 'CWB', name: 'Afonso Pena', city: 'Curitiba', state: 'PR', country: 'BR', latitude: -25.5284, longitude: -49.1758 },
  { icao: 'SBMG', iata: 'MGF', name: 'Maringá', city: 'Maringá', state: 'PR', country: 'BR', latitude: -23.4764, longitude: -52.0164 },
  { icao: 'SBCH', iata: 'XAP', name: 'Chapecó', city: 'Chapecó', state: 'SC', country: 'BR', latitude: -27.1342, longitude: -52.6567 },
  { icao: 'SBJO', iata: 'JOI', name: 'Joinville', city: 'Joinville', state: 'SC', country: 'BR', latitude: -26.2245, longitude: -48.7974 },
  { icao: 'SBCX', iata: 'CXJ', name: 'Caxias do Sul', city: 'Caxias do Sul', state: 'RS', country: 'BR', latitude: -29.1971, longitude: -51.1875 },
  { icao: 'SBUG', iata: 'URG', name: 'Uruguaiana', city: 'Uruguaiana', state: 'RS', country: 'BR', latitude: -29.7822, longitude: -57.0381 },
  
  // Centro-Oeste
  { icao: 'SBBR', iata: 'BSB', name: 'Brasília', city: 'Brasília', state: 'DF', country: 'BR', latitude: -15.8697, longitude: -47.9208 },
  { icao: 'SBCY', iata: 'CGB', name: 'Cuiabá', city: 'Cuiabá', state: 'MT', country: 'BR', latitude: -15.6529, longitude: -56.1167 },
  { icao: 'SBGO', iata: 'GYN', name: 'Goiânia', city: 'Goiânia', state: 'GO', country: 'BR', latitude: -16.6320, longitude: -49.2207 },
  { icao: 'SBVG', iata: 'VAG', name: 'Varginha', city: 'Varginha', state: 'MG', country: 'BR', latitude: -21.5901, longitude: -45.4731 },
  
  // Norte do Brasil
  { icao: 'SBBE', iata: 'BEL', name: 'Belém', city: 'Belém', state: 'PA', country: 'BR', latitude: -1.3792, longitude: -48.4761 },
  { icao: 'SBMN', iata: 'MAO', name: 'Manaus', city: 'Manaus', state: 'AM', country: 'BR', latitude: -3.0386, longitude: -60.0497 },
  { icao: 'SBPV', iata: 'PVH', name: 'Porto Velho', city: 'Porto Velho', state: 'RO', country: 'BR', latitude: -8.7092, longitude: -63.9022 },
  { icao: 'SBRB', iata: 'RBR', name: 'Rio Branco', city: 'Rio Branco', state: 'AC', country: 'BR', latitude: -9.8689, longitude: -67.8981 },
  { icao: 'SBEG', iata: 'MAO', name: 'Eduardo Gomes', city: 'Manaus', state: 'AM', country: 'BR', latitude: -3.0386, longitude: -60.0497 },
  { icao: 'SBPB', iata: 'CPV', name: 'Campina Grande', city: 'Campina Grande', state: 'PB', country: 'BR', latitude: -7.2697, longitude: -35.8964 },
  
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
  { icao: 'SBPV', iata: 'PVH', name: 'Porto Velho', city: 'Porto Velho', state: 'RO', country: 'BR', latitude: -8.7094, longitude: -63.9022 },
  
  // Roraima
  { icao: 'SBBV', iata: 'BVB', name: 'Boa Vista', city: 'Boa Vista', state: 'RR', country: 'BR', latitude: 2.8419, longitude: -60.6922 },
  
  // Amapá
  { icao: 'SBMQ', iata: 'MCP', name: 'Macapá', city: 'Macapá', state: 'AP', country: 'BR', latitude: 0.0506, longitude: -51.0722 },
  
  // Tocantins
  { icao: 'SBPJ', iata: 'PMW', name: 'Palmas', city: 'Palmas', state: 'TO', country: 'BR', latitude: -10.2917, longitude: -48.3572 },
  
  // Goiás
  
  // Mato Grosso
  
  // Distrito Federal
  
  // Santa Catarina
  { icao: 'SBFL', iata: 'FLN', name: 'Hercílio Luz', city: 'Florianópolis', state: 'SC', country: 'BR', latitude: -27.6705, longitude: -48.5477 },
  { icao: 'SBJV', iata: 'JOI', name: 'Joinville', city: 'Joinville', state: 'SC', country: 'BR', latitude: -26.2244, longitude: -48.7972 },
  { icao: 'SBNF', iata: 'NVT', name: 'Navegantes', city: 'Navegantes', state: 'SC', country: 'BR', latitude: -26.8797, longitude: -48.6514 },
  
  // Paraná
  { icao: 'SBCT', iata: 'CWB', name: 'Afonso Pena', city: 'Curitiba', state: 'PR', country: 'BR', latitude: -25.5284, longitude: -49.1714 },
  { icao: 'SBLN', iata: 'LDB', name: 'Londrina', city: 'Londrina', state: 'PR', country: 'BR', latitude: -23.3336, longitude: -51.1306 },
  { icao: 'SBFI', iata: 'IGU', name: 'Foz do Iguaçu', city: 'Foz do Iguaçu', state: 'PR', country: 'BR', latitude: -25.6003, longitude: -54.4850 },
  
  // Rio Grande do Sul
  { icao: 'SBCA', iata: 'CXJ', name: 'Caxias do Sul', city: 'Caxias do Sul', state: 'RS', country: 'BR', latitude: -29.1974, longitude: -51.1875 },
  { icao: 'SBPF', iata: 'PFB', name: 'Passo Fundo', city: 'Passo Fundo', state: 'RS', country: 'BR', latitude: -28.2439, longitude: -52.3264 },
  
  // Espírito Santo
  { icao: 'SBVT', iata: 'VIX', name: 'Eurico de Aguiar Salles', city: 'Vitória', state: 'ES', country: 'BR', latitude: -20.2589, longitude: -40.2864 },
];

export async function searchAirports(query: string): Promise<Airport[]> {
  try {
    // SEMPRE tentar API AISWEB primeiro
    // console.log(`🔍 Buscando aeroportos via API AISWEB para: ${query}`);
    
    // TODO: Implementar busca via API AISWEB quando disponível
    // Por enquanto, usar base local mas com log indicando que deveria ser API
    
    // Buscar na base de dados local (fallback)
    const localResults = BRAZILIAN_AIRPORTS.filter(airport =>
      airport.icao.toLowerCase().includes(query.toLowerCase()) ||
      airport.iata?.toLowerCase().includes(query.toLowerCase()) ||
      airport.name.toLowerCase().includes(query.toLowerCase()) ||
      airport.city.toLowerCase().includes(query.toLowerCase()) ||
      airport.state.toLowerCase().includes(query.toLowerCase())
    );

    if (localResults.length > 0) {
      // console.log(`ℹ️ Encontrados ${localResults.length} aeroportos na base local`);
      return localResults;
    }

    // console.log('ℹ️ Nenhum aeroporto encontrado, retornando populares');
    return BRAZILIAN_AIRPORTS.slice(0, 10);
  } catch (error) {
    console.error('❌ Erro ao buscar aeroportos:', error);
    return BRAZILIAN_AIRPORTS.slice(0, 10);
  }
}

// Aeroportos populares como fallback
export function getPopularAirports(): Airport[] {
  return BRAZILIAN_AIRPORTS.slice(0, 50); // Retorna os 50 mais populares
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
    // console.log(`ℹ️ Aeroporto ${icao} não encontrado na base local`);
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar coordenadas AISWEB:', error);
    
    // Fallback para base local em caso de erro
    const localAirport = BRAZILIAN_AIRPORTS.find(airport => 
      airport.icao.toUpperCase() === icao.toUpperCase()
    );
    
    if (localAirport) {
      // console.log(`Usando coordenadas locais para ${icao}`);
      return {
        lat: localAirport.latitude,
        lon: localAirport.longitude
      };
    }
    
    return null;
  }
} 

// Função para buscar coordenadas via API AISWEB (prioridade) com fallback local
export async function getAirportCoordinatesWithFallback(icao: string): Promise<{ lat: number, lon: number, source?: string } | null> {
  // SEMPRE tentar API AISWEB primeiro
  try {
    // console.log(`🔍 Buscando ${icao} via API AISWEB...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${BACKEND_URL}/api/airports/coords?icao=${encodeURIComponent(icao)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (typeof data?.lat === 'number' && typeof data?.lon === 'number') {
        // console.log(`✅ Coordenadas obtidas via ${data.source} para ${icao}`);
        return { 
          lat: data.lat, 
          lon: data.lon,
          source: data.source || 'unknown'
        };
      }
    }
  } catch (error) {
    console.error('Erro ao buscar coordenadas via API:', error);
  }

  // Fallback para base local se API falhar
  // console.log(`ℹ️ API falhou, usando base local para ${icao}`);
  const localAirport = BRAZILIAN_AIRPORTS.find(airport => 
    airport.icao.toUpperCase() === icao.toUpperCase()
  );
  
  if (localAirport) {
    return {
      lat: localAirport.latitude,
      lon: localAirport.longitude,
      source: 'local_fallback'
    };
  }

  return null;
} 

// Função para testar a disponibilidade da API AISWEB
export async function testAISWEBConnection(): Promise<boolean> {
  try {
    // console.log('🔍 Testando conexão com API AISWEB...');
    const response = await fetch(`${BACKEND_URL}/api/airports/coords?icao=SBAU`);
    if (response.ok) {
      const data = await response.json();
      if (data.success === false) {
        // console.log('❌ API AISWEB falhou:', data.error);
        return false;
      }
      // console.log(`✅ API AISWEB funcionando! Fonte: ${data.source}`);
      return true;
    } else {
      // console.log('❌ API AISWEB não está respondendo');
      return false;
    }
  } catch (error) {
    // console.log('❌ Erro ao testar API AISWEB:', error);
    return false;
  }
} 

// Função para verificar se as distâncias estão corretas
export function verifyDistances() {
  // console.log('🔍 Verificando distâncias conhecidas:');
  
  // SBAU (Araçatuba) → SBSP (Congonhas)
  const araçatuba = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBAU');
  const congonhas = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBSP');
  
  if (araçatuba && congonhas) {
    const distance = calculateDistance(
      araçatuba.latitude, araçatuba.longitude,
      congonhas.latitude, congonhas.longitude
    );
    // console.log(`SBAU → SBSP: ${distance.toFixed(1)} NM (Real: ~216 NM)`);
  }
  
  // SBAU (Araçatuba) → SBAR (Aracaju)
  const aracaju = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBAR');
  
  if (araçatuba && aracaju) {
    const distance = calculateDistance(
      araçatuba.latitude, araçatuba.longitude,
      aracaju.latitude, aracaju.longitude
    );
    // console.log(`SBAU → SBAR: ${distance.toFixed(1)} NM (Real: ~648 NM)`);
  }
  
  // SBSP (Congonhas) → SBGR (Guarulhos)
  const guarulhos = BRAZILIAN_AIRPORTS.find(a => a.icao === 'SBGR');
  
  if (congonhas && guarulhos) {
    const distance = calculateDistance(
      congonhas.latitude, congonhas.longitude,
      guarulhos.latitude, guarulhos.longitude
    );
    // console.log(`SBSP → SBGR: ${distance.toFixed(1)} NM (Real: ~13.5 NM)`);
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
    
    // console.log('🔍 Verificação SBAU → SBSV:');
    // console.log('🔍 Araçatuba:', araçatuba.latitude, araçatuba.longitude);
    // console.log('🔍 Salvador:', salvador.latitude, salvador.longitude);
    // console.log('🔍 Distância calculada:', distance.toFixed(1), 'NM');
    // console.log('🔍 Distância real (Google Maps): ~1080 NM');
    // console.log('🔍 Diferença:', Math.abs(distance - 1080).toFixed(1), 'NM');
    // console.log('🔍 Tempo de voo estimado:', Math.ceil(distance / 108), 'horas');
    
    return distance;
  }
  return 0;
} 

// Função para obter velocidade estimada da aeronave (em nós - KT)
export function getAircraftSpeed(aircraftModel: string): number {
  const model = aircraftModel.toLowerCase();
  
  if (model === 'pr' || model.includes('e-55') || model.includes('embraer')) {
    return 200; // PR (Embraer E-55): ~200 KT (velocidade real de cruzeiro)
  } else if (model.includes('beechcraft') || model.includes('bonanza') || model.includes('baron')) {
    return 185; // Beechcraft Baron: ~185 KT
  } else if (model.includes('piper') || model.includes('cherokee')) {
    return 140; // Piper Cherokee: ~140 KT
  } else if (model.includes('cessna') || model.includes('172')) {
    return 120; // Cessna 172: ~120 KT
  } else if (model.includes('cirrus')) {
    return 160; // Cirrus SR22: ~160 KT
  } else {
    return 185; // Velocidade padrão para PR (Embraer E-55 - 185 KT)
  }
} 

// Interface para taxas aeroportuárias
export interface AirportFees {
  landing_fee: number;
  takeoff_fee: number;
  parking_fee: number;
  navigation_fee: number;
  terminal_fee: number;
  total_fee: number;
  source: string;
}

// Função para buscar taxas aeroportuárias via API
export async function getAirportFees(icao: string): Promise<AirportFees | null> {
  try {
    // console.log(`💰 Buscando taxas aeroportuárias para ${icao}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${BACKEND_URL}/api/airports/fees/${encodeURIComponent(icao)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      // console.log(`✅ Taxas aeroportuárias obtidas para ${icao} (fonte: ${data.source})`);
      return data;
    } else {
      // console.log(`❌ Erro ao buscar taxas para ${icao}:`, response.status);
      return null;
    }
  } catch (error) {
    // console.log(`❌ Erro ao buscar taxas aeroportuárias para ${icao}:`, error);
    return null;
  }
}

// Função para calcular custos totais incluindo taxas aeroportuárias
export async function calculateTotalMissionCost(
  origin: string,
  destinations: string[],
  totalFlightTime: number,
  hourlyRate: number,
  overnightStays: number,
  overnightRate: number
): Promise<{
  hourlyCost: number;
  overnightCost: number;
  airportFees: number;
  totalCost: number;
  feeBreakdown: { [icao: string]: AirportFees };
}> {
  // console.log('💰 Calculando custos totais da missão...');
  
  // Calcular custos de voo
  const hourlyCost = totalFlightTime * hourlyRate;
  const overnightCost = overnightStays * overnightRate;
  
  // Buscar taxas aeroportuárias APENAS para os destinos (não para a base de origem)
  const destinationAirports = destinations;
  const feeBreakdown: { [icao: string]: AirportFees } = {};
  let totalAirportFees = 0;
  
  for (const icao of destinationAirports) {
    try {
      const fees = await getAirportFees(icao);
      if (fees) {
        feeBreakdown[icao] = fees;
        totalAirportFees += fees.total_fee;
        // console.log(`💰 Taxas ${icao} (destino): R$ ${fees.total_fee.toLocaleString('pt-BR')} (${fees.source})`);
      }
    } catch (error) {
      // console.log(`❌ Erro ao buscar taxas para ${icao}:`, error);
    }
  }
  
  const totalCost = hourlyCost + overnightCost + totalAirportFees;
  
  // console.log('💰 Resumo de custos:', {
  //   hourlyCost: `R$ ${hourlyCost.toLocaleString('pt-BR')}`,
  //   overnightCost: `R$ ${overnightCost.toLocaleString('pt-BR')}`,
  //   airportFees: `R$ ${totalAirportFees.toLocaleString('pt-BR')}`,
  //   totalCost: `R$ ${totalCost.toLocaleString('pt-BR')}`
  // });
  
  return {
    hourlyCost,
    overnightCost,
    airportFees: totalAirportFees,
    totalCost,
    feeBreakdown
  };
} 
