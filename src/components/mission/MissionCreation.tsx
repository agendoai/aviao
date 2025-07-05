
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
}

interface MissionCreationProps {
  aircraft: Aircraft;
  initialTimeSlot: { start: Date; end: Date };
  onBack: () => void;
}

const MissionCreation: React.FC<MissionCreationProps> = ({ 
  aircraft: initialAircraft, 
  initialTimeSlot, 
  onBack 
}) => {
  const [selectedAircraft, setSelectedAircraft] = useState(initialAircraft);
  const [startDateTime, setStartDateTime] = useState(initialTimeSlot.start);
  const [endDateTime, setEndDateTime] = useState(initialTimeSlot.end);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const BASE_FBO = "Araçatuba-SBAU";
  
  const availableAircraft = [
    { id: '1', name: 'Baron E55', registration: 'PR-FOM', model: 'Baron E55' },
    { id: '2', name: 'Cessna 172', registration: 'PR-ABC', model: 'Cessna 172' }
  ];

  // Mock airports data - em produção viria do ROTAER
  const airports = [
    { icao: 'SBMT', name: 'Campo Grande' },
    { icao: 'SBSP', name: 'São Paulo/Congonhas' },
    { icao: 'SBRJ', name: 'Rio de Janeiro/Santos Dumont' },
    { icao: 'SBBR', name: 'Brasília' },
    { icao: 'SBPA', name: 'Porto Alegre' },
    { icao: 'SBSV', name: 'Salvador' },
    { icao: 'SBRF', name: 'Recife' },
    { icao: 'SBMN', name: 'Manaus' }
  ];

  useEffect(() => {
    validateMission();
  }, [selectedAircraft, startDateTime, endDateTime, destinations]);

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
    const newDestination: Destination = {
      id: Date.now().toString(),
      icao: '',
      name: '',
      arrival: new Date(startDateTime.getTime() + (destinations.length + 1) * 2 * 60 * 60 * 1000), // +2h
      departure: new Date(startDateTime.getTime() + (destinations.length + 1) * 3 * 60 * 60 * 1000) // +3h
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

  const recalculateTimes = () => {
    // Recalcular tempos de voo entre destinos
    // Em produção, usar dados reais de distância/velocidade
    let currentTime = new Date(startDateTime);
    
    destinations.forEach((dest, index) => {
      const flightTime = 2; // 2 horas de voo padrão
      currentTime = new Date(currentTime.getTime() + flightTime * 60 * 60 * 1000);
      
      updateDestination(dest.id, 'arrival', new Date(currentTime));
      
      // Tempo no destino (1h padrão)
      currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
      updateDestination(dest.id, 'departure', new Date(currentTime));
    });
    
    // Atualizar horário de fim
    const returnFlightTime = 2; // Tempo de retorno à base
    setEndDateTime(new Date(currentTime.getTime() + returnFlightTime * 60 * 60 * 1000));
  };

  const confirmMission = async () => {
    if (validationErrors.length > 0) return;

    // Em produção:
    // 1. Criar pré-reserva no Supabase
    // 2. Iniciar contagem de 12h se prioridade > 1
    // 3. Notificar membros de maior prioridade
    // 4. Debitar saldo

    console.log('Confirmando missão:', {
      aircraft: selectedAircraft,
      start: startDateTime,
      end: endDateTime,
      destinations,
      base: BASE_FBO
    });

    alert('Missão confirmada com sucesso!');
    onBack();
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-lg">
              <MapPin className="h-5 w-5 text-aviation-blue" />
              <span className="font-medium">Início da missão:</span>
              <span>{BASE_FBO}</span>
            </div>
            <div className="flex items-center space-x-2 text-lg">
              <MapPin className="h-5 w-5 text-aviation-blue" />
              <span className="font-medium">Fim da missão:</span>
              <span>{BASE_FBO}</span>
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

      {/* Definição do período */}
      <Card>
        <CardHeader>
          <CardTitle>Período da Missão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Data/Hora de Início</Label>
              <Input
                id="start"
                type="datetime-local"
                value={format(startDateTime, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setStartDateTime(new Date(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="end">Data/Hora de Fim</Label>
              <Input
                id="end"
                type="datetime-local"
                value={format(endDateTime, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setEndDateTime(new Date(e.target.value))}
              />
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={recalculateTimes}
            className="flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Recalcular Tempos</span>
          </Button>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Chegada</Label>
                    <Input
                      type="datetime-local"
                      value={format(destination.arrival, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => updateDestination(destination.id, 'arrival', new Date(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Partida</Label>
                    <Input
                      type="datetime-local"
                      value={format(destination.departure, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => updateDestination(destination.id, 'departure', new Date(e.target.value))}
                    />
                  </div>
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
          disabled={validationErrors.length > 0 || isValidating}
          className="bg-aviation-gradient hover:opacity-90"
        >
          Confirmar Missão
        </Button>
      </div>
    </div>
  );
};

export default MissionCreation;
