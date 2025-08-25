import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { PreReservationResponse, ConfirmReservationResponse } from '@/types/supabase-extended';

// Import step components
import BookingProgress from './booking-flow/BookingProgress';
import AircraftSelectionStep from './booking-flow/AircraftSelectionStep';
import SeatSelectionStep from './booking-flow/SeatSelectionStep';
import DestinationStep from './booking-flow/DestinationStep';
import CalendarStep from './booking-flow/CalendarStep';
import TimeSelectionStep from './booking-flow/TimeSelectionStep';
import IntelligentTimeSelectionStep from './booking-flow/IntelligentTimeSelectionStep';
import StopsStep from './booking-flow/StopsStep';
import { PassengerCountStep, PassengerDetailsStep } from './booking-flow/PassengerInfoStep';
import PreReservationStep from './booking-flow/PreReservationStep';
import PaymentStep from './booking-flow/PaymentStep';

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
    { step: 2, title: 'Destino', completed: destination !== '' },
    { step: 3, title: 'Data de Ida', completed: departureDate !== '' },
    { step: 4, title: 'Hora de Ida', completed: departureTime !== '' },
    { step: 5, title: 'Escalas', completed: true }, // Optional step
    { step: 6, title: 'Data de Volta', completed: returnDate !== '' },
    { step: 7, title: 'Hora de Volta', completed: returnTime !== '' },
    { step: 8, title: 'Passageiros', completed: passengersCount !== '' },
    { step: 9, title: 'Dados dos Passageiros', completed: passengersInfo.length > 0 },
    { step: 10, title: 'Pré-reserva', completed: preReservationData !== null },
    { step: 11, title: 'Pagamento', completed: false }
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
    setCurrentStep(2);
    toast({
      title: "Aeronave selecionada",
      description: `${aircraft.name} - ${aircraft.model} (Reserva integral)`,
    });
  };

  // Removed seat selection functions as aircraft is booked entirely

  const handleDestinationSubmit = () => {
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
      setCurrentStep(7);
      toast({
        title: "Data de volta selecionada",
        description: `${selectedDate}/${currentMonth.getFullYear()}`,
      });
    }
  };

  const handleTimeSelect = (time: string, type: 'departure' | 'return') => {
    if (type === 'departure') {
      setDepartureTime(time);
      setCurrentStep(5);
      toast({
        title: "Horário de ida selecionado",
        description: `${time}`,
      });
    } else {
      setReturnTime(time);
      setCurrentStep(8);
      toast({
        title: "Horário de volta selecionado",
        description: `${time}`,
      });
    }
  };

  const handleStopsSubmit = () => {
    setCurrentStep(6);
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
    const count = parseInt(passengersCount);
    const newPassengersInfo: PassengerInfo[] = [];
    for (let i = 0; i < count; i++) {
      newPassengersInfo.push({
        name: '',
        document: '',
        documentType: 'rg'
      });
    }
    setPassengersInfo(newPassengersInfo);
    setCurrentStep(9);
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
    setCurrentStep(10);
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
        setCurrentStep(11);
        
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

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BookingProgress steps={steps} currentStep={currentStep} />

      <Card className="aviation-card">
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <AircraftSelectionStep
              selectedAircraft={selectedAircraft}
              onAircraftSelect={handleAircraftSelect}
            />
          )}

          {currentStep === 2 && (
            <DestinationStep
              destination={destination}
              selectedAircraftName={selectedAircraft?.name}
              travelMode={travelMode}
              onDestinationChange={setDestination}
              onContinue={handleDestinationSubmit}
            />
          )}

          {currentStep === 3 && (
            <CalendarStep
              title="Confira as datas disponíveis para ida"
              subtitle={`GRU → ${destination.toUpperCase()}`}
              currentMonth={currentMonth}
              availableDays={availableDepartureDays}
              aircraftName={selectedAircraft?.name}
              onMonthChange={handleMonthChange}
              onDateSelect={(day) => handleDateSelect(day, 'departure')}
            />
          )}

          {currentStep === 4 && (
            <IntelligentTimeSelectionStep
              title="Selecione o horário de ida"
              selectedDate={departureDate}
              currentMonth={currentMonth}
              selectedAircraft={selectedAircraft}
              onTimeSelect={(timeSlot) => {
                if (typeof timeSlot === 'object' && timeSlot.start) {
                  const timeString = timeSlot.start.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });
                  handleTimeSelect(timeString, 'departure');
                } else {
                  handleTimeSelect(timeSlot.toString(), 'departure');
                }
              }}
              onBack={() => setCurrentStep(3)}
              onAircraftSelect={handleAircraftSelect}
            />
          )}

          {currentStep === 5 && (
            <StopsStep
              stops={stops}
              departureDate={departureDate}
              departureTime={departureTime}
              destination={destination}
              currentMonth={currentMonth}
              onStopsChange={setStops}
              onContinue={handleStopsSubmit}
            />
          )}

          {currentStep === 6 && (
            <CalendarStep
              title="Agora, selecione a data de volta"
              subtitle={`${destination.toUpperCase()} → GRU`}
              currentMonth={currentMonth}
              availableDays={availableReturnDays}
              onMonthChange={handleMonthChange}
              onDateSelect={(day) => handleDateSelect(day, 'return')}
            />
          )}

          {currentStep === 7 && (
            <IntelligentTimeSelectionStep
              title="Selecione o horário de volta"
              selectedDate={returnDate}
              currentMonth={currentMonth}
              selectedAircraft={selectedAircraft}
              onTimeSelect={(timeSlot) => {
                if (typeof timeSlot === 'object' && timeSlot.start) {
                  const timeString = timeSlot.start.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });
                  handleTimeSelect(timeString, 'return');
                } else {
                  handleTimeSelect(timeSlot.toString(), 'return');
                }
              }}
              onBack={() => setCurrentStep(6)}
              onAircraftSelect={handleAircraftSelect}
            />
          )}

          {currentStep === 8 && (
            <PassengerCountStep
              passengersCount={passengersCount}
              departureDate={departureDate}
              departureTime={departureTime}
              returnDate={returnDate}
              returnTime={returnTime}
              destination={destination}
              onPassengersCountChange={setPassengersCount}
              onContinue={handlePassengersCountSubmit}
            />
          )}

          {currentStep === 9 && (
            <PassengerDetailsStep
              passengersInfo={passengersInfo}
              onPassengerInfoChange={handlePassengerInfoChange}
              onContinue={handlePassengersInfoSubmit}
            />
          )}

          {currentStep === 10 && selectedAircraft && (
            <PreReservationStep
              selectedAircraft={selectedAircraft}
              destination={destination}
              departureDate={departureDate}
              departureTime={departureTime}
              returnDate={returnDate}
              returnTime={returnTime}
              passengersCount={passengersCount}
              stops={stops}
              currentMonth={currentMonth}
              priorityPosition={profile?.priority_position}
              isProcessing={isProcessing}
              onCreatePreReservation={handleCreatePreReservation}
            />
          )}

          {currentStep === 11 && preReservationData && (
            <PaymentStep
              preReservationData={preReservationData}
              selectedPaymentMethod={selectedPaymentMethod}
              userBalance={profile?.balance}
              aircraftHourlyRate={selectedAircraft?.hourly_rate}
              isProcessing={isProcessing}
              onPaymentMethodChange={setSelectedPaymentMethod}
              onConfirmReservation={handleConfirmReservation}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationalBookingFlow;
