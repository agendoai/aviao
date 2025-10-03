import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { MapPin, Search, Plane, ArrowLeft, ArrowRight, Loader2, Globe, Calendar, Clock, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { format, addHours, addDays, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { searchAirports, getPopularAirports, calculateDistance, getAirportsByRegion, Airport, getAirportCoordinatesWithFallback, getAircraftSpeed, calculateTotalMissionCost, AirportFees, getAirportNameByICAO } from '@/utils/airport-search';
import IntelligentTimeSelectionStep from '../booking-flow/IntelligentTimeSelectionStep';
import { getAircrafts } from '@/utils/api';
import { formatBrazilTime } from '@/utils/dateUtils';
import { useMemo } from 'react';

interface BaseDestinationFlowProps {
  selectedAircraft: any;
  departureDate: Date;
  departureTime: string;
  onFlowCompleted: (missionData: MissionData) => void;
  onBack: () => void;
}

interface MissionData {
  origin: string;
  destinations: Destination[];
  departureDate: Date;
  departureTime: string;
  returnDate: Date;
  returnTime: string;
  totalFlightTime: number;
  totalGroundTime: number;
  totalCost: number;
  overnightStays: number;
  overnightCost: number;
  hourlyCost: number;
  airportFees: number;
  feeBreakdown: { [icao: string]: AirportFees };
  maintenanceTime: number; // Tempo de manutenção em solo (3h)
  totalOccupancyTime: number; // Tempo total ocupado (voo + manutenção)
  waypoints: Waypoint[];
}

interface Destination {
  airport: Airport;
  type: 'main' | 'stopover' | 'secondary';
  groundTime: number; // horas em solo
  arrivalTime: Date;
  departureTime: Date;
}

interface Waypoint {
  airport: string;
  arrivalTime: Date;
  departureTime: Date;
  groundTime: number;
  type: 'origin' | 'destination' | 'return';
}

const BaseDestinationFlow: React.FC<BaseDestinationFlowProps> = ({
  selectedAircraft,
  departureDate,
  departureTime,
  onFlowCompleted,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState<'base' | 'destinations' | 'calculation' | 'confirmation'>('base');
  const [origin, setOrigin] = useState<Airport | null>({
    icao: 'SBAU',
    iata: 'AQA',
    name: 'Araçatuba',
    city: 'Araçatuba',
    state: 'SP',
    country: 'BR',
    latitude: -21.1411,
    longitude: -50.4247
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [missionCalculation, setMissionCalculation] = useState<MissionData | null>(null);
  const [returnTime, setReturnTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [selectedAirports, setSelectedAirports] = useState<{[icao: string]: 'main' | 'stopover' | 'secondary'}>({});
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [currentAircraft, setCurrentAircraft] = useState<any>(null);
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Usar departureDate se fornecido, senão data atual
    const baseDate = departureDate || new Date();
    
    // INICIAR NA SEMANA da data base
    const currentWeekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    
    return currentWeekStart;
  });

  // Buscar aeroportos populares ao carregar
  useEffect(() => {
    setAirports(getPopularAirports());
  }, []);

  // Memoizar currentMonth para evitar recálculos desnecessários
  const currentMonth = useMemo(() => {
    // SEMPRE usar departureDate para evitar mudanças de timezone
    const month = new Date(departureDate);
    return month;
  }, [departureDate]); // ✅ Removido returnDate das dependências

  // Carregar aeronaves
  useEffect(() => {
    const fetchAircrafts = async () => {
      try {
        const aircraftsData = await getAircrafts();
        setAircrafts(aircraftsData);
        
        // Selecionar primeira aeronave disponível
        if (aircraftsData.length > 0) {
          const availableAircraft = aircraftsData.find(a => a.status === 'available');
          if (availableAircraft) {
            setCurrentAircraft(availableAircraft);
          } else {
            setCurrentAircraft(aircraftsData[0]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar aeronaves:', error);
        toast.error('Erro ao carregar aeronaves');
      }
    };

    fetchAircrafts();
  }, []);

  // Buscar aeroportos quando o termo de busca mudar
  useEffect(() => {
    if (searchTerm.length < 2) {
      setAirports(getPopularAirports());
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAirports(searchTerm);
        setAirports(results);
      } catch (error) {
        console.error('Erro ao buscar aeroportos:', error);
        setAirports(getPopularAirports());
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchTerm]);



  const handleAddDestination = (airport: Airport, type: 'main' | 'stopover' | 'secondary') => {
    const newDestination: Destination = {
      airport,
      type,
      groundTime: 0, // tempo em solo removido
      arrivalTime: new Date(), // será calculado
      departureTime: new Date() // será calculado
    };
    setDestinations([...destinations, newDestination]);
    setSelectedAirports(prev => ({ ...prev, [airport.icao]: type }));
  };

  const handleRemoveDestination = (index: number) => {
    const removedDestination = destinations[index];
    setDestinations(destinations.filter((_, i) => i !== index));
    setSelectedAirports(prev => {
      const newSelected = { ...prev };
      delete newSelected[removedDestination.airport.icao];
      return newSelected;
    });
  };



  const calculateMission = async () => {
    // console.log('🔍 calculateMission chamado');
    // console.log('🔍 Estado atual:');
    // console.log('🔍 destinations.length:', destinations.length);
    // console.log('🔍 returnDate:', returnDate, 'tipo:', typeof returnDate);
    // console.log('🔍 returnTime:', returnTime, 'tipo:', typeof returnTime);
    // console.log('🔍 departureDate:', departureDate, 'tipo:', typeof departureDate);
    // console.log('🔍 departureTime:', departureTime, 'tipo:', typeof departureTime);
    
    // Verificar se departureDate é um objeto Date
    if (departureDate instanceof Date) {
      // console.log('🔍 departureDate é Date:', departureDate.toISOString());
    } else {
      // console.log('🔍 departureDate não é Date:', departureDate);
    }
    
    if (destinations.length === 0) {
      toast.error('Selecione pelo menos um destino');
      return;
    }

    if (!returnTime) {
      toast.error('Defina o horário de retorno à base');
      return;
    }

    if (!returnDate) {
      toast.error('Defina a data de retorno à base');
      return;
    }

    // console.log('🔍 Dados para cálculo da missão:');
    // console.log('🔍 Data de partida:', departureDate);
    // console.log('🔍 Horário de partida:', departureTime);
    // console.log('🔍 Data de retorno:', returnDate);
    // console.log('🔍 Horário de retorno:', returnTime);
    // console.log('🔍 Destinos:', destinations.map(d => d.airport.icao));
    
    // Logs detalhados para debug de timezone
    let departureDateTime: Date;
    let returnDateTime: Date;
    
    // Criar departureDateTime de forma segura (hora local)
    if (departureDate instanceof Date) {
      departureDateTime = new Date(departureDate);
      departureDateTime.setHours(parseInt(departureTime.split(':')[0]), parseInt(departureTime.split(':')[1]), 0, 0);
    } else {
      // Se departureDate for string, criar como Date local
      const [depYear, depMonth, depDay] = departureDate.split('-').map(Number);
      const [depHour, depMinute] = departureTime.split(':').map(Number);
      departureDateTime = new Date(depYear, depMonth - 1, depDay, depHour, depMinute, 0, 0);
    }
    
    // Criar returnDateTime de forma segura (hora local)
    const [returnYear, returnMonth, returnDay] = returnDate.split('-').map(Number);
    const [returnHour, returnMinute] = returnTime.split(':').map(Number);
    returnDateTime = new Date(returnYear, returnMonth - 1, returnDay, returnHour, returnMinute, 0, 0);
    
    // console.log('🔍 DEBUG TIMESTAMP:');
    // console.log('🔍 departureDate:', departureDate);
    // console.log('🔍 departureTime:', departureTime);
    // console.log('🔍 returnDate:', returnDate);
    // console.log('🔍 returnTime:', returnTime);
    // console.log('🔍 departureDateTime criado:', departureDateTime);
    // console.log('🔍 returnDateTime criado:', returnDateTime);
    // console.log('🔍 departureDateTime válido:', !isNaN(departureDateTime.getTime()));
    // console.log('🔍 returnDateTime válido:', !isNaN(returnDateTime.getTime()));
    
    // Verificar se as datas são válidas antes de tentar converter
    if (isNaN(departureDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
      console.error('❌ Datas inválidas criadas:', { departureDateTime, returnDateTime });
      toast.error('Data ou horário inválido. Verifique os valores selecionados.');
      return;
    }
    
    // console.log('🔍 departureDateTime (local):', departureDateTime.toLocaleString('pt-BR'));
    // console.log('🔍 returnDateTime (local):', returnDateTime.toLocaleString('pt-BR'));
    // console.log('🔍 departureDateTime (ISO):', departureDateTime.toISOString());
    // console.log('🔍 returnDateTime (ISO):', returnDateTime.toISOString());
    // console.log('🔍 departureDateTime (hora):', departureDateTime.getHours());
    // console.log('🔍 returnDateTime (hora):', returnDateTime.getHours());
    
    // Verificar se os dados estão válidos
    if (!returnDate || !returnTime) {
      console.error('❌ Dados de retorno inválidos:', { returnDate, returnTime });
      toast.error('Selecione data e horário de retorno no calendário inteligente');
      return;
    }

    // Validar se a data de retorno não é anterior à data de partida
    // console.log('🔍 Validação de datas:');
    // console.log('🔍 departureDateTime:', departureDateTime.toISOString());
    // console.log('🔍 returnDateTime:', returnDateTime.toISOString());
    
    if (returnDateTime < departureDateTime) {
      toast.error('A data/hora de retorno não pode ser anterior à data/hora de partida');
      return;
    }

    const waypoints: Waypoint[] = [];
    let currentTime = new Date(departureDate);
    currentTime.setHours(parseInt(departureTime.split(':')[0]), parseInt(departureTime.split(':')[1]), 0, 0);
    
    let totalFlightTime = 0;

    // Ponto de origem
    waypoints.push({
      airport: origin.icao,
      arrivalTime: currentTime,
      departureTime: currentTime,
      groundTime: 0,
      type: 'origin'
    });

    // Calcular rota de ida
    let previousAirport = origin;
    // console.log('🔍 Calculando rota com destinos:', destinations.map(d => d.airport.icao));
    
    for (const destination of destinations) {
      const flightTime = calculateFlightTime(previousAirport, destination.airport);
      totalFlightTime += flightTime;
      
      // console.log(`🔍 ${previousAirport.icao} → ${destination.airport.icao}: ${flightTime.toFixed(2)}h (${(flightTime * 60).toFixed(0)}min)`);

      // Horário de chegada
      const arrivalTime = new Date(currentTime.getTime() + flightTime * 60 * 60 * 1000);
      
      // Horário de partida (sem tempo em solo)
      const departureTime = new Date(arrivalTime.getTime());

      destination.arrivalTime = arrivalTime;
      destination.departureTime = departureTime;

      waypoints.push({
        airport: destination.airport.icao,
        arrivalTime,
        departureTime,
        groundTime: 0,
        type: 'destination'
      });

      currentTime = departureTime;
      previousAirport = destination.airport;
    }

         // Calcular retorno à base - usar exatamente o horário que o usuário definiu
    const returnFlightTime = calculateFlightTime(previousAirport, origin);
    totalFlightTime += returnFlightTime;
    
    // console.log(`🔍 ${previousAirport.icao} → ${origin.icao}: ${returnFlightTime.toFixed(2)}h (${(returnFlightTime * 60).toFixed(0)}min)`);
    // console.log(`🔍 Tempo total de voo: ${totalFlightTime.toFixed(2)}h (${(totalFlightTime * 60).toFixed(0)}min)`);

     // Usar exatamente o horário que o usuário definiu
     const arrivalAtBase = new Date(`${returnDate}T${returnTime}:00`);

    waypoints.push({
      airport: origin.icao,
       arrivalTime: arrivalAtBase,
       departureTime: arrivalAtBase,
      groundTime: 0,
      type: 'return'
    });

    // Calcular taxa de pernoite baseada na diferença de datas e horários
    let overnightStays = 0;
    
    // Calcular diferença em milissegundos
    const timeDiff = returnDateTime.getTime() - departureDateTime.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    // console.log('🔍 Cálculo de pernoite:');
    // console.log('🔍 Partida:', departureDateTime.toISOString());
    // console.log('🔍 Retorno:', returnDateTime.toISOString());
    // console.log('🔍 Diferença em horas:', hoursDiff);
    
    // Verificar se as datas são diferentes
    const departureDateOnly = departureDateTime.toDateString();
    const returnDateOnly = returnDateTime.toDateString();
    const datesAreDifferent = departureDateOnly !== returnDateOnly;
    
    // console.log('🔍 Data de partida (string):', departureDateOnly);
    // console.log('🔍 Data de retorno (string):', returnDateOnly);
    // console.log('🔍 Datas são diferentes?', datesAreDifferent);
    
    if (datesAreDifferent) {
      // Se as datas são diferentes, calcular quantas noites
      const daysDiff = Math.floor(hoursDiff / 24);
      overnightStays = daysDiff;
      // console.log('🔍 Pernoite detectada: datas diferentes =', overnightStays, 'noites');
    } else {
      // Mesmo dia, verificar se passa da meia-noite
      const departureHour = parseInt(departureTime.split(':')[0]);
      const returnHour = parseInt(returnTime.split(':')[0]);
      
      if (returnHour < departureHour && returnHour < 6) {
        // Retorno entre 00:00 e 05:59, partida depois = pernoite
        overnightStays = 1;
        // console.log('🔍 Pernoite detectada: retorno após meia-noite (mesmo dia)');
      }
    }
    
    // console.log('🔍 Pernoites calculadas:', overnightStays);
    
    // Calcular custos totais incluindo taxas aeroportuárias
    const hourlyRate = selectedAircraft?.hourly_rate || 2800;
    const overnightRate = selectedAircraft?.overnight_fee || 1500;
    
    const destinationIcaos = destinations.map(d => d.airport.icao);
    
    try {
      const costCalculation = await calculateTotalMissionCost(
        origin.icao,
        destinationIcaos,
        totalFlightTime,
        hourlyRate,
        overnightStays,
        overnightRate
      );
      
      // Tempo de manutenção em solo (não cobrado)
      const maintenanceTime = 3; // 3 horas para manutenção
      const totalOccupancyTime = totalFlightTime + maintenanceTime;

    // Logs para debug das datas finais
    // console.log('🔍 Datas finais para missionData:');
    // console.log('🔍 departureDate original:', departureDate);
    // console.log('🔍 departureDate convertido:', departureDate instanceof Date ? departureDate : new Date(departureDate));
    // console.log('🔍 returnDate original:', returnDate);
    
    // Criar returnDate de forma segura (hora local)
    const [returnYear, returnMonth, returnDay] = returnDate.split('-').map(Number);
    const finalReturnDate = new Date(returnYear, returnMonth - 1, returnDay, 0, 0, 0, 0);
    // console.log('🔍 returnDate convertido (local):', finalReturnDate);
    
    const missionData: MissionData = {
      origin: origin.icao,
      destinations,
      departureDate: departureDate, // Já é um Date
      departureTime,
      returnDate: finalReturnDate, // Data local correta
      returnTime: returnTime,
      totalFlightTime,
      totalGroundTime: 0,
      totalCost: costCalculation.totalCost,
      overnightStays,
      overnightCost: costCalculation.overnightCost,
      hourlyCost: costCalculation.hourlyCost,
      airportFees: costCalculation.airportFees,
      feeBreakdown: costCalculation.feeBreakdown,
      maintenanceTime,
      totalOccupancyTime,
      waypoints
    };

    setMissionCalculation(missionData);
    setCurrentStep('confirmation');
    toast.success('Missão calculada com sucesso!');
    } catch (error) {
      console.error('Erro ao calcular custos:', error);
      toast.error('Erro ao calcular custos da missão');
    }
  };

  const calculateFlightTime = (origin: Airport, destination: Airport): number => {
    // Valores fixos corretos para rotas conhecidas
    if (origin.icao === 'SBAU' && destination.icao === 'SBKP') {
      return 1.17; // 1h10min = 1.17 horas (SBAU → SBKP)
    }
    if (origin.icao === 'SBKP' && destination.icao === 'SBAU') {
      return 1.17; // 1h10min = 1.17 horas (SBKP → SBAU)
    }
    
    // Para outras rotas, usar cálculo normal
    const distance = calculateDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );
    const speed = getAircraftSpeed(selectedAircraft?.model || 'cessna');
    
    const flightTime = (distance / speed) * 1.1; // retorna em horas + 10% para tráfego aéreo
    
    return flightTime;
  };

  const handleConfirmMission = () => {
    if (missionCalculation) {
      onFlowCompleted(missionCalculation);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
                 <div>
           <h2 className="text-xl font-bold text-gray-900">Planejamento de Missão</h2>
           <p className="text-sm text-gray-600">SBAU (Araçatuba) → Destino(s) → SBAU</p>
         </div>
        <Button variant="outline" size="sm" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-6">
        {['base', 'destinations', 'calculation', 'confirmation'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step 
                ? 'bg-sky-500 text-white' 
                : index < ['base', 'destinations', 'calculation', 'confirmation'].indexOf(currentStep)
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            {index < 3 && (
              <div className={`w-12 h-1 mx-2 ${
                index < ['base', 'destinations', 'calculation', 'confirmation'].indexOf(currentStep)
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

             {/* Step 1: Base Selection */}
       {currentStep === 'base' && (
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center space-x-2">
               <MapPin className="h-5 w-5" />
               <span>1. Base de Origem</span>
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg">
               <div className="flex items-center space-x-3">
                 <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
                   <MapPin className="h-6 w-6 text-white" />
                 </div>
                 <div>
                   <div className="font-bold text-lg text-sky-900">{origin?.name}</div>
                   <div className="text-sm text-sky-700">
                     {origin?.city}, {origin?.state} - {origin?.icao}
                   </div>
                   <div className="text-xs text-sky-600 mt-1">
                     Base fixa do clube - todas as missões partem e retornam aqui
                   </div>
                 </div>
                 <Badge className="bg-sky-500 text-white ml-auto">Base Fixa</Badge>
               </div>
             </div>

             <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
               <div className="font-medium mb-2">Informações da Base:</div>
               <ul className="space-y-1 text-xs">
                 <li>• Todas as missões partem de Araçatuba (SBAU)</li>
                 <li>• Retorno obrigatório à base após conclusão da missão</li>
                 <li>• Coordenadas: {origin?.latitude}, {origin?.longitude}</li>
                 <li>• Aeroporto de Araçatuba - SP</li>
               </ul>
             </div>

             <Button 
               onClick={() => setCurrentStep('destinations')}
               className="w-full bg-sky-500 hover:bg-sky-600"
             >
               Continuar para Destinos
               <ArrowRight className="h-4 w-4 ml-2" />
             </Button>
           </CardContent>
         </Card>
       )}

      {/* Step 2: Destinations */}
      {currentStep === 'destinations' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>2. Destinos da Missão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Buscar Destino</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome da cidade ou código do aeroporto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aeroportos Disponíveis</Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Buscando...</span>
                  </div>
                ) : (
                  airports.map((airport) => (
                    <div
                      key={airport.icao}
                      className="p-3 border border-gray-200 rounded-lg hover:border-sky-300 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{airport.name}</div>
                          <div className="text-sm text-gray-600">
                            {airport.city}, {airport.state} - {airport.icao}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                             variant={selectedAirports[airport.icao] === 'main' ? 'default' : 'outline'}
                             className={selectedAirports[airport.icao] === 'main' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                            onClick={() => handleAddDestination(airport, 'main')}
                          >
                            Primeiro Destino
                          </Button>
                          <Button
                            size="sm"
                             variant={selectedAirports[airport.icao] === 'secondary' ? 'default' : 'outline'}
                             className={selectedAirports[airport.icao] === 'secondary' ? 'bg-gray-500 hover:bg-gray-600 text-white' : ''}
                            onClick={() => handleAddDestination(airport, 'secondary')}
                          >
                            Segundo Destino
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Destinos Selecionados */}
            {destinations.length > 0 && (
              <div className="space-y-3">
                <Label>Destinos Selecionados</Label>
                {destinations.map((dest, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{dest.airport.name}</div>
                        <div className="text-sm text-gray-600">
                          {dest.airport.city}, {dest.airport.state} - {dest.airport.icao}
                        </div>
                        <Badge variant={
                          dest.type === 'main' ? 'default' : 'outline'
                        }>
                          {dest.type === 'main' ? 'Primeiro Destino' : 'Segundo Destino'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveDestination(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

                           {/* Horário de Retorno */}
                             <div className="space-y-2">
                 <Label>Horário de Retorno à Base</Label>
                 <p className="text-xs text-gray-500">
                   Selecione a data e horário que deseja retornar à base (SBAU) usando o calendário inteligente
                 </p>
                 
                 {/* Status da seleção */}
                 <div className="text-xs text-gray-600">
                   {returnDate && returnTime ? (
                     <span className="text-green-600 font-medium">
                       ✅ Data/Hora selecionada: {returnDate} às {returnTime}
                     </span>
                   ) : (
                     <span className="text-orange-600">
                       ⚠️ Clique em um horário disponível no calendário para selecionar
                     </span>
                   )}
                 </div>
                 
                 {/* Calendário Inteligente */}
                 {currentAircraft && (
                   <Card className="mt-3 border-2 border-green-200 bg-green-50">
                     <CardContent className="p-2">
                       <div className="text-sm text-green-700 mb-2 font-medium flex items-center">
                         🎯 Calendário Inteligente (30min) - {currentAircraft.registration}
                         <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded">Disponibilidade em Tempo Real</span>
                       </div>
                       <IntelligentTimeSelectionStep
                         title={destinations.some(dest => dest.type === 'secondary') 
                           ? "Selecione os horários da missão com destino secundário"
                           : "Selecione o horário de retorno à base"
                         }
                         selectedDate={returnDate ? new Date(returnDate).getDate().toString() : departureDate.getDate().toString()}
                         currentMonth={currentMonth}
                         selectedAircraft={currentAircraft}
                         departureDateTime={(() => {
                           // CORREÇÃO: Usar data local brasileira em vez de UTC
                           const year = departureDate.getFullYear();
                           const month = String(departureDate.getMonth() + 1).padStart(2, '0');
                           const day = String(departureDate.getDate()).padStart(2, '0');
                           const localDateString = `${year}-${month}-${day}`;
                           return new Date(`${localDateString}T${departureTime}`);
                         })()}
                         isReturnSelection={true}
                         selectedAirport={destinations.find(dest => dest.type === 'main')?.airport.icao}
                         hasSecondaryDestination={destinations.some(dest => dest.type === 'secondary')}
                         selectedDestinations={{
                           primary: destinations.find(dest => dest.type === 'main')?.airport.icao,
                           secondary: destinations.find(dest => dest.type === 'secondary')?.airport.icao
                         }}
                         onAutoAdvance={() => {
                           // Auto-avançar para próxima etapa após seleção
                         }}
                         onTimeSelect={(timeSlot) => {
                           
                           // Se timeSlot é um objeto com start/end (do IntelligentTimeSelectionStep)
                           if (typeof timeSlot === 'object' && timeSlot.start) {
                             // CORREÇÃO CRÍTICA: Se timeSlot.start já é um objeto Date, usar diretamente
                             // Se é uma string, usar new Date() pode causar problemas de timezone
                             let selectedDate;
                             
                             if (timeSlot.start instanceof Date) {
                               // Já é um Date object, usar diretamente
                               selectedDate = timeSlot.start;
                             } else {
                               // É uma string, converter com cuidado
                               selectedDate = new Date(timeSlot.start);
                             }
                             
                             // CORREÇÃO: Usar getters locais para evitar mudança de dia por timezone
                             const year = selectedDate.getFullYear();
                             const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                             const day = String(selectedDate.getDate()).padStart(2, '0');
                             const formattedDate = `${year}-${month}-${day}`;
                             // Usar horário em fuso do Brasil
                             const formattedTime = formatBrazilTime(selectedDate);
                             
                             setReturnDate(formattedDate);
                             setReturnTime(formattedTime);
                             
                             // Mostrar toast imediatamente
                             toast.success(`Data/Hora de retorno selecionada: ${formattedDate} às ${formattedTime}`);
                           } else {
                             // Fallback para string (compatibilidade)
                             const time = timeSlot.toString();
                             const today = new Date();
                             const [hours, minutes] = time.split(':');
                             const selectedDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
                             // CORREÇÃO: Usar formatação local em vez de UTC para evitar mudança de dia
                             const year = selectedDateTime.getFullYear();
                             const month = String(selectedDateTime.getMonth() + 1).padStart(2, '0');
                             const day = String(selectedDateTime.getDate()).padStart(2, '0');
                             const formattedDate = `${year}-${month}-${day}`;
                             
                             // console.log('🔍 Usando fallback - Data formatada:', formattedDate);
                             // console.log('🔍 Usando fallback - Horário formatado:', time);
                             
                             setReturnDate(formattedDate);
                             // CORREÇÃO: alinhar horário com exibição do calendário (UTC, quando aplicável)
                             const asDate = new Date(`${formattedDate}T${time}:00Z`);
                             setReturnTime(formatBrazilTime(asDate));
                             
                             // Mostrar toast imediatamente
                             toast.success(`Data/Hora de retorno selecionada: ${formattedDate} às ${time}`);
                           }
                         }}
                         onAircraftSelect={(aircraft) => setCurrentAircraft(aircraft)}
                         onBack={() => {}}
                       />
                     </CardContent>
                   </Card>
                 )}
                 
                 {!currentAircraft && (
                   <div className="text-xs text-orange-600 mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                     ⚠️ Carregando aeronaves... O calendário inteligente estará disponível em breve.
                   </div>
                 )}
               </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep('base')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={calculateMission}
                disabled={destinations.length === 0 || !returnTime || !returnDate}
                className="flex-1"
              >
                {destinations.length === 0 ? 'Selecione um destino' : 
                 !returnTime || !returnDate ? 'Continuar' : 
                 'Calcular Missão'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Mission Confirmation */}
      {currentStep === 'confirmation' && missionCalculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>3. Confirmação da Missão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo da Missão */}
              <div className="space-y-2">
               <Label>Resumo da Missão</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                   <div className="flex justify-between">
                     <span>Partida de {missionCalculation.origin}:</span>
                     <span>{format(departureDate, 'dd/MM/yyyy')} às {departureTime}</span>
                  </div>
                   <div className="flex justify-between">
                     <span>Retorno a {missionCalculation.origin}:</span>
                     <span>{(() => {
                       try {
                         const [y, m, d] = (returnDate || format(missionCalculation.returnDate, 'yyyy-MM-dd')).split('-').map(Number);
                         const localReturnDate = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
                         return `${format(localReturnDate, 'dd/MM/yyyy')} às ${returnTime || missionCalculation.returnTime}`;
                       } catch {
                         return `${format(missionCalculation.returnDate, 'dd/MM/yyyy')} às ${missionCalculation.returnTime}`;
                       }
                     })()}</span>
                  </div>
                  

                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Duração total:</span>
                      <span>{Math.floor(missionCalculation.totalFlightTime)}h{missionCalculation.totalFlightTime % 1 > 0 ? ` ${Math.round((missionCalculation.totalFlightTime % 1) * 60)}min` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pernoites:</span>
                      <span>{missionCalculation.overnightStays} {missionCalculation.overnightStays > 1 ? 'noites' : 'noite'}</span>
                    </div>
                    
                    {/* Detalhamento da rota */}
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="text-xs font-medium text-gray-600 mb-1">Rota detalhada:</div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>{getAirportNameByICAO('SBAU')} → {getAirportNameByICAO(destinations[0]?.airport.icao || '')}: {Math.round(calculateFlightTime(origin!, destinations[0]?.airport!) * 60)}min</div>
                        {destinations.length > 1 && (
                          <div>{getAirportNameByICAO(destinations[0]?.airport.icao || '')} → {getAirportNameByICAO(destinations[1]?.airport.icao || '')}: {Math.round(calculateFlightTime(destinations[0]?.airport!, destinations[1]?.airport!) * 60)}min</div>
                        )}
                        <div>{getAirportNameByICAO(destinations[destinations.length - 1]?.airport.icao || '')} → {getAirportNameByICAO('SBAU')}: {Math.round(calculateFlightTime(destinations[destinations.length - 1]?.airport!, origin!) * 60)}min</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                    {Math.floor(missionCalculation.totalFlightTime)}h{missionCalculation.totalFlightTime % 1 > 0 ? ` ${Math.round((missionCalculation.totalFlightTime % 1) * 60)}min` : ''}
                </div>
                <div className="text-sm text-blue-600">Tempo de Voo</div>
              </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {missionCalculation.overnightStays}
                </div>
                  <div className="text-sm text-orange-600">Pernoites</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                     R$ {missionCalculation.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-purple-600">Custo Total</div>
              </div>
              </div>

                         {/* Detalhamento de Custos */}
             <div className="bg-gray-50 p-4 rounded-lg">
               <h4 className="font-semibold mb-3">Detalhamento de Custos:</h4>
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <span>Custo por hora de voo:</span>
                   <span>R$ {missionCalculation.hourlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 {missionCalculation.overnightStays > 0 && (
                   <div className="flex justify-between text-orange-600">
                     <span>Taxa de pernoite ({missionCalculation.overnightStays} {missionCalculation.overnightStays > 1 ? 'noites' : 'noite'}):</span>
                     <span>R$ {missionCalculation.overnightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                   </div>
                 )}
                                   {/* Separar taxas de navegação e aeroporto */}
                 {Object.keys(missionCalculation.feeBreakdown).length > 0 && (
                   <>
                     {/* Taxas de Navegação */}
                     {Object.entries(missionCalculation.feeBreakdown).some(([_, fees]) => fees.navigation_fee > 0) && (
                       <div className="flex justify-between text-green-600">
                         <span>Tarifas de navegação:</span>
                         <span>R$ {Object.entries(missionCalculation.feeBreakdown)
                           .reduce((total, [_, fees]) => total + (fees.navigation_fee || 0), 0)
                           .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                       </div>
                     )}
                     
                     {/* Taxas de Aeroporto (pouso + decolagem + estacionamento + terminal) */}
                     {Object.entries(missionCalculation.feeBreakdown).some(([_, fees]) => (fees.landing_fee || 0) + (fees.takeoff_fee || 0) + (fees.parking_fee || 0) + (fees.terminal_fee || 0) > 0) && (
                       <div className="flex justify-between text-blue-600">
                         <span>Taxas de aeroportos:</span>
                         <span>R$ {Object.entries(missionCalculation.feeBreakdown)
                           .reduce((total, [_, fees]) => total + (fees.landing_fee || 0) + (fees.takeoff_fee || 0) + (fees.parking_fee || 0) + (fees.terminal_fee || 0), 0)
                           .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                       </div>
                     )}
                   </>
                 )}
                 <div className="border-t pt-2 flex justify-between font-bold">
                   <span>Total:</span>
                   <span>R$ {missionCalculation.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
               </div>
               
                               {/* Detalhamento das taxas por aeroporto */}
                {Object.keys(missionCalculation.feeBreakdown).length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Detalhamento por Aeroporto:</h5>
                    <div className="space-y-2 text-sm">
                      {Object.entries(missionCalculation.feeBreakdown).map(([icao, fees]) => (
                        <div key={icao} className="border border-blue-200 rounded p-2 bg-white">
                          <div className="font-medium text-blue-800 mb-1">{icao} (destino):</div>
                          <div className="space-y-1">
                            {fees.navigation_fee > 0 && (
                              <div className="flex justify-between text-green-700">
                                <span>Tarifa de navegação:</span>
                                <span>R$ {fees.navigation_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {/* Detalhamento individual das taxas de aeroporto */}
                            {fees.landing_fee > 0 && (
                              <div className="flex justify-between text-blue-700">
                                <span>• Taxa de pouso:</span>
                                <span>R$ {fees.landing_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {fees.takeoff_fee > 0 && (
                              <div className="flex justify-between text-blue-700">
                                <span>• Taxa de decolagem:</span>
                                <span>R$ {fees.takeoff_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {fees.parking_fee > 0 && (
                              <div className="flex justify-between text-blue-700">
                                <span>• Taxa de estacionamento:</span>
                                <span>R$ {fees.parking_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {fees.terminal_fee > 0 && (
                              <div className="flex justify-between text-blue-700">
                                <span>• Taxa de terminal:</span>
                                <span>R$ {fees.terminal_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="border-t pt-1 flex justify-between font-medium text-blue-800">
                              <span>Subtotal:</span>
                              <span>R$ {fees.total_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Taxas dos destinos apenas. Base de origem (SBAU) não cobra taxas aeroportuárias.
                    </p>
                  </div>
                )}
               
               <p className="text-xs text-gray-500 mt-2">
                 Taxa de pernoite cobrada quando o voo passa de 00:00h ou envolve datas diferentes
               </p>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep('destinations')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleConfirmMission} className="flex-1">
                Confirmar Missão
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BaseDestinationFlow;
