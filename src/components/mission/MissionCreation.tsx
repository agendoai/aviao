
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plane, MapPin, Clock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aircraft {
  id: string;
  name: string;
  registration: string;
  model: string;
}

interface Destination {
  id: string;
  icao: string;
  name: string;
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
  const [selectedAircraft, setSelectedAircraft] = useState(initialAircraft);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [missionEndTime, setMissionEndTime] = useState<Date>(initialTimeSlot.start);
  const [totalCost, setTotalCost] = useState(0);

  const BASE_FBO = "Araçatuba-SBAU";
  
  const availableAircraft = [
    { id: '1', name: 'Baron E55', registration: 'PR-FOM', model: 'Baron E55' },
    { id: '2', name: 'Cessna 172', registration: 'PR-ABC', model: 'Cessna 172' }
  ];

  // Mock airports data - em produção viria do ROTAER
  const airports = [
    { icao: 'SBMT', name: 'Campo de Marte - São Paulo', flightTime: 90, airportFee: 200 },
    { icao: 'SBCG', name: 'Campo Grande', flightTime: 120, airportFee: 150 },
    { icao: 'SBSP', name: 'São Paulo/Congonhas', flightTime: 90, airportFee: 300 },
    { icao: 'SBRJ', name: 'Rio de Janeiro/Santos Dumont', flightTime: 150, airportFee: 350 },
    { icao: 'SBBR', name: 'Brasília', flightTime: 180, airportFee: 250 },
    { icao: 'SBPA', name: 'Porto Alegre', flightTime: 240, airportFee: 200 },
    { icao: 'SBSV', name: 'Salvador', flightTime: 300, airportFee: 200 },
    { icao: 'SBRF', name: 'Recife', flightTime: 360, airportFee: 180 },
    { icao: 'SBMN', name: 'Manaus', flightTime: 420, airportFee: 150 }
  ];

  useEffect(() => {
    recalculateMission();
  }, [selectedAircraft, destinations]);

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

  const updateDestination = (id: string, field: keyof Destination, value: any) => {
    setDestinations(destinations.map(dest => 
      dest.id === id ? { ...dest, [field]: value } : dest
    ));
  };

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter(dest => dest.id !== id));
  };

  const recalculateMission = () => {
    if (destinations.length === 0) {
      setMissionEndTime(initialTimeSlot.start);
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

    // Calcular voo de retorno (último destino para Araçatuba)
    const lastDestination = updatedDestinations[updatedDestinations.length - 1];
    const returnFlightTime = lastDestination.flightTime; // Mesmo tempo de volta
    const finalArrival = new Date(lastDestination.departure.getTime() + returnFlightTime * 60 * 1000);
    
    // +3 horas para liberação da aeronave
    const missionEnd = new Date(finalArrival.getTime() + 3 * 60 * 60 * 1000);
    
    totalFlightHours += returnFlightTime / 60;
    
    // Calcular custo total
    const hourlyRate = selectedAircraft.id === '1' ? 2800 : 2400; // Baron vs Cessna
    const flightCost = totalFlightHours * hourlyRate;
    const total = flightCost + totalAirportFees + totalOvernightFees;
    
    setDestinations(updatedDestinations);
    setMissionEndTime(missionEnd);
    setTotalCost(total);
  };

  const confirmMission = async () => {
    if (validationErrors.length > 0) return;

    const missionData = {
      aircraft: `${selectedAircraft.model} ${selectedAircraft.registration}`,
      start: initialTimeSlot.start,
      end: missionEndTime,
      destinations,
      totalCost,
      base: BASE_FBO
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Seleção de aeronave */}
      <Card>
        <CardHeader>
          <CardTitle>Seleção da Aeronave</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedAircraft.id} 
            onValueChange={(value) => {
              const aircraft = availableAircraft.find(a => a.id === value);
              if (aircraft) setSelectedAircraft(aircraft);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableAircraft.map(aircraft => (
                <SelectItem key={aircraft.id} value={aircraft.id}>
                  {aircraft.model} {aircraft.registration}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>


      {/* Destinos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Destinos</CardTitle>
          <Button onClick={addDestination} size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Adicionar Destino</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {destinations.map((destination, index) => (
            <Card key={destination.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Destino #{index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDestination(destination.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Aeroporto</Label>
                  <Select 
                    value={destination.icao} 
                    onValueChange={(value) => {
                      const airport = airports.find(a => a.icao === value);
                      if (airport) {
                        updateDestination(destination.id, 'icao', value);
                        updateDestination(destination.id, 'name', airport.name);
                        updateDestination(destination.id, 'flightTime', airport.flightTime);
                        updateDestination(destination.id, 'airportFee', airport.airportFee);
                        
                        // Recalcular horário de chegada baseado no novo tempo de voo
                        const previousDeparture = index === 0 ? initialTimeSlot.start : destinations[index - 1].departure;
                        const newArrival = new Date(previousDeparture.getTime() + airport.flightTime * 60 * 1000);
                        updateDestination(destination.id, 'arrival', newArrival);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aeroporto" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map(airport => (
                        <SelectItem key={airport.icao} value={airport.icao}>
                          {airport.icao} - {airport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded">
                  <div>
                    <span className="font-medium">Chegada:</span><br />
                    {format(destination.arrival, "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div>
                    <span className="font-medium">Tempo de voo:</span><br />
                    {Math.floor(destination.flightTime / 60)}h {destination.flightTime % 60}min
                  </div>
                  <div>
                    <span className="font-medium">Taxa aeroporto:</span><br />
                    R$ {destination.airportFee}
                  </div>
                  {destination.isOvernight && (
                    <div>
                      <span className="font-medium text-orange-600">Pernoite:</span><br />
                      <span className="text-orange-600">R$ {destination.overnightFee}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label>Data/Hora de Partida deste destino</Label>
                  <Input
                    type="datetime-local"
                    value={format(destination.departure, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => updateDestination(destination.id, 'departure', new Date(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          {destinations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum destino adicionado</p>
              <p className="text-sm">Clique em "Adicionar Destino" para começar</p>
            </div>
          )}
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
