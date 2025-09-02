import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plane, MapPin, Clock, Users, Mail } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Destination {
  icao: string;
  name: string;
  arrival: Date;
  departure: Date;
  airportFee: number;
  isOvernight: boolean;
  overnightFee: number;
  flightTime: number;
}

interface MissionConfirmationProps {
  aircraft: string;
  missionStart: Date;
  missionEnd: Date;
  destinations: Destination[];
  totalCost: number;
  onFinish: () => void;
}

const MissionConfirmation: React.FC<MissionConfirmationProps> = ({
  aircraft,
  missionStart,
  missionEnd,
  destinations,
  totalCost,
  onFinish
}) => {
  const generateSchedule = () => {
    const schedule = [];
    let currentTime = new Date(missionStart);
    
    // Saída de Araçatuba
    schedule.push({
      time: currentTime,
      location: 'Araçatuba-SBAU',
      action: 'Decolagem',
      type: 'departure'
    });

    destinations.forEach((dest, index) => {
      // Chegada no destino
      currentTime = new Date(currentTime.getTime() + dest.flightTime * 60 * 1000);
      schedule.push({
        time: currentTime,
        location: `${dest.icao} - ${dest.name}`,
        action: 'Chegada',
        type: 'arrival'
      });

      // Partida do destino
      schedule.push({
        time: dest.departure,
        location: `${dest.icao} - ${dest.name}`,
        action: 'Decolagem',
        type: 'departure'
      });

      currentTime = new Date(dest.departure);
    });

    // Retorno para Araçatuba
    if (destinations.length > 0) {
      const lastDest = destinations[destinations.length - 1];
      const returnTime = new Date(lastDest.departure.getTime() + lastDest.flightTime * 60 * 1000);
      schedule.push({
        time: returnTime,
        location: 'Araçatuba-SBAU',
        action: 'Pouso Final',
        type: 'arrival'
      });
    }

    return schedule;
  };

  const schedule = generateSchedule();
  const totalFlightTime = destinations.reduce((acc, dest) => acc + dest.flightTime, 0) * 2; // ida + volta
  const aircraftBlockedUntil = addHours(missionEnd, -3); // Remove as 3h para mostrar pouso real

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-6 w-6" />
            <span>Missão Confirmada!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            Sua missão foi confirmada. A aeronave está reservada para você.
          </p>
          <div className="space-y-3 mt-4">
            {schedule.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded border">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${item.type === 'departure' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.location}</div>
                  <div className="text-sm text-gray-600">{item.action}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {format(item.time, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(item.time, "HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center space-x-2 text-blue-800 font-medium mb-2 mt-4">
              <Clock className="h-4 w-4" />
              <span>Bloqueio da Aeronave</span>
            </div>
            <div className="text-sm text-blue-700">
              <p>Aeronave ficará bloqueada até {format(missionEnd, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              <p className="text-xs mt-1">
                (Pouso previsto: {format(aircraftBlockedUntil, "HH:mm")} + 3h para manutenção)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center">
        <Button 
          onClick={onFinish}
          className="bg-aviation-gradient hover:opacity-90"
        >
          Voltar à Agenda
        </Button>
      </div>
    </div>
  );
};

export default MissionConfirmation;
