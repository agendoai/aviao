
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
  const [departureDate, setDepartureDate] = useState(format(initialTimeSlot.start, 'yyyy-MM-dd'));
  const [departureTime, setDepartureTime] = useState(format(initialTimeSlot.start, 'HH:mm'));
  const [returnDate, setReturnDate] = useState(format(initialTimeSlot.end, 'yyyy-MM-dd'));
  const [returnTime, setReturnTime] = useState(format(initialTimeSlot.end, 'HH:mm'));
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

  const costs = calculateCosts();

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
      console.log('🔍 Valores das datas antes da conversão:');
      console.log('🔍 departureDate:', departureDate);
      console.log('🔍 departureTime:', departureTime);
      console.log('🔍 returnDate:', returnDate);
      console.log('🔍 returnTime:', returnTime);
      
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
      const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);
      
      console.log('🔍 Datas criadas:');
      console.log('🔍 departureDateTime:', departureDateTime);
      console.log('🔍 returnDateTime:', returnDateTime);
      console.log('🔍 departureDateTime válida:', !isNaN(departureDateTime.getTime()));
      console.log('🔍 returnDateTime válida:', !isNaN(returnDateTime.getTime()));
      
      const bookingData = {
        aircraftId: aircraft.id,
        origin,
        destination,
        departure_date: convertBrazilianDateToUTCString(departureDateTime),
        return_date: convertBrazilianDateToUTCString(returnDateTime),
        passengers,
        flight_hours: flightHours,
        overnight_stays: overnightStays,
        value: costs.totalCost,
        status: 'pendente'
      };

      console.log('📋 Dados da reserva:', bookingData);
      
      const result = await createBooking(bookingData);
      console.log('✅ Reserva criada:', result);
      
      const missionData = {
        aircraft: aircraft,
        start: initialTimeSlot.start,
        end: initialTimeSlot.end,
        destinations: [{ origin, destination }],
        totalCost: costs.totalCost,
        bookingId: result.id
      };
      
      setMissionData(missionData);
      onMissionCreated(missionData);
      toast.success('Missão criada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao criar missão:', error);
      toast.error('Erro ao criar missão');
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
                <Label htmlFor="flightHours">Horas de Voo</Label>
                <Input
                  id="flightHours"
                  type="number"
                  min="1"
                  value={flightHours}
                  onChange={(e) => setFlightHours(parseInt(e.target.value))}
                />
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
