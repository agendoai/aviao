
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plane, MapPin, Clock, Plus, Trash2, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { searchAirports, calculateFlightDistance, getAirportByIATA, getPopularAirports, type Airport } from '../../utils/aviationstack';
import { searchAirportsByRegion, searchAirportsByName, getBrazilianAirports, getRegions, type AirportData } from '../../utils/airport-data-api';
import AirportSelector from './AirportSelector';
import { useToast } from '@/components/ui/use-toast';

interface Aircraft {
  id: string;
  name: string;
  registration: string;
  model: string;
}

interface Destination {
  id: string;
  icao: string;
  iata?: string;
  name: string;
  city?: string;
  country?: string;
  arrival: Date;
  departure: Date;
  airportFee: number;
  isOvernight: boolean;
  overnightFee: number;
  flightTime: number; // em minutos
}

interface MissionCreationProps {
  aircraft: Aircraft;
  initialTimeSlot: { start: Date; end: Date };
  onBack: () => void;
  onMissionCreated: (data: any) => void;
}

const MissionCreation: React.FC<MissionCreationProps> = ({ 
  aircraft: initialAircraft, 
  initialTimeSlot, 
  onBack,
  onMissionCreated
}) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [missionEndTime, setMissionEndTime] = useState<Date>(initialTimeSlot.end);
  const [manualReturnTime, setManualReturnTime] = useState<Date>(initialTimeSlot.end);
  const [useManualReturn, setUseManualReturn] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoadingAirports, setIsLoadingAirports] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const BASE_FBO = "Araçatuba-SBAU";

  // Mock airports data - em produção viria do ROTAER
  // const airports = [
  //   { icao: 'SBMT', name: 'Campo de Marte - São Paulo', flightTime: 90, airportFee: 200 },
  //   { icao: 'SBCG', name: 'Campo Grande', flightTime: 120, airportFee: 150 },
  //   { icao: 'SBSP', name: 'São Paulo/Congonhas', flightTime: 90, airportFee: 300 },
  //   { icao: 'SBRJ', name: 'Rio de Janeiro/Santos Dumont', flightTime: 150, airportFee: 350 },
  //   { icao: 'SBBR', name: 'Brasília', flightTime: 180, airportFee: 250 },
  //   { icao: 'SBPA', name: 'Porto Alegre', flightTime: 240, airportFee: 200 },
  //   { icao: 'SBSV', name: 'Salvador', flightTime: 300, airportFee: 200 },
  //   { icao: 'SBRF', name: 'Recife', flightTime: 360, airportFee: 180 },
  //   { icao: 'SBMN', name: 'Manaus', flightTime: 420, airportFee: 150 }
  // ];

  useEffect(() => {
    recalculateMission();
  }, [destinations, useManualReturn, manualReturnTime]);

  const validateMission = async () => {
    setIsValidating(true);
    const errors: string[] = [];

    // Validar conflitos com reservas existentes (+3h)
    // Em produção, fazer consulta ao Supabase
    
    // Validar saldo suficiente
    // Em produção, verificar saldo do usuário

    // Validar pré-reservas em consolidação
    // Em produção, verificar pré-reservas de menor prioridade

    setValidationErrors(errors);
    setIsValidating(false);
  };

  const addDestination = () => {
    // Saída sempre é de Araçatuba ou do último destino
    const departurePoint = destinations.length === 0 ? initialTimeSlot.start : destinations[destinations.length - 1].departure;
    
    const newDestination: Destination = {
      id: Date.now().toString(),
      icao: '',
      name: '',
      arrival: new Date(departurePoint.getTime() + 90 * 60 * 1000), // Chegada calculada baseada no tempo de voo
      departure: new Date(departurePoint.getTime() + 4 * 60 * 60 * 1000), // Partida 4h depois por padrão
      airportFee: 0,
      isOvernight: false,
      overnightFee: 0,
      flightTime: 90 // 1h30 padrão
    };
    
    setDestinations([...destinations, newDestination]);
  };

  const handleDestinationChange = (index: number, field: keyof Destination, value: any) => {
    const newDestinations = [...destinations];
    newDestinations[index] = { ...newDestinations[index], [field]: value };
    setDestinations(newDestinations);
  };

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter(dest => dest.id !== id));
  };

  const recalculateMission = () => {
    if (destinations.length === 0) {
      const finalTime = useManualReturn ? manualReturnTime : initialTimeSlot.end;
      setMissionEndTime(finalTime);
      setTotalCost(0);
      return;
    }

    let currentDepartureTime = new Date(initialTimeSlot.start);
    let totalFlightHours = 0;
    let totalAirportFees = 0;
    let totalOvernightFees = 0;

    // Recalcular cada destino sequencialmente
    const updatedDestinations = destinations.map((dest, index) => {
      // Calcular horário de chegada baseado no ponto de partida + tempo de voo
      const arrivalTime = new Date(currentDepartureTime.getTime() + dest.flightTime * 60 * 1000);
      
      // Verificar se é pernoite (data de partida é diferente da data de chegada)
      const arrivalDate = arrivalTime.getDate();
      const departureDate = dest.departure.getDate();
      const isOvernight = departureDate !== arrivalDate || dest.departure.getTime() > arrivalTime.getTime() + 24 * 60 * 60 * 1000;
      
      const overnightFee = isOvernight ? 1500 : 0;
      
      totalFlightHours += dest.flightTime / 60;
      totalAirportFees += dest.airportFee;
      totalOvernightFees += overnightFee;
      
      // Próximo ponto de partida será a saída deste destino
      currentDepartureTime = new Date(dest.departure.getTime());
      
      return {
        ...dest,
        arrival: arrivalTime,
        isOvernight,
        overnightFee
      };
    });

    let finalArrival: Date;
    
    if (useManualReturn) {
      // Usar horário manual de retorno
      finalArrival = new Date(manualReturnTime.getTime() - 3 * 60 * 60 * 1000); // -3h para calcular quando deve sair do último destino
    } else {
      // Calcular voo de retorno automaticamente (último destino para Araçatuba)
      const lastDestination = updatedDestinations[updatedDestinations.length - 1];
      const returnFlightTime = lastDestination.flightTime; // Mesmo tempo de volta
      finalArrival = new Date(lastDestination.departure.getTime() + returnFlightTime * 60 * 1000);
      totalFlightHours += returnFlightTime / 60;
    }
    
    // Se usar horário manual, calcular o tempo de voo do último destino até a chegada
    if (useManualReturn && updatedDestinations.length > 0) {
      const lastDestination = updatedDestinations[updatedDestinations.length - 1];
      const returnFlightTime = lastDestination.flightTime; // Mesmo tempo de volta
      totalFlightHours += returnFlightTime / 60;
    }
    
    // +3 horas para liberação da aeronave
    const missionEnd = new Date(finalArrival.getTime() + 3 * 60 * 60 * 1000);
    
    // Calcular custo total (usar hourly_rate da aeronave)
    const hourlyRate = 2800; // Usar valor padrão ou pegar do banco
    const flightCost = totalFlightHours * hourlyRate;
    const total = flightCost + totalAirportFees + totalOvernightFees;
    
    setDestinations(updatedDestinations);
    setMissionEndTime(useManualReturn ? manualReturnTime : missionEnd);
    setTotalCost(total);
  };

  const handleSearchAirports = async (query: string) => {
    if (query.length < 2) {
      setAirports([]);
      return;
    }

    setIsLoadingAirports(true);
    try {
      const results = await searchAirports(query);
      setAirports(results);
    } catch (error) {
      console.error('Erro ao buscar aeroportos:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar aeroportos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAirports(false);
    }
  };

  const handleAirportSelect = async (airport: AirportData, index: number) => {
    const newDestinations = [...destinations];
    newDestinations[index] = {
      ...newDestinations[index],
      name: airport.name,
      icao: airport.icao_code,
      iata: airport.iata_code,
      city: airport.city,
      country: airport.country_name
    };
    setDestinations(newDestinations);

    // Calcular distância se for o primeiro destino
    if (index === 0) {
      try {
        const distanceCalculation = await calculateFlightDistance('ARU', airport.iata_code);
        newDestinations[index] = {
          ...newDestinations[index],
          flightTime: distanceCalculation.estimated_flight_time_minutes
        };
        setDestinations(newDestinations);
      } catch (error) {
        console.error('Erro ao calcular distância:', error);
        // Usar tempo padrão se não conseguir calcular
        newDestinations[index] = {
          ...newDestinations[index],
          flightTime: 90
        };
        setDestinations(newDestinations);
      }
    }
  };

  const confirmMission = async () => {
    if (validationErrors.length > 0) return;

    const missionData = {
      aircraft: `${initialAircraft.model} ${initialAircraft.registration}`,
      start: initialTimeSlot.start,
      end: missionEndTime,
      destinations,
      totalCost,
      base: BASE_FBO,
      useManualReturn,
      manualReturnTime: useManualReturn ? manualReturnTime : null
    };

    onMissionCreated(missionData);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da missão */}
      <Card>
        <CardHeader className="bg-aviation-gradient text-white">
          <CardTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5" />
            <span>Nova Missão</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-aviation-blue" />
              <div>
                <div className="font-medium">Aeronave:</div>
                <div className="text-sm text-gray-600">{initialAircraft.model}</div>
                <div className="text-sm">{initialAircraft.registration}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-aviation-blue" />
              <div>
                <div className="font-medium">Saída:</div>
                <div className="text-sm text-gray-600">{BASE_FBO}</div>
                <div className="text-sm">{format(initialTimeSlot.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-aviation-blue" />
              <div>
                <div className="font-medium">Retorno:</div>
                <div className="text-sm text-gray-600">{BASE_FBO}</div>
                <div className="text-sm">{format(missionEndTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="font-medium">Custo Total:</div>
              <div className="text-lg font-bold text-aviation-blue">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Configuração de Retorno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-aviation-blue" />
            <span>Configuração de Retorno</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Switch
              id="manual-return"
              checked={useManualReturn}
              onCheckedChange={setUseManualReturn}
            />
            <Label htmlFor="manual-return">Definir horário de retorno manualmente</Label>
          </div>

          {useManualReturn ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="manual-return-time">Data e Hora de Retorno Desejada</Label>
                <Input
                  id="manual-return-time"
                  type="datetime-local"
                  value={format(manualReturnTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setManualReturnTime(new Date(e.target.value))}
                  className="mt-1"
                  min={format(initialTimeSlot.start, "yyyy-MM-dd'T'HH:mm")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  O retorno deve ser após a saída ({format(initialTimeSlot.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })})
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>Retorno Manual:</strong> O horário de retorno será exatamente como definido. 
                  Certifique-se de que há tempo suficiente entre a saída do último destino e o horário de retorno escolhido.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-sm text-gray-700">
                <strong>Retorno Automático:</strong> O horário de retorno será calculado automaticamente 
                baseado na saída do último destino mais o tempo de voo de volta.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destinos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-aviation-blue" />
            <span>Destinos da Missão</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {destinations.map((dest, index) => (
              <div key={index} className="space-y-2">
                <Label>Destino {index + 1}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <AirportSelector
                    onAirportSelect={(airport) => handleAirportSelect(airport, index)}
                    selectedAirport={dest.iata ? {
                      id: dest.id,
                      name: dest.name,
                      iata_code: dest.iata,
                      icao_code: dest.icao,
                      latitude: 0,
                      longitude: 0,
                      country_code: 'BR',
                      country_name: dest.country || 'Brazil',
                      city: dest.city || ''
                    } : undefined}
                    placeholder="Selecionar aeroporto..."
                  />
                  <Input
                    type="time"
                    value={format(dest.departure, "HH:mm")}
                    onChange={(e) => handleDestinationChange(index, 'departure', new Date(`${format(dest.departure, "yyyy-MM-dd")}T${e.target.value}`))}
                  />
                </div>
                {dest.name && (
                  <div className="text-sm text-gray-600">
                    <strong>{dest.name}</strong> ({dest.iata}) - {dest.city}, {dest.country}
                    {dest.flightTime && (
                      <span className="ml-2 text-aviation-blue">
                        • Tempo estimado: {Math.floor(dest.flightTime / 60)}h {dest.flightTime % 60}min
                      </span>
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDestination(dest.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addDestination}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Destino
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validações */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Problemas Identificados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-700 text-sm">• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Confirmação */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <Button 
          onClick={confirmMission}
          disabled={validationErrors.length > 0 || isValidating || destinations.length === 0}
          className="bg-aviation-gradient hover:opacity-90"
        >
          Prosseguir para Verificação
        </Button>
      </div>
    </div>
  );
};

export default MissionCreation;
