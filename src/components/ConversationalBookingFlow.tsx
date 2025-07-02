import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, MapPin, Users, CheckCircle, Plane, Clock, CreditCard, Wallet, UserPlus, Route } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import AircraftSelector from './AircraftSelector';
import AircraftSeatingChart from './AircraftSeatingChart';
import type { Tables } from '@/integrations/supabase/types';
import type { PreReservationResponse, ConfirmReservationResponse } from '@/types/supabase-extended';

type Aircraft = Tables<'aircraft'>;

interface AvailableDay {
  day: number;
  available: boolean;
  lastSeats?: boolean;
}

interface PassengerInfo {
  name: string;
  document: string;
  documentType: 'rg' | 'passaporte';
}

interface BookingStep {
  step: number;
  title: string;
  completed: boolean;
}

interface PreReservationData {
  pre_reservation_id: string;
  priority_position: number;
  expires_at: string;
  can_confirm_immediately: boolean;
  overnight_stays: number;
  overnight_fee: number;
  final_cost: number;
}

const ConversationalBookingFlow: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [travelMode, setTravelMode] = useState<'solo' | 'shared'>('solo');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [passengersCount, setPassengersCount] = useState('');
  const [passengersInfo, setPassengersInfo] = useState<PassengerInfo[]>([]);
  const [stops, setStops] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDepartureDays, setAvailableDepartureDays] = useState<AvailableDay[]>([]);
  const [availableReturnDays, setAvailableReturnDays] = useState<AvailableDay[]>([]);
  const [preReservationData, setPreReservationData] = useState<PreReservationData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'balance' | 'card'>('balance');
  const [isProcessing, setIsProcessing] = useState(false);

  const steps: BookingStep[] = [
    { step: 1, title: 'Aeronave', completed: selectedAircraft !== null },
    { step: 2, title: 'Assentos', completed: selectedSeats.length > 0 },
    { step: 3, title: 'Destino', completed: destination !== '' },
    { step: 4, title: 'Data de Ida', completed: departureDate !== '' },
    { step: 5, title: 'Hora de Ida', completed: departureTime !== '' },
    { step: 6, title: 'Escalas', completed: true }, // Optional step
    { step: 7, title: 'Data de Volta', completed: returnDate !== '' },
    { step: 8, title: 'Hora de Volta', completed: returnTime !== '' },
    { step: 9, title: 'Passageiros', completed: passengersCount !== '' },
    { step: 10, title: 'Dados dos Passageiros', completed: passengersInfo.length > 0 },
    { step: 11, title: 'Pré-reserva', completed: preReservationData !== null },
    { step: 12, title: 'Pagamento', completed: false }
  ];

  useEffect(() => {
    if (currentStep === 4 && destination && selectedAircraft) {
      generateAvailableDays('departure');
    }
    if (currentStep === 7 && departureDate) {
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
    setCurrentStep(3);
    toast({
      title: "Assentos selecionados",
      description: `${selectedSeats.length} assento(s) selecionado(s) - Modo: ${travelMode === 'solo' ? 'Individual' : 'Compartilhado'}`,
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
    setCurrentStep(4);
  };

  const handleDateSelect = (day: number, type: 'departure' | 'return') => {
    const selectedDate = `${day.toString().padStart(2, '0')}/${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (type === 'departure') {
      setDepartureDate(selectedDate);
      setCurrentStep(5);
      toast({
        title: "Data de ida selecionada",
        description: `${selectedDate}/${currentMonth.getFullYear()}`,
      });
    } else {
      setReturnDate(selectedDate);
      setCurrentStep(8);
      toast({
        title: "Data de volta selecionada",
        description: `${selectedDate}/${currentMonth.getFullYear()}`,
      });
    }
  };

  const handleTimeSelect = (time: string, type: 'departure' | 'return') => {
    if (type === 'departure') {
      setDepartureTime(time);
      setCurrentStep(6);
      toast({
        title: "Horário de ida selecionado",
        description: `${time}`,
      });
    } else {
      setReturnTime(time);
      setCurrentStep(9);
      toast({
        title: "Horário de volta selecionado",
        description: `${time}`,
      });
    }
  };

  const handleStopsSubmit = () => {
    setCurrentStep(7);
    if (stops.trim()) {
      toast({
        title: "Escalas definidas",
        description: stops,
      });
    } else {
      toast({
        title: "Voo direto",
        description: "Nenhuma escala adicionada.",
      });
    }
  };

  const handlePassengersCountSubmit = () => {
    if (!passengersCount.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o número de passageiros.",
        variant: "destructive"
      });
      return;
    }
    
    const count = parseInt(passengersCount);
    if (count <= 0) {
      toast({
        title: "Número inválido",
        description: "O número de passageiros deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    // Initialize passengers info array
    const newPassengersInfo: PassengerInfo[] = [];
    for (let i = 0; i < count; i++) {
      newPassengersInfo.push({
        name: '',
        document: '',
        documentType: 'rg'
      });
    }
    setPassengersInfo(newPassengersInfo);
    setCurrentStep(10);
  };

  const handlePassengerInfoChange = (index: number, field: keyof PassengerInfo, value: string) => {
    setPassengersInfo(prev => {
      const updated = [...prev];
      if (field === 'documentType') {
        updated[index][field] = value as 'rg' | 'passaporte';
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  const handlePassengersInfoSubmit = () => {
    const incompletePassengers = passengersInfo.some(p => !p.name.trim() || !p.document.trim());
    
    if (incompletePassengers) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha nome e documento de todos os passageiros.",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentStep(11);
    toast({
      title: "Dados dos passageiros confirmados",
      description: `${passengersInfo.length} passageiro(s) cadastrado(s)`,
    });
  };

  const handleCreatePreReservation = async () => {
    if (!selectedAircraft || !profile) return;

    setIsProcessing(true);
    try {
      // Calcular horas de voo (simulado)
      const flightHours = 2.5;
      const baseCost = selectedAircraft.hourly_rate * flightHours;

      const { data, error } = await supabase.rpc('create_pre_reservation', {
        p_aircraft_id: selectedAircraft.id,
        p_departure_date: `2024-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${departureDate.split('/')[0]}`,
        p_departure_time: departureTime + ':00',
        p_return_date: `2024-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${returnDate.split('/')[0]}`,
        p_return_time: returnTime + ':00',
        p_origin: 'GRU',
        p_destination: destination,
        p_passengers: parseInt(passengersCount) || 1,
        p_flight_hours: flightHours,
        p_total_cost: baseCost
      });

      if (error) throw error;

      const response = data as PreReservationResponse;

      if (response.success) {
        setPreReservationData({
          pre_reservation_id: response.pre_reservation_id!,
          priority_position: response.priority_position!,
          expires_at: response.expires_at!,
          can_confirm_immediately: response.can_confirm_immediately!,
          overnight_stays: response.overnight_stays!,
          overnight_fee: response.overnight_fee!,
          final_cost: response.final_cost!
        });
        setCurrentStep(12);
        
        if (response.can_confirm_immediately) {
          toast({
            title: "🎉 Confirmação Imediata Disponível!",
            description: "Como você é #1 na fila de prioridades, pode confirmar imediatamente.",
          });
        } else {
          toast({
            title: "📋 Pré-reserva Criada",
            description: `Posição #${response.priority_position} - Aguarde 12h para confirmação automática.`,
          });
        }
      } else {
        throw new Error(response.error || 'Erro ao criar pré-reserva');
      }
    } catch (error) {
      console.error('Erro ao criar pré-reserva:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pré-reserva. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!preReservationData) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('confirm_pre_reservation', {
        p_pre_reservation_id: preReservationData.pre_reservation_id,
        p_payment_method: selectedPaymentMethod
      });

      if (error) throw error;

      const response = data as ConfirmReservationResponse;

      if (response.success) {
        toast({
          title: "🎉 Reserva Confirmada!",
          description: `Sua reserva foi confirmada com sucesso! Custo final: R$ ${response.final_cost!.toFixed(2)}`,
        });
        
        // Reset form
        setCurrentStep(1);
        setSelectedAircraft(null);
        setSelectedSeats([]);
        setDestination('');
        setDepartureDate('');
        setDepartureTime('');
        setReturnDate('');
        setReturnTime('');
        setPassengersCount('');
        setPassengersInfo([]);
        setStops('');
        setPreReservationData(null);
      } else {
        throw new Error(response.error || 'Erro ao confirmar reserva');
      }
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar reserva. Verifique seu saldo.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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

  const renderTimeSelector = (type: 'departure' | 'return') => {
    const timeSlots = [
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00', '22:00'
    ];

    return (
      <div className="grid grid-cols-4 gap-3">
        {timeSlots.map(time => (
          <Button
            key={time}
            variant="outline"
            onClick={() => handleTimeSelect(time, type)}
            className="h-12 text-sm hover:bg-aviation-blue hover:text-white transition-colors"
          >
            {time}
          </Button>
        ))}
      </div>
    );
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
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center space-x-2 flex-shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.step 
                      ? 'bg-aviation-blue text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? <CheckCircle className="h-4 w-4" /> : step.step}
                </div>
                <span className={`text-xs whitespace-nowrap ${currentStep === step.step ? 'font-medium' : ''}`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
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

          {currentStep === 2 && selectedAircraft && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Selecione seus assentos</h2>
                <p className="text-gray-600">
                  {selectedAircraft.name} - {selectedAircraft.model}
                </p>
                <Badge variant="outline" className="mt-2">
                  Aeronave: {selectedAircraft.name}
                </Badge>
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
                  Continuar com Assentos Selecionados
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Qual seu destino?</h2>
                <p className="text-gray-600">Ex: Paris, Nova York, Londres</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge variant="outline">
                    Aeronave: {selectedAircraft?.name}
                  </Badge>
                  <Badge variant="outline">
                    Assentos: {selectedSeats.join(', ')}
                  </Badge>
                  <Badge variant="outline">
                    Modo: {travelMode === 'solo' ? 'Individual' : 'Compartilhado'}
                  </Badge>
                </div>
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

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Confira as datas disponíveis para ida
                </h2>
                <p className="text-gray-600">
                  GRU → {destination.toUpperCase()}
                </p>
                <Badge variant="outline" className="mt-2">
                  Aeronave: {selectedAircraft?.name} | Assentos: {selectedSeats.join(', ')}
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

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <Clock className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Selecione o horário de ida</h2>
                <p className="text-gray-600">
                  Data selecionada: {departureDate}/{currentMonth.getFullYear()}
                </p>
              </div>
              
              <div className="max-w-2xl mx-auto">
                {renderTimeSelector('departure')}
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="text-center">
                <Route className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Escalas (opcional)</h2>
                <p className="text-gray-600">Adicione escalas ao seu voo se necessário</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <strong>Ida:</strong> {departureDate}/{currentMonth.getFullYear()} às {departureTime}
                  </div>
                  <div>
                    <strong>Destino:</strong> {destination}
                  </div>
                </div>
                
                <Input
                  value={stops}
                  onChange={(e) => setStops(e.target.value)}
                  placeholder="Ex: Madrid, Londres (opcional)"
                  className="text-lg p-4"
                  onKeyPress={(e) => e.key === 'Enter' && handleStopsSubmit()}
                />
                <Button 
                  onClick={handleStopsSubmit}
                  className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Agora, selecione a data de volta
                </h2>
                <p className="text-gray-600">
                  {destination.toUpperCase()} → GRU
                </p>
                <Badge variant="outline" className="mt-2">
                  Ida: {departureDate}/{currentMonth.getFullYear()} às {departureTime}
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

          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="text-center">
                <Clock className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Selecione o horário de volta</h2>
                <p className="text-gray-600">
                  Data selecionada: {returnDate}/{currentMonth.getFullYear()}
                </p>
              </div>
              
              <div className="max-w-2xl mx-auto">
                {renderTimeSelector('return')}
              </div>
            </div>
          )}

          {currentStep === 9 && (
            <div className="space-y-4">
              <div className="text-center">
                <Users className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Número de passageiros</h2>
                <p className="text-gray-600">Quantas pessoas viajarão?</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Ida:</strong> {departureDate} às {departureTime}
                  </div>
                  <div>
                    <strong>Volta:</strong> {returnDate} às {returnTime}
                  </div>
                  <div>
                    <strong>Destino:</strong> {destination}
                  </div>
                  <div>
                    <strong>Assentos:</strong> {selectedSeats.join(', ')}
                  </div>
                </div>
                
                <Input
                  value={passengersCount}
                  onChange={(e) => setPassengersCount(e.target.value)}
                  placeholder="Ex: 2"
                  type="number"
                  min="1"
                  className="text-lg p-4"
                  onKeyPress={(e) => e.key === 'Enter' && handlePassengersCountSubmit()}
                />
                <Button 
                  onClick={handlePassengersCountSubmit}
                  className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {currentStep === 10 && (
            <div className="space-y-6">
              <div className="text-center">
                <UserPlus className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Dados dos Passageiros</h2>
                <p className="text-gray-600">Preencha as informações de cada passageiro</p>
              </div>
              
              <div className="max-w-2xl mx-auto space-y-6">
                {passengersInfo.map((passenger, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-medium text-lg">Passageiro {index + 1}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome Completo
                        </label>
                        <Input
                          value={passenger.name}
                          onChange={(e) => handlePassengerInfoChange(index, 'name', e.target.value)}
                          placeholder="Nome completo"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Documento
                        </label>
                        <select
                          value={passenger.documentType}
                          onChange={(e) => handlePassengerInfoChange(index, 'documentType', e.target.value)}
                          className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="rg">RG</option>
                          <option value="passaporte">Passaporte</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {passenger.documentType === 'rg' ? 'RG' : 'Passaporte'}
                      </label>
                      <Input
                        value={passenger.document}
                        onChange={(e) => handlePassengerInfoChange(index, 'document', e.target.value)}
                        placeholder={passenger.documentType === 'rg' ? 'Ex: 12.345.678-9' : 'Ex: BR123456'}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
                
                <Button 
                  onClick={handlePassengersInfoSubmit}
                  className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {currentStep === 11 && (
            <div className="space-y-6">
              <div className="text-center">
                <Clock className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Criar Pré-reserva</h2>
                <p className="text-gray-600">
                  Sua posição na fila de prioridades: #{profile?.priority_position}
                </p>
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
                    <span className="text-gray-600">Ida:</span>
                    <p className="font-medium">{departureDate} às {departureTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Volta:</span>
                    <p className="font-medium">{returnDate} às {returnTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Passageiros:</span>
                    <p className="font-medium">{passengersCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Assentos:</span>
                    <p className="font-medium">{selectedSeats.join(', ')}</p>
                  </div>
                </div>
                
                {stops && (
                  <div>
                    <span className="text-gray-600">Escalas:</span>
                    <p className="font-medium">{stops}</p>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">🎯 Sistema de Prioridades</h4>
                    <p className="text-sm text-blue-700">
                      {profile?.priority_position === 1 
                        ? "🎉 Você está em 1º lugar! Confirmação imediata após pagamento."
                        : `⏰ Posição #${profile?.priority_position} - Aguarde 12h para confirmação automática após o pagamento.`
                      }
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleCreatePreReservation}
                    className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Criando Pré-reserva...' : '📋 Criar Pré-reserva'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 12 && preReservationData && (
            <div className="space-y-6">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Pagamento e Confirmação</h2>
                <p className="text-gray-600">
                  Pré-reserva criada com sucesso!
                </p>
              </div>
              
              <div className="max-w-lg mx-auto space-y-6">
                {/* Priority Status */}
                <div className={`p-4 rounded-lg ${
                  preReservationData.can_confirm_immediately 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {preReservationData.can_confirm_immediately ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-medium">
                      {preReservationData.can_confirm_immediately 
                        ? 'Confirmação Imediata Disponível' 
                        : 'Aguardando Confirmação'
                      }
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {preReservationData.can_confirm_immediately 
                      ? 'Como você está em 1º lugar na fila de prioridades, pode confirmar imediatamente após o pagamento.'
                      : `Posição #${preReservationData.priority_position} na fila. Sua reserva será confirmada automaticamente em 12 horas se ninguém com prioridade maior solicitar.`
                    }
                  </p>
                  
                  {!preReservationData.can_confirm_immediately && (
                    <p className="text-xs text-gray-500 mt-2">
                      Expira em: {new Date(preReservationData.expires_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Detalhes do Custo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Voo (2.5h × R$ {selectedAircraft?.hourly_rate})</span>
                      <span>R$ {(selectedAircraft?.hourly_rate * 2.5).toFixed(2)}</span>
                    </div>
                    {preReservationData.overnight_stays > 0 && (
                      <div className="flex justify-between">
                        <span>Pernoite ({preReservationData.overnight_stays} noite(s))</span>
                        <span>R$ {preReservationData.overnight_fee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <span>R$ {preReservationData.final_cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <h4 className="font-medium">Método de Pagamento</h4>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="balance"
                        checked={selectedPaymentMethod === 'balance'}
                        onChange={() => setSelectedPaymentMethod('balance')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Wallet className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium">Saldo em Conta</div>
                        <div className="text-sm text-gray-600">
                          Disponível: R$ {profile?.balance?.toFixed(2) || '0,00'}
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={selectedPaymentMethod === 'card'}
                        onChange={() => setSelectedPaymentMethod('card')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium">Cartão de Crédito</div>
                        <div className="text-sm text-gray-600">
                          + 2% taxa (R$ {(preReservationData.final_cost * 0.02).toFixed(2)})
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button 
                  onClick={handleConfirmReservation}
                  className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
                  disabled={isProcessing || (selectedPaymentMethod === 'balance' && (profile?.balance || 0) < preReservationData.final_cost)}
                >
                  {isProcessing ? 'Processando...' : 
                   preReservationData.can_confirm_immediately ? 
                   '🎉 Confirmar Reserva Imediatamente' : 
                   '⏰ Aguardar Confirmação (12h)'}
                </Button>

                {selectedPaymentMethod === 'balance' && (profile?.balance || 0) < preReservationData.final_cost && (
                  <p className="text-red-600 text-sm text-center">
                    Saldo insuficiente. Recarregue sua conta ou escolha outro método de pagamento.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationalBookingFlow;
