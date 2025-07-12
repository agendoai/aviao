
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plane, MapPin, Clock } from 'lucide-react';
import WeeklySchedule from './WeeklySchedule';
import MissionCreation from './MissionCreation';
import TripTypeSelection from './TripTypeSelection';
import SharedFlights from './SharedFlights';
import FinancialVerification from './FinancialVerification';
import MissionConfirmation from './MissionConfirmation';

interface Aircraft {
  id: string;
  name: string;
  registration: string;
  model: string;
}

const MissionSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState<'trip-type' | 'schedule' | 'shared-flights' | 'creation' | 'financial' | 'confirmation'>('trip-type');
  const [tripType, setTripType] = useState<'solo' | 'shared' | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [missionData, setMissionData] = useState<any>(null);
  
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
      setCurrentView('shared-flights');
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

  const handleSelectSharedFlight = (flight: any) => {
    // Em produção, processar seleção de poltrona
    console.log('Voo compartilhado selecionado:', flight);
    setCurrentView('confirmation');
  };

  const resetFlow = () => {
    setCurrentView('trip-type');
    setTripType(null);
    setSelectedAircraft(null);
    setSelectedTimeSlot(null);
    setMissionData(null);
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

      {currentView === 'shared-flights' && (
        <SharedFlights 
          onBack={() => setCurrentView('trip-type')}
          onSelectFlight={handleSelectSharedFlight}
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
    </div>
  );
};

export default MissionSystem;
