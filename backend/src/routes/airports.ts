import express from 'express';
import { PrismaClient } from '@prisma/client';
import { API_KEYS, isAPIKeyConfigured, getAPIKey, getAISWEBCredentials } from '../config/api-keys';

const router = express.Router();
const prisma = new PrismaClient();

// GET /airports - Listar aeroportos populares
router.get('/', async (req, res) => {
  const airports = [
    { icao: 'SBAU', name: 'Araçatuba', city: 'Araçatuba', state: 'SP' },
    { icao: 'SBSP', name: 'Congonhas', city: 'São Paulo', state: 'SP' },
    { icao: 'SBGR', name: 'Guarulhos', city: 'São Paulo', state: 'SP' },
    { icao: 'SBMT', name: 'Campo de Marte', city: 'São Paulo', state: 'SP' },
    { icao: 'SBKP', name: 'Campinas', city: 'Campinas', state: 'SP' },
    { icao: 'SBBS', name: 'Bauru', city: 'Bauru', state: 'SP' },
    { icao: 'SBRJ', name: 'Santos Dumont', city: 'Rio de Janeiro', state: 'RJ' },
    { icao: 'SBGL', name: 'Galeão', city: 'Rio de Janeiro', state: 'RJ' },
    { icao: 'SBBH', name: 'Belo Horizonte', city: 'Belo Horizonte', state: 'MG' },
    { icao: 'SBSV', name: 'Salvador', city: 'Salvador', state: 'BA' },
    { icao: 'SBBR', name: 'Brasília', city: 'Brasília', state: 'DF' },
  ];

  res.json(airports);
});



