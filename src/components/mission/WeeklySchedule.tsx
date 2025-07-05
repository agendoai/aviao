
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Plus, Clock } from 'lucide-react';
import { format, startOfWeek, addDays, addHours, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aircraft {
  id: string;
  name: string;
  registration: string;
  model: string;
}

interface Reservation {
  id: string;
  aircraftId: string;
  start: Date;
  end: Date;
  user: string;
  destination: string;
  status: 'confirmed' | 'pre-reservation';
}

interface WeeklyScheduleProps {
  aircraft: Aircraft[];
  onCreateMission: (aircraft: Aircraft, timeSlot: { start: Date; end: Date }) => void;
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ aircraft, onCreateMission }) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  // Mock data - em produção viria do Supabase
  useEffect(() => {
    const mockReservations: Reservation[] = [
      {
        id: '1',
        aircraftId: '1',
        start: addHours(addDays(currentWeek, 1), 8),
        end: addHours(addDays(currentWeek, 1), 12),
        user: 'João Silva',
        destination: 'SBSP',
        status: 'confirmed'
      },
      {
        id: '2',
        aircraftId: '2',
        start: addHours(addDays(currentWeek, 2), 14),
        end: addHours(addDays(currentWeek, 2), 18),
        user: 'Maria Santos',
        destination: 'SBRJ',
        status: 'pre-reservation'
      }
    ];
    setReservations(mockReservations);
  }, [currentWeek]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 6); // 6h às 19h

  const getReservationForSlot = (aircraftId: string, day: Date, hour: number) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return reservations.find(res => 
      res.aircraftId === aircraftId &&
      isBefore(res.start, slotEnd) &&
      isAfter(res.end, slotStart)
    );
  };

  const isSlotAvailable = (aircraftId: string, day: Date, hour: number) => {
    return !getReservationForSlot(aircraftId, day, hour);
  };

  const handleSlotClick = (aircraft: Aircraft, day: Date, hour: number) => {
    if (!isSlotAvailable(aircraft.id, day, hour)) return;

    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(day);
    end.setHours(hour + 4, 0, 0, 0); // 4 horas padrão

    onCreateMission(aircraft, { start, end });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  return (
    <div className="space-y-6">
      {/* Navegação da semana */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigateWeek('prev')}>
          ← Semana Anterior
        </Button>
        <h2 className="text-xl font-semibold">
          {format(currentWeek, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(currentWeek, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <Button variant="outline" onClick={() => navigateWeek('next')}>
          Próxima Semana →
        </Button>
      </div>

      {/* Agendas das aeronaves */}
      {aircraft.map(plane => (
        <Card key={plane.id} className="overflow-hidden">
          <CardHeader className="bg-aviation-gradient text-white">
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>{plane.model} {plane.registration}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 w-20">Hora</th>
                    {weekDays.map(day => (
                      <th key={day.toISOString()} className="text-center p-3 min-w-32">
                        <div className="font-medium">{format(day, 'EEE', { locale: ptBR })}</div>
                        <div className="text-sm text-gray-500">{format(day, 'd/M')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(hour => (
                    <tr key={hour} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-600">
                        {hour.toString().padStart(2, '0')}:00
                      </td>
                      {weekDays.map(day => {
                        const reservation = getReservationForSlot(plane.id, day, hour);
                        const isAvailable = isSlotAvailable(plane.id, day, hour);

                        return (
                          <td key={`${day.toISOString()}-${hour}`} className="p-1">
                            {reservation ? (
                              <div className="bg-red-100 border border-red-200 rounded p-2 text-xs">
                                <div className="font-medium text-red-800">{reservation.user}</div>
                                <div className="text-red-600">{reservation.destination}</div>
                                <Badge 
                                  variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}
                                  className="mt-1 text-xs"
                                >
                                  {reservation.status === 'confirmed' ? 'Confirmado' : 'Pré-reserva'}
                                </Badge>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-16 border-2 border-dashed border-gray-200 hover:border-aviation-blue hover:bg-blue-50 flex flex-col items-center justify-center"
                                onClick={() => handleSlotClick(plane, day, hour)}
                              >
                                <Plus className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1">Livre</span>
                              </Button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Legenda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span>Período Reservado (inclui 3h extras)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-dashed border-gray-200 rounded"></div>
              <span>Janela Disponível</span>
            </div>
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-aviation-blue" />
              <span>Clique para criar missão</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklySchedule;
