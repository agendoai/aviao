const RAPIDAPI_KEY = '70b684cd76mshe761e0344033305p19889ejsnecfa049c8cfa';
const RAPIDAPI_HOST = 'aiport-data.p.rapidapi.com';

export interface AirportData {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  latitude: number;
  longitude: number;
  country_code: string;
  country_name: string;
  city: string;
  region_code?: string;
  region_name?: string;
}

export interface RegionAirports {
  airports: AirportData[];
  total: number;
}

export const searchAirportsByRegion = async (regionCode: string): Promise<AirportData[]> => {
  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}/getRegion?regionCode=${regionCode}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.airports || [];
  } catch (error) {
    console.error('Erro ao buscar aeroportos por região:', error);
    throw error;
  }
};

export const searchAirportsByCountry = async (countryCode: string): Promise<AirportData[]> => {
  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}/getCountry?countryCode=${countryCode}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.airports || [];
  } catch (error) {
    console.error('Erro ao buscar aeroportos por país:', error);
    throw error;
  }
};

export const searchAirportsByName = async (query: string): Promise<AirportData[]> => {
  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.airports || [];
  } catch (error) {
    console.error('Erro ao buscar aeroportos por nome:', error);
    throw error;
  }
};

export const getAirportByIATA = async (iataCode: string): Promise<AirportData | null> => {
  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}/getAirport?iataCode=${iataCode}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error('Erro ao buscar aeroporto por IATA:', error);
    throw error;
  }
};

export const getBrazilianAirports = (): AirportData[] => {
  return [
    {
      id: '1',
      name: 'Aeroporto Internacional de São Paulo/Guarulhos',
      iata_code: 'GRU',
      icao_code: 'SBGR',
      latitude: -23.4356,
      longitude: -46.4731,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'São Paulo',
      region_code: 'SP',
      region_name: 'São Paulo'
    },
    {
      id: '2',
      name: 'Aeroporto Internacional de Congonhas',
      iata_code: 'CGH',
      icao_code: 'SBSP',
      latitude: -23.6273,
      longitude: -46.6566,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'São Paulo',
      region_code: 'SP',
      region_name: 'São Paulo'
    },
    {
      id: '3',
      name: 'Aeroporto Internacional de Brasília',
      iata_code: 'BSB',
      icao_code: 'SBBR',
      latitude: -15.8697,
      longitude: -47.9208,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Brasília',
      region_code: 'DF',
      region_name: 'Distrito Federal'
    },
    {
      id: '4',
      name: 'Aeroporto Internacional do Rio de Janeiro/Galeão',
      iata_code: 'GIG',
      icao_code: 'SBGL',
      latitude: -22.8089,
      longitude: -43.2500,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Rio de Janeiro',
      region_code: 'RJ',
      region_name: 'Rio de Janeiro'
    },
    {
      id: '5',
      name: 'Aeroporto de Araçatuba',
      iata_code: 'ARU',
      icao_code: 'SBAU',
      latitude: -21.1413,
      longitude: -50.4247,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Araçatuba',
      region_code: 'SP',
      region_name: 'São Paulo'
    },
    {
      id: '6',
      name: 'Aeroporto Internacional de Campinas/Viracopos',
      iata_code: 'VCP',
      icao_code: 'SBKP',
      latitude: -23.0074,
      longitude: -47.1345,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Campinas',
      region_code: 'SP',
      region_name: 'São Paulo'
    },
    {
      id: '7',
      name: 'Aeroporto Internacional de Belo Horizonte/Confins',
      iata_code: 'CNF',
      icao_code: 'SBCF',
      latitude: -19.6336,
      longitude: -43.9686,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Belo Horizonte',
      region_code: 'MG',
      region_name: 'Minas Gerais'
    },
    {
      id: '8',
      name: 'Aeroporto Internacional de Porto Alegre',
      iata_code: 'POA',
      icao_code: 'SBPA',
      latitude: -29.9939,
      longitude: -51.1714,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Porto Alegre',
      region_code: 'RS',
      region_name: 'Rio Grande do Sul'
    },
    {
      id: '9',
      name: 'Aeroporto Internacional de Salvador',
      iata_code: 'SSA',
      icao_code: 'SBSV',
      latitude: -12.9086,
      longitude: -38.3225,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Salvador',
      region_code: 'BA',
      region_name: 'Bahia'
    },
    {
      id: '10',
      name: 'Aeroporto Internacional de Recife',
      iata_code: 'REC',
      icao_code: 'SBRF',
      latitude: -8.1264,
      longitude: -34.9236,
      country_code: 'BR',
      country_name: 'Brazil',
      city: 'Recife',
      region_code: 'PE',
      region_name: 'Pernambuco'
    }
  ];
};

export const getRegions = () => {
  return [
    { code: 'SP', name: 'São Paulo' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'BA', name: 'Bahia' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'PR', name: 'Paraná' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'GO', name: 'Goiás' }
  ];
}; 