// GET /airports/coords - Buscar coordenadas via AISWEB API
router.get('/coords', async (req, res) => {
  // console.log('🔍 Endpoint /coords chamado com query:', req.query);
  try {
    const icao = String(req.query.icao || '').toUpperCase();
    if (!icao) {
      return res.status(400).json({ error: 'Parâmetro icao é obrigatório' });
    }

    // SEMPRE tentar AISWEB API primeiro
    if (isAPIKeyConfigured('AISWEB')) {
      try {
        // console.log(`🔍 Buscando ${icao} na API AISWEB...`);
        const credentials = getAISWEBCredentials();
        const url = `${API_KEYS.AISWEB.URL}/rotaer/${icao}?apiKey=${credentials.key}&apiPass=${credentials.pass}`;
        // console.log(`🔍 Tentando URL: ${url}`);
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // console.log(`🔍 Status da resposta: ${response.status}`);
        // console.log(`🔍 Headers da resposta:`, Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const data = await response.json();
          if (data.latitude && data.longitude) {
            // console.log(`✅ Coordenadas obtidas via AISWEB para ${icao}`);
            return res.json({
              lat: parseFloat(data.latitude),
              lon: parseFloat(data.longitude),
              source: 'aisweb'
            });
          }
        }
      } catch (error) {
        // console.log(`❌ Erro na API AISWEB para ${icao}:`, error.message);
      }
    } else {
      // console.log(`⚠️ API AISWEB não configurada para ${icao}`);
    }

    // Fallback para base local se API falhar
    // console.log(`ℹ️ API AISWEB falhou, usando base local para ${icao}`);
    const localAirport = getLocalAirportCoordinates(icao);
    if (localAirport) {
      return res.json({
        ...localAirport,
        source: 'local_fallback'
      });
    }

    res.status(404).json({ error: 'Aeroporto não encontrado' });
  } catch (error) {
    console.error('Erro ao buscar coordenadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /airports/fees/:icao - Buscar taxas aeroportuárias via AISWEB API
router.get('/fees/:icao', async (req, res) => {
  try {
    const icao = String(req.params.icao || '').toUpperCase();
    if (!icao) {
      return res.status(400).json({ error: 'Parâmetro icao é obrigatório' });
    }

    // SEMPRE tentar AISWEB API primeiro
    if (isAPIKeyConfigured('AISWEB')) {
      try {
        // console.log(`💰 Buscando taxas aeroportuárias para ${icao} na API AISWEB...`);
        const credentials = getAISWEBCredentials();
        
                        // Buscar dados do aeroporto via ROTAER (dados completos dos aeródromos)
                const url = `${API_KEYS.AISWEB.URL}/rotaer/${icao}?apiKey=${credentials.key}&apiPass=${credentials.pass}`;
                // console.log(`🔍 Tentando URL: ${url}`);
                const response = await fetch(url, {
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

        if (response.ok) {
          const data = await response.json();
          // console.log(`✅ Taxas aeroportuárias obtidas via AISWEB para ${icao}`);
          
          // Extrair taxas aeroportuárias dos dados do ROTAER
          const fees = {
            landing_fee: data.landing_fee || 0, // Taxa de pouso
            takeoff_fee: data.takeoff_fee || 0, // Taxa de decolagem
            parking_fee: data.parking_fee || 0, // Taxa de estacionamento
            navigation_fee: data.navigation_fee || 0, // Taxa de navegação
            terminal_fee: data.terminal_fee || 0, // Taxa de terminal
            total_fee: 0, // Será calculado
            source: 'aisweb'
          };
          
          // Calcular taxa total (pouso + decolagem + outras)
          fees.total_fee = fees.landing_fee + fees.takeoff_fee + fees.parking_fee + fees.navigation_fee + fees.terminal_fee;
          
          return res.json(fees);
        }
      } catch (error) {
        // console.log(`❌ Erro na API AISWEB para taxas de ${icao}:`, error.message);
      }
    } else {
      // console.log('ℹ️ API AISWEB não configurada para taxas aeroportuárias');
    }

    // Fallback: taxas padrão baseadas no tipo de aeroporto
    // console.log(`ℹ️ Usando taxas padrão para ${icao}`);
    const defaultFees = getDefaultAirportFees(icao);
    
    res.json({
      ...defaultFees,
      source: 'default'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar taxas aeroportuárias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para obter coordenadas da base local
function getLocalAirportCoordinates(icao: string): { lat: number; lon: number } | null {
  const BRAZILIAN_AIRPORTS = [
    { icao: 'SBAU', latitude: -21.1411, longitude: -50.4247 },
    { icao: 'SBSP', latitude: -23.6273, longitude: -46.6566 },
    { icao: 'SBGR', latitude: -23.4356, longitude: -46.4731 },
    { icao: 'SBKP', latitude: -23.0074, longitude: -47.1345 },
    { icao: 'SBMT', latitude: -23.5092, longitude: -46.6378 }, // Campo de Marte - São Paulo
    { icao: 'SBBS', latitude: -22.3450, longitude: -49.0538 }, // Bauru - Aeroporto Moussa Nakhl Tobias
    { icao: 'SBRP', latitude: -21.1344, longitude: -47.7742 },
    { icao: 'SBJD', latitude: -23.1808, longitude: -46.9444 },
    { icao: 'SBSJ', latitude: -23.2283, longitude: -45.8628 },
    { icao: 'SBRJ', latitude: -22.9104, longitude: -43.1631 },
    { icao: 'SBGL', latitude: -22.8089, longitude: -43.2500 },
    { icao: 'SBJR', latitude: -22.9873, longitude: -43.3703 },
    { icao: 'SBBH', latitude: -19.8512, longitude: -43.9506 },
    { icao: 'SBUR', latitude: -18.8828, longitude: -48.2256 },
    { icao: 'SBJF', latitude: -21.7733, longitude: -43.3508 },
    { icao: 'SBCF', latitude: -19.6336, longitude: -43.9686 },
    { icao: 'SBSV', latitude: -12.9089, longitude: -38.3225 },
    { icao: 'SBIL', latitude: -14.8158, longitude: -39.0333 },
    { icao: 'SBAR', latitude: -10.9844, longitude: -37.0703 },
    { icao: 'SBFZ', latitude: -3.7761, longitude: -38.5322 },
    { icao: 'SBPL', latitude: -8.1264, longitude: -34.9236 },
    { icao: 'SBRF', latitude: -8.1264, longitude: -34.9236 },
    { icao: 'SBMO', latitude: -9.5108, longitude: -35.7919 },
    { icao: 'SBNT', latitude: -5.7681, longitude: -35.3769 },
    { icao: 'SBJP', latitude: -7.1484, longitude: -34.9506 },
    { icao: 'SBSL', latitude: -2.5322, longitude: -44.3028 },
    { icao: 'SBTE', latitude: -5.0597, longitude: -42.8236 },
    { icao: 'SBBE', latitude: -1.3797, longitude: -48.4763 },
    { icao: 'SBEG', latitude: -3.0386, longitude: -60.0497 },
    { icao: 'SBRB', latitude: -9.8692, longitude: -67.8939 },
    { icao: 'SBBV', latitude: 2.8419, longitude: -60.6922 },
    { icao: 'SBMQ', latitude: 0.0506, longitude: -51.0722 },
    { icao: 'SBPJ', latitude: -10.2917, longitude: -48.3572 },
    { icao: 'SBGO', latitude: -16.6320, longitude: -49.2206 },
    { icao: 'SBCG', latitude: -20.4433, longitude: -54.6472 },
    { icao: 'SBCY', latitude: -15.6529, longitude: -56.1167 },
    { icao: 'SBBR', latitude: -15.8697, longitude: -47.9208 },
    { icao: 'SBFL', latitude: -27.6705, longitude: -48.5477 },
    { icao: 'SBJV', latitude: -26.2244, longitude: -48.7972 },
    { icao: 'SBNF', latitude: -26.8797, longitude: -48.6514 },
  ];

  const airport = BRAZILIAN_AIRPORTS.find(a => a.icao === icao);
  return airport ? { lat: airport.latitude, lon: airport.longitude } : null;
}

// Função para obter taxas padrão baseadas no tipo de aeroporto
function getDefaultAirportFees(icao: string) {
  // Taxas baseadas no tamanho/importância do aeroporto
  const airportTiers = {
    // Aeroportos internacionais principais
    'SBGR': { landing: 400, takeoff: 300, parking: 100, navigation: 150, terminal: 200 }, // Guarulhos
    'SBSP': { landing: 350, takeoff: 250, parking: 80, navigation: 120, terminal: 180 }, // Congonhas
    'SBGL': { landing: 380, takeoff: 280, parking: 90, navigation: 140, terminal: 190 }, // Galeão
    'SBRJ': { landing: 300, takeoff: 220, parking: 60, navigation: 100, terminal: 150 }, // Santos Dumont
    
    // Aeroportos regionais importantes
    'SBBH': { landing: 250, takeoff: 200, parking: 50, navigation: 80, terminal: 120 }, // BH
    'SBSV': { landing: 220, takeoff: 180, parking: 40, navigation: 60, terminal: 100 }, // Salvador
    'SBBR': { landing: 280, takeoff: 220, parking: 60, navigation: 90, terminal: 140 }, // Brasília
    'SBPA': { landing: 240, takeoff: 190, parking: 45, navigation: 70, terminal: 110 }, // Porto Alegre
    
    // Aeroportos regionais menores
    'SBAU': { landing: 150, takeoff: 120, parking: 25, navigation: 40, terminal: 60 }, // Araçatuba
    'SBKP': { landing: 180, takeoff: 150, parking: 30, navigation: 50, terminal: 75 }, // Campinas
    'SBCF': { landing: 200, takeoff: 160, parking: 35, navigation: 55, terminal: 90 }, // Confins
    'SBFL': { landing: 190, takeoff: 155, parking: 32, navigation: 52, terminal: 85 }, // Florianópolis
  };

  const fees = airportTiers[icao as keyof typeof airportTiers] || {
    landing: 250, takeoff: 200, parking: 40, navigation: 60, terminal: 100
  };

  const total = fees.landing + fees.takeoff + fees.parking + fees.navigation + fees.terminal;

  return {
    landing_fee: fees.landing,
    takeoff_fee: fees.takeoff,
    parking_fee: fees.parking,
    navigation_fee: fees.navigation,
    terminal_fee: fees.terminal,
    total_fee: total
  };
}

export default router;


