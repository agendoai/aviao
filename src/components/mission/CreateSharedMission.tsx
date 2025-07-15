import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plane, MapPin, Clock, Users, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Aircraft {
  id: string;
  name: string;
  registration: string;
  model: string;
  maxPassengers: number;
}

interface SharedMissionData {
  aircraft: Aircraft;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  origin: string;
  destination: string;
  stops: string;
  notes: string;
  availableSeats: number;
  totalCost: number;
}

interface CreateSharedMissionProps {
  onBack: () => void;
  onMissionCreated: (data: SharedMissionData) => void;
}

const CreateSharedMission: React.FC<CreateSharedMissionProps> = ({
  onBack,
  onMissionCreated
}) => {
  const { toast } = useToast();
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [missionData, setMissionData] = useState({
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    origin: 'Araçatuba-SBAU',
    destination: '',
    stops: '',
    notes: '',
    availableSeats: 1
  });

  // Mock aircraft data
  const aircraft: Aircraft[] = [
    {
      id: '1',
      name: 'Baron E55',
      registration: 'PR-FOM',
      model: 'Baron E55',
      maxPassengers: 6
    },
    {
      id: '2',
      name: 'Cessna 172',
      registration: 'PR-ABC',
      model: 'Cessna 172',
      maxPassengers: 4
    }
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setMissionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateFlightHours = () => {
    if (!missionData.departureDate || !missionData.departureTime || !missionData.returnDate || !missionData.returnTime) {
      return 0;
    }

    const departure = new Date(`${missionData.departureDate}T${missionData.departureTime}`);
    const arrival = new Date(`${missionData.returnDate}T${missionData.returnTime}`);
    const diffInHours = (arrival.getTime() - departure.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, diffInHours);
  };

  const calculateTotalCost = () => {
    if (!selectedAircraft) return 0;
    
    const flightHours = calculateFlightHours();
    const hourlyRate = 2800; // Mock rate
    const airportFees = 500; // Mock fee
    const overnightFee = missionData.returnDate !== missionData.departureDate ? 1500 : 0;
    
    return (flightHours * hourlyRate) + airportFees + overnightFee;
  };

  const validateForm = () => {
    if (!selectedAircraft) {
      toast({
        title: "Selecione uma aeronave",
        description: "É necessário selecionar uma aeronave para continuar",
        variant: "destructive"
      });
      return false;
    }

    if (!missionData.departureDate || !missionData.departureTime || !missionData.returnDate || !missionData.returnTime) {
      toast({
        title: "Datas e horários obrigatórios",
        description: "Preencha todas as datas e horários",
        variant: "destructive"
      });
      return false;
    }

    if (!missionData.destination.trim()) {
      toast({
        title: "Destino obrigatório",
        description: "Informe o destino da viagem",
        variant: "destructive"
      });
      return false;
    }

    if (missionData.availableSeats < 1 || missionData.availableSeats >= selectedAircraft.maxPassengers) {
      toast({
        title: "Poltronas disponíveis inválidas",
        description: `Selecione entre 1 e ${selectedAircraft.maxPassengers - 1} poltronas`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const sharedMissionData: SharedMissionData = {
      aircraft: selectedAircraft!,
      departureDate: missionData.departureDate,
      departureTime: missionData.departureTime,
      returnDate: missionData.returnDate,
      returnTime: missionData.returnTime,
      origin: missionData.origin,
      destination: missionData.destination,
      stops: missionData.stops,
      notes: missionData.notes,
      availableSeats: missionData.availableSeats,
      totalCost: calculateTotalCost()
    };

    onMissionCreated(sharedMissionData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Criar Viagem Compartilhada</h2>
          <p className="text-gray-600">Configure sua missão e disponibilize poltronas para outros usuários</p>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Seleção de Aeronave */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-aviation-blue" />
              <span>Selecione a Aeronave</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aircraft.map((plane) => (
              <div
                key={plane.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAircraft?.id === plane.id
                    ? 'border-aviation-blue bg-aviation-blue/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAircraft(plane)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{plane.name}</div>
                    <div className="text-sm text-gray-500">{plane.registration} • {plane.model}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Máx. passageiros</div>
                    <div className="font-medium">{plane.maxPassengers}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detalhes da Missão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-aviation-blue" />
              <span>Detalhes da Missão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departureDate">Data de Partida</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={missionData.departureDate}
                  onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="departureTime">Horário de Partida</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={missionData.departureTime}
                  onChange={(e) => handleInputChange('departureTime', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="returnDate">Data de Retorno</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={missionData.returnDate}
                  onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="returnTime">Horário de Retorno</Label>
                <Input
                  id="returnTime"
                  type="time"
                  value={missionData.returnTime}
                  onChange={(e) => handleInputChange('returnTime', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                type="text"
                placeholder="Ex: São Paulo-SBMT"
                value={missionData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="stops">Escalas (opcional)</Label>
              <Input
                id="stops"
                type="text"
                placeholder="Ex: Campo Grande, Brasília"
                value={missionData.stops}
                onChange={(e) => handleInputChange('stops', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a viagem..."
                value={missionData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuração de Compartilhamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-aviation-blue" />
            <span>Configuração de Compartilhamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="availableSeats">Poltronas Disponíveis para Compartilhamento</Label>
              <Input
                id="availableSeats"
                type="number"
                min="1"
                max={selectedAircraft ? selectedAircraft.maxPassengers - 1 : 1}
                value={missionData.availableSeats}
                onChange={(e) => handleInputChange('availableSeats', parseInt(e.target.value) || 1)}
                className="mt-1"
              />
              <div className="text-sm text-gray-500 mt-1">
                {selectedAircraft ? `Máximo: ${selectedAircraft.maxPassengers - 1} poltronas` : 'Selecione uma aeronave primeiro'}
              </div>
            </div>

            <div>
              <Label>Resumo de Custos</Label>
              <div className="mt-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Horas de voo:</span>
                  <span>{calculateFlightHours().toFixed(1)}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Custo total estimado:</span>
                  <span className="font-medium">R$ {calculateTotalCost().toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Custo por poltrona:</span>
                  <span className="font-medium text-aviation-blue">
                    R$ {(calculateTotalCost() / (missionData.availableSeats + 1)).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Importante sobre compartilhamento:</h3>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Você mantém o controle total da missão</li>
                  <li>• Os custos são divididos igualmente entre todos os participantes</li>
                  <li>• Você pode cancelar ou modificar a viagem até 24h antes</li>
                  <li>• Os passageiros serão notificados sobre mudanças</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={handleSubmit}
          disabled={!selectedAircraft || !missionData.departureDate || !missionData.destination}
          className="bg-aviation-gradient hover:opacity-90 text-white text-lg py-3 px-8"
        >
          <Users className="h-4 w-4 mr-2" />
          Criar Viagem Compartilhada
        </Button>
      </div>
    </div>
  );
};

export default CreateSharedMission;