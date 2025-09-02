
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Plus, Clock, Loader2 } from 'lucide-react';
import { format, startOfWeek, addDays, addHours, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getBookings } from '@/utils/api';

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

interface Reservation {
  id: number;
  aircraftId: number;
  start: Date;
  end: Date;
  user: string;
  destination: string;
  status: string;
}

interface WeeklyScheduleProps {
  aircraft: Aircraft[];
  onCreateMission: (aircraft: Aircraft, timeSlot: { start: Date; end: Date }) => void;
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ aircraft, onCreateMission }) => {
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Iniciar na semana atual, começando na segunda-feira
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Buscar reservas reais da API
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const bookingsData = await getBookings();
        
        // Converter dados da API para o formato do componente
        const formattedReservations: Reservation[] = bookingsData.map((booking: any) => ({
          id: booking.id,
          aircraftId: booking.aircraftId,
          start: new Date((booking.departure_date || booking.createdAt).replace('Z', '-03:00')),
          end: new Date((booking.return_date || new Date(booking.createdAt).getTime() + 8 * 60 * 60 * 1000).replace('Z', '-03:00')),
          user: booking.user?.name || 'Usuário',
          destination: booking.destination || 'N/A',
          status: booking.status
        }));
        
        setReservations(formattedReservations);
        // console.log('✅ Reservas carregadas:', formattedReservations);
      } catch (error) {
        console.error('❌ Erro ao carregar reservas:', error);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [currentWeek]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 6); // 6h às 19h

  const getReservationForSlot = (aircraftId: number, day: Date, hour: number) => {
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

  const isSlotAvailable = (aircraftId: number, day: Date, hour: number) => {
    return !getReservationForSlot(aircraftId, day, hour);
  };

  const handleSlotClick = (aircraft: Aircraft, day: Date, hour: number) => {
    if (!isSlotAvailable(aircraft.id, day, hour)) return;

    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(day);
    end.setHours(hour + 8, 0, 0, 0); // 8 horas padrão para dar flexibilidade

    onCreateMission(aircraft, { start, end });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Carregando agenda...</p>
        </div>
      </div>
    );
  }

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
