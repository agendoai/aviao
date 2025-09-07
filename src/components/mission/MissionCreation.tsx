
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plane, CheckCircle, Clock, MapPin, DollarSign, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { createBooking } from '@/utils/api';
import { toast } from 'sonner';
import { convertBrazilianDateToUTCString } from '@/utils/dateUtils';
import DateTimePicker from '@/components/ui/DateTimePicker';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  status: string;
  max_passengers: number;
  hourly_rate: number;
  overnight_fee: number;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictingBooking?: any;
}

interface MissionCreationProps {
  aircraft: Aircraft;
  initialTimeSlot: TimeSlot;
  onBack: () => void;
  onMissionCreated: (data: any) => void;
}

const MissionCreation: React.FC<MissionCreationProps> = ({
  aircraft,
  initialTimeSlot,
  onBack,
  onMissionCreated
}) => {
  const [creating, setCreating] = useState(false);
  const [missionData, setMissionData] = useState<any>(null);
  
  // Dados da missão
  const [origin, setOrigin] = useState('SBAU'); // Araçatuba como padrão
  const [destination, setDestination] = useState('');
  const [secondaryDestination, setSecondaryDestination] = useState(''); // Destino secundário
  const [departureDate, setDepartureDate] = useState(format(initialTimeSlot.start, 'yyyy-MM-dd'));
  const [departureTime, setDepartureTime] = useState(format(initialTimeSlot.start, 'HH:mm'));
  const [returnDate, setReturnDate] = useState(''); // Não preencher automaticamente
  const [returnTime, setReturnTime] = useState(''); // Não preencher automaticamente
  const [passengers, setPassengers] = useState(1);
  const [flightHours, setFlightHours] = useState(2);
  const [overnightStays, setOvernightStays] = useState(0);

  // Calcular custos
  const calculateCosts = () => {
    const hourlyCost = aircraft.hourly_rate * flightHours;
    const overnightCost = aircraft.overnight_fee * overnightStays;
    const totalCost = hourlyCost + overnightCost;
    
    return {
      hourlyCost,
      overnightCost,
      totalCost
    };
  };

  // Calcular horas de voo baseado na rota
  const calculateFlightHours = () => {
    if (!destination) return 2; // Valor padrão
    
    // Coordenadas dos aeroportos (mock - idealmente viria da API)
    const airports = {
      SBAU: { lat: -21.1411, lon: -50.4247 }, // Araçatuba
      SBSP: { lat: -23.6273, lon: -46.6566 }, // São Paulo
      SBGR: { lat: -23.4356, lon: -46.4731 }, // Guarulhos
      SBSV: { lat: -12.9089, lon: -38.3225 }, // Salvador
      SBRJ: { lat: -22.9104, lon: -43.1631 }, // Rio de Janeiro
      SBKP: { lat: -23.0074, lon: -47.1345 }, // Campinas
      SBCF: { lat: -19.6336, lon: -43.9686 }, // Belo Horizonte
      SBFL: { lat: -27.6705, lon: -48.5477 }, // Florianópolis
      SBBR: { lat: -15.8697, lon: -47.9208 }, // Brasília
      SBPA: { lat: -29.9939, lon: -51.1714 }, // Porto Alegre
    };

    const origem = airports[origin] || airports['SBAU'];
    const destino = airports[destination] || airports['SBSP'];
    
    // Calcular distância base (origem → destino)
    const distanceBase = haversine(origem.lat, origem.lon, destino.lat, destino.lon);
    
    let totalDistance = distanceBase;
    
    // Se tem destino secundário, calcular rota completa
    if (secondaryDestination && airports[secondaryDestination]) {
      const destinoSecundario = airports[secondaryDestination];
      
      // Rota: Origem → Destino → Destino Secundário → Origem
      const distanceToSecondary = haversine(destino.lat, destino.lon, destinoSecundario.lat, destinoSecundario.lon);
      const distanceBackToOrigin = haversine(destinoSecundario.lat, destinoSecundario.lon, origem.lat, origem.lon);
      
      totalDistance = distanceBase + distanceToSecondary + distanceBackToOrigin;
    } else {
      // Rota simples: Origem → Destino → Origem (ida e volta)
      totalDistance = distanceBase * 2;
    }
    
    // Calcular tempo de voo: Distância (NM) / Velocidade (KT)
    const aircraftSpeed = 108; // Velocidade média em nós (KT)
    const flightTimeHours = totalDistance / aircraftSpeed;
    
    return Math.max(1, Math.ceil(flightTimeHours));
  };

  // Função para calcular distância usando fórmula de Haversine
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3440.065; // Raio da Terra em milhas náuticas
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const costs = calculateCosts();

  // Atualizar horas de voo quando destinos mudarem
  React.useEffect(() => {
    const newFlightHours = calculateFlightHours();
    setFlightHours(newFlightHours);
  }, [destination, secondaryDestination]);

  const handleCreateMission = async () => {
    if (!destination) {
      toast.error('Por favor, informe o destino');
      return;
    }

    if (!departureDate || !departureTime || !returnDate || !returnTime) {
      toast.error('Por favor, preencha todas as datas e horários');
      return;
    }

    // Validar se a data de retorno não é anterior à data de partida
    const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);
    
    if (returnDateTime <= departureDateTime) {
      toast.error('A data/hora de retorno deve ser posterior à data/hora de partida');
      return;
    }

    if (passengers > aircraft.max_passengers) {
      toast.error(`Máximo de ${aircraft.max_passengers} passageiros para esta aeronave`);
      return;
    }

    setCreating(true);
    try {
      // Converter datas para UTC antes de enviar
      // console.log('🔍 Valores das datas antes da conversão:');
      // console.log('🔍 departureDate:', departureDate);
      // console.log('🔍 departureTime:', departureTime);
      // console.log('🔍 returnDate:', returnDate);
      // console.log('🔍 returnTime:', returnTime);
      
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
      const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);
      
      // console.log('🔍 Datas criadas:');
      // console.log('🔍 departureDateTime:', departureDateTime);
      // console.log('🔍 returnDateTime:', returnDateTime);
      // console.log('🔍 departureDateTime válida:', !isNaN(departureDateTime.getTime()));
      // console.log('🔍 returnDateTime válida:', !isNaN(returnDateTime.getTime()));
      
      const bookingData = {
        aircraftId: aircraft.id,
        origin,
        destination,
        secondaryDestination: secondaryDestination || null,
        departure_date: convertBrazilianDateToUTCString(departureDateTime),
        return_date: convertBrazilianDateToUTCString(returnDateTime),
        passengers,
        flight_hours: flightHours,
        overnight_stays: overnightStays,
        value: costs.totalCost,
        status: 'pendente'
      };

      // console.log('📋 Dados da reserva:', bookingData);
      
      const result = await createBooking(bookingData);
      // console.log('✅ Reserva criada:', result);
      
      const missionData = {
        aircraft: aircraft,
        start: initialTimeSlot.start,
        end: initialTimeSlot.end,
        destinations: secondaryDestination 
          ? [{ origin, destination }, { origin: destination, destination: secondaryDestination }, { origin: secondaryDestination, destination: origin }]
          : [{ origin, destination }],
        totalCost: costs.totalCost,
        bookingId: result.id
      };
      
      setMissionData(missionData);
      onMissionCreated(missionData);
      toast.success('Missão criada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao criar missão:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Erro completo:', error);
      
      // Mostrar mensagem de erro específica
      if (error instanceof Error) {
        // console.log('🔍 Exibindo mensagem de erro:', error.message);
        toast.error(error.message);
      } else {
        // console.log('🔍 Erro não é instância de Error, exibindo mensagem genérica');
        toast.error('Erro ao criar missão');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Plane className="h-6 w-6 text-sky-600" />
          <span className="text-xl font-bold text-gray-900">Nova Missão</span>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Aeronave */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-sky-600" />
              <span>Aeronave Selecionada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Aeronave:</span>
              <span className="font-medium">{aircraft.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Matrícula:</span>
              <span className="font-medium">{aircraft.registration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modelo:</span>
              <span className="font-medium">{aircraft.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max. Passageiros:</span>
              <span className="font-medium">{aircraft.max_passengers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa/Hora:</span>
              <span className="font-medium">R$ {aircraft.hourly_rate?.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pernoite:</span>
              <span className="font-medium">R$ {aircraft.overnight_fee?.toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes da Missão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-sky-600" />
              <span>Detalhes da Missão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origem</Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="SBAU"
                />
              </div>
              <div>
                <Label htmlFor="destination">Destino</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="SBSP"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="secondaryDestination">
                Destino Secundário (Opcional)
                <span className="text-sm text-gray-500 ml-2">
                  {secondaryDestination ? '✓ Adicionado' : 'Não definido'}
                </span>
              </Label>
              <Input
                id="secondaryDestination"
                value={secondaryDestination}
                onChange={(e) => setSecondaryDestination(e.target.value)}
                placeholder="Deixe em branco para voo direto ida/volta"
                className={secondaryDestination ? 'border-green-500' : ''}
              />
              {secondaryDestination && (
                <p className="text-xs text-green-600 mt-1">
                  Rota: {origin} → {destination} → {secondaryDestination} → {origin}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DateTimePicker
                label="Data e Horário de Partida"
                date={departureDate}
                time={departureTime}
                onDateChange={setDepartureDate}
                onTimeChange={setDepartureTime}
                minDate={new Date()}
              />
              <DateTimePicker
                label="Data e Horário de Retorno"
                date={returnDate}
                time={returnTime}
                onDateChange={setReturnDate}
                onTimeChange={setReturnTime}
                disabled={(date) => {
                  if (!departureDate) return date < new Date();
                  const departureDateObj = new Date(departureDate);
                  return date < departureDateObj;
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passengers">Passageiros</Label>
                <Input
                  id="passengers"
                  type="number"
                  min="1"
                  max={aircraft.max_passengers}
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="flightHours">
                  Horas de Voo
                  <span className="text-sm text-gray-500 ml-2">(Calculado automaticamente)</span>
                </Label>
                <Input
                  id="flightHours"
                  type="number"
                  min="1"
                  value={flightHours}
                  onChange={(e) => setFlightHours(parseInt(e.target.value))}
                  className="bg-gray-50"
                  readOnly
                />
                {secondaryDestination && (
                  <p className="text-xs text-blue-600 mt-1">
                    Inclui voo secundário: {destination} → {secondaryDestination}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="overnightStays">Pernoites</Label>
              <Input
                id="overnightStays"
                type="number"
                min="0"
                value={overnightStays}
                onChange={(e) => setOvernightStays(parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cálculo de Custos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-sky-600" />
            <span>Cálculo de Custos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa por Hora ({flightHours}h):</span>
              <span className="font-medium">R$ {costs.hourlyCost.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pernoites ({overnightStays}x):</span>
              <span className="font-medium">R$ {costs.overnightCost.toLocaleString('pt-BR')}</span>
            </div>
            
            {/* Informações da rota */}
            {secondaryDestination && (
              <div className="bg-blue-50 p-2 rounded-lg">
                <div className="text-xs text-blue-800 font-medium mb-1">Rota com Voo Secundário:</div>
                <div className="text-xs text-blue-700">
                  {origin} → {destination} → {secondaryDestination} → {origin}
                </div>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-sky-600">R$ {costs.totalCost.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Criação */}
      <div className="flex justify-center">
        <Button 
          onClick={handleCreateMission} 
          disabled={creating || !destination}
          className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 text-lg"
        >
          {creating ? (
            <>
              <Clock className="h-5 w-5 mr-2 animate-spin" />
              Criando Missão...
            </>
          ) : (
            <>
              <Plane className="h-5 w-5 mr-2" />
              Criar Missão
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MissionCreation;
