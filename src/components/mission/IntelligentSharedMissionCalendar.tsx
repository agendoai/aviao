import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Plane
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, eachHourOfInterval, parseISO, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getCalendar } from '@/utils/api';
import { toast } from 'sonner';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictingBooking?: any;
}

interface IntelligentSharedMissionCalendarProps {
  selectedAircraft: any;
  onTimeSlotSelect: (slot: TimeSlot) => void;
  selectedTimeSlot: TimeSlot | null;
  onBack: () => void;
}

export default function IntelligentSharedMissionCalendar({
  selectedAircraft,
  onTimeSlotSelect,
  selectedTimeSlot,
  onBack
}: IntelligentSharedMissionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarEntries, setCalendarEntries] = useState<any[]>([]);

  // Gerar slots de 30 minutos das 06:00 às 22:00
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 6;
    const endHour = 22;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const start = new Date(date);
        start.setHours(hour, minute, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        
        slots.push({
          start,
          end,
          available: true
        });
      }
    }
    
    return slots;
  };

  // Buscar dados do calendário
  const fetchCalendarData = async (date: Date) => {
    if (!selectedAircraft) return;
    
    setLoading(true);
    try {
      const startDate = startOfDay(date);
      const endDate = endOfDay(addDays(date, 6)); // Uma semana
      
      const response = await getCalendar(selectedAircraft.id, startDate.toISOString(), endDate.toISOString());
      
      if (response && Array.isArray(response)) {
        setCalendarEntries(response);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do calendário:', error);
      toast.error('Erro ao carregar calendário');
    } finally {
      setLoading(false);
    }
  };

  // Verificar disponibilidade dos slots
  const checkSlotAvailability = (slots: TimeSlot[], bookings: any[]): TimeSlot[] => {
    return slots.map(slot => {
      // Verificar se há conflitos com reservas existentes
      const conflictingBooking = bookings.find(booking => {
        const bookingStart = new Date(booking.departure_date);
        const bookingEnd = new Date(booking.return_date);
        
        // Verificar sobreposição
        return (
          (slot.start >= bookingStart && slot.start < bookingEnd) ||
          (slot.end > bookingStart && slot.end <= bookingEnd) ||
          (slot.start <= bookingStart && slot.end >= bookingEnd)
        );
      });

      return {
        ...slot,
        available: !conflictingBooking,
        conflictingBooking
      };
    });
  };

  // Atualizar slots quando mudar a data ou dados do calendário
  useEffect(() => {
    if (selectedAircraft) {
      fetchCalendarData(selectedDate);
    }
  }, [selectedDate, selectedAircraft]);

  useEffect(() => {
    if (calendarEntries.length > 0) {
      const slots = generateTimeSlots(selectedDate);
      const availableSlots = checkSlotAvailability(slots, calendarEntries);
      setAvailableTimeSlots(availableSlots);
    }
  }, [calendarEntries, selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeSlotClick = (slot: TimeSlot) => {
    if (slot.available) {
      onTimeSlotSelect(slot);
    } else {
      toast.error('Horário indisponível', {
        description: 'Este horário está ocupado por outra missão'
      });
    }
  };

  const getSlotStatus = (slot: TimeSlot) => {
    if (!slot.available) {
      return 'blocked';
    }
    if (selectedTimeSlot && 
        selectedTimeSlot.start.getTime() === slot.start.getTime() &&
        selectedTimeSlot.end.getTime() === slot.end.getTime()) {
      return 'selected';
    }
    return 'available';
  };

  return (
    <div className="space-y-6">
             <div>
         <h2 className="text-lg md:text-xl font-bold text-gray-900">Selecionar Horário</h2>
         <p className="text-sm text-gray-600">Escolha a data e horário para sua missão compartilhada</p>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Calendário</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </CardContent>
        </Card>

        {/* Slots de Horário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Horários Disponíveis</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Carregando horários...</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                {availableTimeSlots.map((slot, index) => {
                  const status = getSlotStatus(slot);
                  return (
                    <Button
                      key={index}
                      variant={status === 'selected' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-12 text-xs font-medium',
                        status === 'blocked' && 'bg-red-50 text-red-600 border-red-200 cursor-not-allowed',
                        status === 'selected' && 'bg-blue-600 text-white',
                        status === 'available' && 'hover:bg-blue-50 hover:border-blue-300'
                      )}
                      onClick={() => handleTimeSlotClick(slot)}
                      disabled={status === 'blocked'}
                    >
                      <div className="flex flex-col items-center">
                        <span>{format(slot.start, 'HH:mm')}</span>
                        {status === 'blocked' && (
                          <AlertTriangle className="h-3 w-3 mt-1" />
                        )}
                        {status === 'selected' && (
                          <CheckCircle className="h-3 w-3 mt-1" />
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações da Aeronave */}
      {selectedAircraft && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Aeronave Selecionada</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Aeronave</p>
                <p className="text-lg font-bold text-gray-900">{selectedAircraft.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Registro</p>
                <p className="text-lg font-bold text-gray-900">{selectedAircraft.registration}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Capacidade</p>
                <p className="text-lg font-bold text-gray-900">{selectedAircraft.max_passengers} passageiros</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa/Hora</p>
                <p className="text-lg font-bold text-gray-900">R$ {selectedAircraft.hourly_rate?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Horário Selecionado */}
      {selectedTimeSlot && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span>Horário Selecionado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {format(selectedTimeSlot.start, 'dd/MM/yyyy', { locale: ptBR })}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {format(selectedTimeSlot.start, 'HH:mm')} - {format(selectedTimeSlot.end, 'HH:mm')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
