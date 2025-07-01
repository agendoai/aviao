
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, MapPin, Users, CheckCircle, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import AircraftSelector from './AircraftSelector';
import AircraftSeatingChart from './AircraftSeatingChart';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface AvailableDay {
  day: number;
  available: boolean;
  lastSeats?: boolean;
}

interface BookingStep {
  step: number;
  title: string;
  completed: boolean;
}

const ConversationalBookingFlow: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [travelMode, setTravelMode] = useState<'solo' | 'shared'>('solo');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDepartureDays, setAvailableDepartureDays] = useState<AvailableDay[]>([]);
  const [availableReturnDays, setAvailableReturnDays] = useState<AvailableDay[]>([]);

  const steps: BookingStep[] = [
    { step: 1, title: 'Aeronave', completed: selectedAircraft !== null },
    { step: 2, title: 'Destino', completed: destination !== '' },
    { step: 3, title: 'Data de Ida', completed: departureDate !== '' },
    { step: 4, title: 'Data de Volta', completed: returnDate !== '' },
    { step: 5, title: 'Passageiros', completed: passengers !== '' },
    { step: 6, title: 'Assentos', completed: selectedSeats.length > 0 },
    { step: 7, title: 'Confirmação', completed: false }
  ];

  useEffect(() => {
    if (currentStep === 3 && destination && selectedAircraft) {
      generateAvailableDays('departure');
    }
    if (currentStep === 4 && departureDate) {
      generateAvailableDays('return');
    }
  }, [currentStep, destination, selectedAircraft, departureDate]);

  const generateAvailableDays = (type: 'departure' | 'return') => {
    // Simular disponibilidade de dias (em produção, isso viria de uma API)
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days: AvailableDay[] = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isAvailable = Math.random() > 0.3; // 70% de chance de estar disponível
      const lastSeats = isAvailable && Math.random() > 0.8; // 20% chance de últimos assentos
      
      days.push({
        day: i,
        available: isAvailable,
        lastSeats
      });
    }
    
    if (type === 'departure') {
      setAvailableDepartureDays(days);
    } else {
      setAvailableReturnDays(days);
    }
  };

  const handleAircraftSelect = (aircraft: Aircraft) => {
    setSelectedAircraft(aircraft);
    setSelectedSeats([]); // Reset seats when aircraft changes
    setCurrentStep(2);
    toast({
      title: "Aeronave selecionada",
      description: `${aircraft.name} - ${aircraft.model}`,
    });
  };

  const handleDestinationSubmit = () => {
    if (!destination.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite seu destino.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(3);
  };

  const handleDateSelect = (day: number, type: 'departure' | 'return') => {
    const selectedDate = `${day.toString().padStart(2, '0')}/${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (type === 'departure') {
      setDepartureDate(selectedDate);
      setCurrentStep(4);
      toast({
        title: "Data de ida selecionada",
        description: `${selectedDate}/${currentMonth.getFullYear()}`,
      });
    } else {
      setReturnDate(selectedDate);
      setCurrentStep(5);
      toast({
        title: "Data de volta selecionada",
        description: `${selectedDate}/${currentMonth.getFullYear()}`,
      });
    }
  };

  const handlePassengersSubmit = () => {
    if (!passengers.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o número de passageiros.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(6);
  };

  const handleSeatSelect = (seatNumber: number) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleSeatsConfirm = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Selecione os assentos",
        description: "Por favor, selecione pelo menos um assento.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(7);
  };

  const handleConfirmBooking = () => {
    toast({
      title: "✔️ Reservando sua viagem",
      description: `GRU→${destination.toUpperCase()} (${departureDate}) e ${destination.toUpperCase()}→GRU (${returnDate}). Processando reserva...`,
    });
    
    // Aqui integraria com o sistema de reservas existente
    setTimeout(() => {
      toast({
        title: "Reserva confirmada!",
        description: "Sua reserva foi processada com sucesso.",
      });
    }, 2000);
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const renderCalendar = (days: AvailableDay[], type: 'departure' | 'return') => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    
    const calendarDays = [];
    
    // Adicionar dias vazios antes do primeiro dia do mês
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Adicionar os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dayInfo = days.find(d => d.day === day);
      if (!dayInfo) continue;
      
      calendarDays.push(
        <Button
          key={day}
          variant={dayInfo.available ? "outline" : "secondary"}
          disabled={!dayInfo.available}
          onClick={() => handleDateSelect(day, type)}
          className={`h-10 text-sm relative ${
            dayInfo.available 
              ? dayInfo.lastSeats 
                ? 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100' 
                : 'border-green-400 bg-green-50 hover:bg-green-100'
              : 'bg-red-50 border-red-200 cursor-not-allowed'
          }`}
        >
          <span className="mr-1">
            {dayInfo.available ? '✅' : '❌'}
          </span>
          {day}
          {dayInfo.lastSeats && (
            <span className="absolute -top-1 -right-1 text-xs">⚠️</span>
          )}
        </Button>
      );
    }
    
    return calendarDays;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plane className="h-6 w-6 text-aviation-blue" />
            <span>Reserva de Voo - Assistente Conversacional</span>
          </CardTitle>
          <CardDescription>
            Siga o passo a passo para criar sua reserva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center space-x-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.step 
                      ? 'bg-aviation-blue text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? <CheckCircle className="h-4 w-4" /> : step.step}
                </div>
                <span className={`text-sm ${currentStep === step.step ? 'font-medium' : ''}`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="aviation-card">
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Plane className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Selecione a aeronave</h2>
                <p className="text-gray-600">Escolha a aeronave para sua viagem</p>
              </div>
              
              <AircraftSelector 
                onAircraftSelect={handleAircraftSelect}
                selectedAircraftId={selectedAircraft?.id}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Qual seu destino?</h2>
                <p className="text-gray-600">Ex: Paris, Nova York, Londres</p>
                <Badge variant="outline" className="mt-2">
                  Aeronave: {selectedAircraft?.name}
                </Badge>
              </div>
              <div className="max-w-md mx-auto space-y-4">
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Digite o destino..."
                  className="text-lg p-4"
                  onKeyPress={(e) => e.key === 'Enter' && handleDestinationSubmit()}
                />
                <Button 
                  onClick={handleDestinationSubmit}
                  className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Confira as datas disponíveis para ida
                </h2>
                <p className="text-gray-600">
                  GRU → {destination.toUpperCase()}
                </p>
                <Badge variant="outline" className="mt-2">
                  Aeronave: {selectedAircraft?.name}
                </Badge>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    ← Mês Anterior
                  </Button>
                  <h3 className="text-xl font-semibold capitalize">
                    {getMonthName(currentMonth)}
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    Próximo Mês →
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar(availableDepartureDays, 'departure')}
                </div>
                
                <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <span>✅</span>
                    <span>Disponível</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>❌</span>
                    <span>Esgotado</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>Últimos assentos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Agora, selecione a data de volta
                </h2>
                <p className="text-gray-600">
                  {destination.toUpperCase()} → GRU
                </p>
                <Badge variant="outline" className="mt-2">
                  Ida selecionada: {departureDate}/{currentMonth.getFullYear()}
                </Badge>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    ← Mês Anterior
                  </Button>
                  <h3 className="text-xl font-semibold capitalize">
                    {getMonthName(currentMonth)}
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    Próximo Mês →
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar(availableReturnDays, 'return')}
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center">
                <Users className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Número de passageiros</h2>
                <p className="text-gray-600">Ex: 2 adultos, 1 criança</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Aeronave:</strong> {selectedAircraft?.name}
                  </div>
                  <div>
                    <strong>Destino:</strong> {destination}
                  </div>
                  <div>
                    <strong>Ida:</strong> {departureDate}/{currentMonth.getFullYear()}
                  </div>
                  <div>
                    <strong>Volta:</strong> {returnDate}/{currentMonth.getFullYear()}
                  </div>
                </div>
                
                <Input
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  placeholder="Ex: 2 adultos, 1 criança"
                  className="text-lg p-4"
                  onKeyPress={(e) => e.key === 'Enter' && handlePassengersSubmit()}
                />
                <Button 
                  onClick={handlePassengersSubmit}
                  className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {currentStep === 6 && selectedAircraft && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Selecione seus assentos</h2>
                <p className="text-gray-600">
                  {selectedAircraft.name} - {selectedAircraft.model}
                </p>
              </div>
              
              <AircraftSeatingChart
                aircraft={selectedAircraft}
                onSeatSelect={handleSeatSelect}
                selectedSeats={selectedSeats}
                onTravelModeChange={setTravelMode}
                selectedTravelMode={travelMode}
              />
              
              <div className="text-center">
                <Button 
                  onClick={handleSeatsConfirm}
                  className="bg-aviation-gradient hover:opacity-90 text-white text-lg py-3 px-8"
                  disabled={selectedSeats.length === 0}
                >
                  Confirmar Assentos Selecionados
                </Button>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Confirme sua reserva</h2>
              </div>
              
              <div className="max-w-lg mx-auto bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Aeronave:</span>
                    <p className="font-medium">{selectedAircraft?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Destino:</span>
                    <p className="font-medium">{destination}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Data de ida:</span>
                    <p className="font-medium">{departureDate}/{currentMonth.getFullYear()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Data de volta:</span>
                    <p className="font-medium">{returnDate}/{currentMonth.getFullYear()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Passageiros:</span>
                    <p className="font-medium">{passengers}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Assentos:</span>
                    <p className="font-medium">{selectedSeats.join(', ')}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Resumo: <strong>GRU→{destination.toUpperCase()}</strong> ({departureDate}) e <strong>{destination.toUpperCase()}→GRU</strong> ({returnDate})
                    <br />
                    Aeronave: <strong>{selectedAircraft?.name}</strong> - Assentos: <strong>{selectedSeats.join(', ')}</strong>
                    <br />
                    Modo: <strong>{travelMode === 'solo' ? 'Individual' : 'Compartilhado'}</strong>
                  </p>
                  
                  <Button 
                    onClick={handleConfirmBooking}
                    className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
                  >
                    ✔️ Confirmar Reserva
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationalBookingFlow;
