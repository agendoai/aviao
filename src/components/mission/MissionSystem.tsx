
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plane, MapPin, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import WeeklySchedule from './WeeklySchedule';
import MissionCreation from './MissionCreation';
import TripTypeSelection from './TripTypeSelection';
import SharedFlightOptions from './SharedFlightOptions';
import SharedFlights from './SharedFlights';
import CreateSharedMission from './CreateSharedMission';
import SharedFlightSeatSelection from './SharedFlightSeatSelection';
import SharedFlightPassengerInfo from './SharedFlightPassengerInfo';
import SharedFlightBookingConfirmation from './SharedFlightBookingConfirmation';
import FinancialVerification from './FinancialVerification';
import MissionConfirmation from './MissionConfirmation';
import SharedMissionConfirmation from './SharedMissionConfirmation';

interface SharedFlight {
  id: string;
  aircraft: string;
  departure: Date;
  arrival: Date;
  origin: string;
  destination: string;
  totalSeats: number;
  availableSeats: number;
  owner: string;
  stops?: string[];
}

interface PassengerInfo {
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'cpf' | 'rg';
}

interface Aircraft {
  id: string;
  name: string;
  registration: string;
  model: string;
}

const MissionSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState<'trip-type' | 'schedule' | 'shared-options' | 'shared-flights' | 'create-shared' | 'seat-selection' | 'passenger-info' | 'booking-confirmation' | 'shared-booking-confirmation' | 'creation' | 'financial' | 'confirmation' | 'shared-confirmation'>('trip-type');
  const [tripType, setTripType] = useState<'solo' | 'shared' | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [missionData, setMissionData] = useState<any>(null);
  const [selectedSharedFlight, setSelectedSharedFlight] = useState<SharedFlight | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo | null>(null);
  
  // Mock user data - em produção viria do contexto/Supabase
  const [userBalance] = useState(15000);
  const [userPriority] = useState(3);

  const aircraft: Aircraft[] = [
    {
      id: '1',
      name: 'Baron E55',
      registration: 'PR-FOM',
      model: 'Baron E55'
    },
    {
      id: '2',
      name: 'Cessna 172',
      registration: 'PR-ABC',
      model: 'Cessna 172'
    }
  ];

  const handleTripTypeSelection = (type: 'solo' | 'shared') => {
    setTripType(type);
    if (type === 'solo') {
      setCurrentView('schedule');
    } else {
      setCurrentView('shared-options');
    }
  };

  const handleCreateMission = (aircraft: Aircraft, timeSlot: { start: Date; end: Date }) => {
    setSelectedAircraft(aircraft);
    setSelectedTimeSlot(timeSlot);
    setCurrentView('creation');
  };

  const handleMissionCreated = (data: any) => {
    setMissionData(data);
    setCurrentView('financial');
  };

  const handleFinancialConfirm = () => {
    setCurrentView('confirmation');
  };

  const handlePaymentOption = (method: 'pix' | 'transfer') => {
    // Em produção, abrir modal de pagamento
    console.log('Opção de pagamento:', method);
  };

  const handleSelectSharedFlight = (flight: SharedFlight) => {
    setSelectedSharedFlight(flight);
    setCurrentView('seat-selection');
  };

  const handleSeatSelected = (seatNumber: number) => {
    setSelectedSeat(seatNumber);
    setCurrentView('passenger-info');
  };

  const handlePassengerInfoSubmitted = (info: PassengerInfo) => {
    setPassengerInfo(info);
    setCurrentView('booking-confirmation');
  };

  const handleBookingConfirmed = () => {
    setCurrentView('shared-booking-confirmation');
  };

  const handleCreateSharedMission = () => {
    setCurrentView('create-shared');
  };

  const handleViewExistingFlights = () => {
    setCurrentView('shared-flights');
  };

  const handleSharedMissionCreated = (data: any) => {
    setMissionData(data);
    setCurrentView('shared-confirmation');
  };

  const resetFlow = () => {
    setCurrentView('trip-type');
    setTripType(null);
    setSelectedAircraft(null);
    setSelectedTimeSlot(null);
    setMissionData(null);
    setSelectedSharedFlight(null);
    setSelectedSeat(null);
    setPassengerInfo(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Plane className="h-8 w-8 text-aviation-blue" />
            <span>Sistema de Missões</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas missões de voo com base em Araçatuba-SBAU
          </p>
        </div>
        
        {currentView !== 'trip-type' && (
          <Button 
            variant="outline" 
            onClick={resetFlow}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Nova Missão</span>
          </Button>
        )}
      </div>

      {currentView === 'trip-type' && (
        <TripTypeSelection onSelectType={handleTripTypeSelection} />
      )}

      {currentView === 'schedule' && (
        <WeeklySchedule 
          aircraft={aircraft}
          onCreateMission={handleCreateMission}
        />
      )}

      {currentView === 'shared-options' && (
        <SharedFlightOptions
          onBack={() => setCurrentView('trip-type')}
          onViewExisting={handleViewExistingFlights}
          onCreateNew={handleCreateSharedMission}
        />
      )}

      {currentView === 'create-shared' && (
        <CreateSharedMission
          onBack={() => setCurrentView('shared-options')}
          onMissionCreated={handleSharedMissionCreated}
        />
      )}

      {currentView === 'shared-flights' && (
        <SharedFlights 
          onBack={() => setCurrentView('shared-options')}
          onSelectFlight={handleSelectSharedFlight}
        />
      )}

      {currentView === 'seat-selection' && selectedSharedFlight && (
        <SharedFlightSeatSelection
          flight={selectedSharedFlight}
          onBack={() => setCurrentView('shared-flights')}
          onSeatSelected={handleSeatSelected}
        />
      )}

      {currentView === 'passenger-info' && selectedSharedFlight && selectedSeat && (
        <SharedFlightPassengerInfo
          flight={selectedSharedFlight}
          selectedSeat={selectedSeat}
          onBack={() => setCurrentView('seat-selection')}
          onPassengerInfoSubmitted={handlePassengerInfoSubmitted}
        />
      )}

      {currentView === 'booking-confirmation' && selectedSharedFlight && selectedSeat && passengerInfo && (
        <SharedFlightBookingConfirmation
          flight={selectedSharedFlight}
          selectedSeat={selectedSeat}
          passengerInfo={passengerInfo}
          onBack={() => setCurrentView('passenger-info')}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {currentView === 'creation' && (
        <MissionCreation
          aircraft={selectedAircraft!}
          initialTimeSlot={selectedTimeSlot!}
          onBack={() => setCurrentView('schedule')}
          onMissionCreated={handleMissionCreated}
        />
      )}

      {currentView === 'financial' && missionData && (
        <FinancialVerification
          totalCost={missionData.totalCost}
          userBalance={userBalance}
          userPriority={userPriority}
          onConfirm={handleFinancialConfirm}
          onPaymentOption={handlePaymentOption}
        />
      )}

      {currentView === 'confirmation' && missionData && (
        <MissionConfirmation
          aircraft={missionData.aircraft}
          missionStart={missionData.start}
          missionEnd={missionData.end}
          destinations={missionData.destinations}
          totalCost={missionData.totalCost}
          userPriority={userPriority}
          isImmediate={userPriority === 1}
          onFinish={resetFlow}
        />
      )}

      {currentView === 'shared-booking-confirmation' && selectedSharedFlight && selectedSeat && passengerInfo && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reserva Confirmada!</h2>
            <p className="text-gray-600 mb-6">
              Sua poltrona foi reservada com sucesso no voo compartilhado
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Detalhes da Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Aeronave:</span>
                  <div className="font-medium">{selectedSharedFlight.aircraft}</div>
                </div>
                <div>
                  <span className="text-gray-600">Poltrona:</span>
                  <div className="font-medium">{selectedSeat}</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Rota:</span>
                  <span className="font-medium">{selectedSharedFlight.origin} → {selectedSharedFlight.destination}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {format(selectedSharedFlight.departure, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-gray-600 mb-2">Passageiro:</div>
                <div className="font-medium">{passengerInfo.name}</div>
                <div className="text-sm text-gray-500">{passengerInfo.email}</div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <Button onClick={resetFlow} className="bg-aviation-gradient hover:opacity-90">
              Finalizar
            </Button>
          </div>
        </div>
      )}

      {currentView === 'shared-confirmation' && missionData && (
        <SharedMissionConfirmation
          missionData={missionData}
          onFinish={resetFlow}
        />
      )}
    </div>
  );
};

export default MissionSystem;
