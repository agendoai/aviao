import { calculateDistance, getAircraftSpeed } from '../utils/airport-search';

export interface MissionCalculation {
  totalFlightTime: number; // Tempo total de voo em horas
  totalGroundTime: number; // Tempo total em solo em horas
  maintenanceTime: number; // Tempo de manutenção em horas
  totalBlockTime: number; // Tempo total bloqueado (voo + solo + manutenção)
  estimatedReturnTime: Date; // Horário estimado de retorno à base
  maintenanceEndTime: Date; // Horário de fim da manutenção
  totalCost: number; // Custo total baseado apenas no tempo de voo
  waypoints: Waypoint[];
}

export interface Waypoint {
  airport: string;
  arrivalTime: Date;
  departureTime: Date;
  groundTime: number; // Tempo em solo em horas
  type: 'origin' | 'destination' | 'return';
}

export interface MissionRequest {
  origin: string;
  destinations: string[];
  departureTime: Date;
  groundTimePerDestination: number; // Tempo em solo por destino em horas
  maintenanceTime: number; // Tempo de manutenção após retorno em horas
}

export class MissionCalculator {
  private static readonly DEFAULT_GROUND_TIME = 1; // 1 hora em solo por padrão
  private static readonly DEFAULT_MAINTENANCE_TIME = 3; // 3 horas de manutenção por padrão

  /**
   * Calcula uma missão completa incluindo ida, volta e manutenção
   */
  static calculateMission(request: MissionRequest): MissionCalculation {
    const {
      origin,
      destinations,
      departureTime,
      groundTimePerDestination = this.DEFAULT_GROUND_TIME,
      maintenanceTime = this.DEFAULT_MAINTENANCE_TIME
    } = request;

    const waypoints: Waypoint[] = [];
    let currentTime = new Date(departureTime);
    let totalFlightTime = 0;

    // Adicionar ponto de origem
    waypoints.push({
      airport: origin,
      arrivalTime: currentTime,
      departureTime: currentTime,
      groundTime: 0,
      type: 'origin'
    });

    // Calcular rota de ida
    let previousAirport = origin;
    for (const destination of destinations) {
      const flightTime = this.calculateFlightTime(previousAirport, destination);
      totalFlightTime += flightTime;

      // Horário de chegada
      const arrivalTime = new Date(currentTime.getTime() + flightTime * 60 * 60 * 1000);
      
      // Horário de partida (após tempo em solo)
      const departureTime = new Date(arrivalTime.getTime() + groundTimePerDestination * 60 * 60 * 1000);

      waypoints.push({
        airport: destination,
        arrivalTime,
        departureTime,
        groundTime: groundTimePerDestination,
        type: 'destination'
      });

      currentTime = departureTime;
      previousAirport = destination;
    }

    // Calcular retorno à base
    const returnFlightTime = this.calculateFlightTime(previousAirport, origin);
    totalFlightTime += returnFlightTime;

    const returnArrivalTime = new Date(currentTime.getTime() + returnFlightTime * 60 * 60 * 1000);
    const maintenanceEndTime = new Date(returnArrivalTime.getTime() + maintenanceTime * 60 * 60 * 1000);

    waypoints.push({
      airport: origin,
      arrivalTime: returnArrivalTime,
      departureTime: returnArrivalTime,
      groundTime: 0,
      type: 'return'
    });

    // Calcular custos (apenas tempo de voo)
    const totalCost = totalFlightTime * 2800; // R$ 2800/hora

    return {
      totalFlightTime,
      totalGroundTime: destinations.length * groundTimePerDestination,
      maintenanceTime,
      totalBlockTime: totalFlightTime + (destinations.length * groundTimePerDestination) + maintenanceTime,
      estimatedReturnTime: returnArrivalTime,
      maintenanceEndTime,
      totalCost,
      waypoints
    };
  }

  /**
   * Calcula tempo de voo entre dois aeroportos
   */
  private static calculateFlightTime(origin: string, destination: string): number {
    // Buscar coordenadas dos aeroportos
    const originCoords = this.getAirportCoordinates(origin);
    const destCoords = this.getAirportCoordinates(destination);

    if (!originCoords || !destCoords) {
      throw new Error(`Coordenadas não encontradas para ${origin} ou ${destination}`);
    }

    // Calcular distância
    const distance = calculateDistance(
      originCoords.lat,
      originCoords.lon,
      destCoords.lat,
      destCoords.lon
    );

    // Velocidade média da aeronave (nós)
    const speed = getAircraftSpeed('cessna'); // Velocidade padrão

    // Converter distância de NM para horas
    const flightTimeHours = distance / speed;

    return flightTimeHours;
  }

  /**
   * Busca coordenadas do aeroporto na base local
   */
  private static getAirportCoordinates(icao: string): { lat: number, lon: number } | null {
    const BRAZILIAN_AIRPORTS = [
      { icao: 'SBAU', latitude: -21.1411, longitude: -50.4247 },
      { icao: 'SBSP', latitude: -23.6273, longitude: -46.6566 },
      { icao: 'SBGR', latitude: -23.4356, longitude: -46.4731 },
      { icao: 'SBKP', latitude: -23.0074, longitude: -47.1345 },
      { icao: 'SBBS', latitude: -22.3450, longitude: -49.0538 },
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
      { icao: 'SBCT', latitude: -25.5284, longitude: -49.1714 },
      { icao: 'SBLN', latitude: -23.3336, longitude: -51.1306 },
      { icao: 'SBFI', latitude: -25.6003, longitude: -54.4850 },
      { icao: 'SBPA', latitude: -29.9939, longitude: -51.1714 },
      { icao: 'SBCA', latitude: -29.1974, longitude: -51.1875 },
      { icao: 'SBPF', latitude: -28.2439, longitude: -52.3264 },
      { icao: 'SBVT', latitude: -20.2589, longitude: -40.2864 }
    ];

    const airport = BRAZILIAN_AIRPORTS.find(a => a.icao === icao.toUpperCase());
    
    if (airport) {
      return {
        lat: airport.latitude,
        lon: airport.longitude
      };
    }

    return null;
  }

  /**
   * Verifica se há conflito de horários
   */
  static checkScheduleConflict(
    aircraftId: number,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: number
  ): boolean {
    // Esta função será implementada com consulta ao banco
    // Por enquanto retorna false (sem conflito)
    return false;
  }

  /**
   * Encontra próximo horário disponível
   */
  static findNextAvailableTime(
    aircraftId: number,
    desiredStartTime: Date,
    missionDuration: number
  ): Date {
    // Esta função será implementada com consulta ao banco
    // Por enquanto retorna o horário desejado
    return desiredStartTime;
  }
}


