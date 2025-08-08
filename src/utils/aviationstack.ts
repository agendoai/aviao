const AVIATIONSTACK_API_KEY = '4767791aeb223191266882044f5f916d';
const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';

export interface Airport {
  airport_name: string;
  iata_code: string;
  icao_code: string;
  latitude: string;
  longitude: string;
  country_code: string;
  country_name: string;
  city: string;
}

export interface DistanceCalculation {
  origin: Airport;
  destination: Airport;
  distance_km: number;
  estimated_flight_time_minutes: number;
}

export async function searchAirportAviationStack(query: string) {
  const url = `${AVIATIONSTACK_BASE_URL}/airports?access_key=${AVIATIONSTACK_API_KEY}&search=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao buscar aeroporto na AviationStack');
  return res.json();
}

export const getAirportByIATA = async (iataCode: string): Promise<Airport | null> => {
  try {
    const response = await fetch(`${AVIATIONSTACK_BASE_URL}/autocomplete?access_key=${AVIATIONSTACK_API_KEY}&query=${iataCode}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Erro na API aviationstack');
    }
    
    const airports = data.data || [];
    return airports.find((airport: Airport) => airport.iata_code === iataCode) || null;
  } catch (error) {
    console.error('Erro ao buscar aeroporto por IATA:', error);
    throw error;
  }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const calculateFlightDistance = async (originIATA: string, destinationIATA: string): Promise<DistanceCalculation> => {
  try {
    const [originAirport, destinationAirport] = await Promise.all([
      getAirportByIATA(originIATA),
      getAirportByIATA(destinationIATA)
    ]);
    
    if (!originAirport || !destinationAirport) {
      throw new Error('Aeroporto não encontrado');
    }
    
    const distance = calculateDistance(
      parseFloat(originAirport.latitude),
      parseFloat(originAirport.longitude),
      parseFloat(destinationAirport.latitude),
      parseFloat(destinationAirport.longitude)
    );
    
    // Estimativa de tempo de voo baseada na distância (velocidade média de 400 km/h)
    const estimatedFlightTimeMinutes = Math.round((distance / 400) * 60);
    
    return {
      origin: originAirport,
      destination: destinationAirport,
      distance_km: Math.round(distance),
      estimated_flight_time_minutes: estimatedFlightTimeMinutes
    };
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    throw error;
  }
};

export const getPopularAirports = (): Airport[] => {
  return [
    {
      airport_name: 'Aeroporto Internacional de São Paulo/Guarulhos',
      iata_code: 'GRU',
      icao_code: 'SBGR',
      latitude: '-23.4356',
      longitude: '-46.4731',
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'São Paulo'
    },
    {
      airport_name: 'Aeroporto Internacional de Congonhas',
      iata_code: 'CGH',
      icao_code: 'SBSP',
      latitude: '-23.6273',
      longitude: '-46.6566',
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'São Paulo'
    },
    {
      airport_name: 'Aeroporto Internacional de Brasília',
      iata_code: 'BSB',
      icao_code: 'SBBR',
      latitude: '-15.8697',
      longitude: '-47.9208',
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Brasília'
    },
    {
      airport_name: 'Aeroporto Internacional do Rio de Janeiro/Galeão',
      iata_code: 'GIG',
      icao_code: 'SBGL',
      latitude: '-22.8089',
      longitude: '-43.2500',
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Rio de Janeiro'
    },
    {
      airport_name: 'Aeroporto de Araçatuba',
      iata_code: 'ARU',
      icao_code: 'SBAU',
      latitude: '-21.1413',
      longitude: '-50.4247',
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Araçatuba'
    }
  ];
}; 