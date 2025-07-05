
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plane, MapPin, Clock } from 'lucide-react';
import WeeklySchedule from './WeeklySchedule';
import MissionCreation from './MissionCreation';

interface Aircraft {
  id: string;
  name: string;
  registration: string;
  model: string;
}

const MissionSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState<'schedule' | 'creation'>('schedule');
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

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

  const handleCreateMission = (aircraft: Aircraft, timeSlot: { start: Date; end: Date }) => {
    setSelectedAircraft(aircraft);
    setSelectedTimeSlot(timeSlot);
    setCurrentView('creation');
  };

  const handleBackToSchedule = () => {
    setCurrentView('schedule');
    setSelectedAircraft(null);
    setSelectedTimeSlot(null);
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
        
        {currentView === 'creation' && (
          <Button 
            variant="outline" 
            onClick={handleBackToSchedule}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Voltar à Agenda</span>
          </Button>
        )}
      </div>

      {currentView === 'schedule' ? (
        <WeeklySchedule 
          aircraft={aircraft}
          onCreateMission={handleCreateMission}
        />
      ) : (
        <MissionCreation
          aircraft={selectedAircraft!}
          initialTimeSlot={selectedTimeSlot!}
          onBack={handleBackToSchedule}
        />
      )}
    </div>
  );
};

export default MissionSystem;
