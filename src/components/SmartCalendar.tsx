import React, { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Clock, Check } from 'lucide-react';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
}

interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'booking' | 'maintenance' | 'unavailable';
  resource?: any;
}

interface TimeSlot {
  time: string;
  available: boolean;
  booking?: ScheduleEvent;
}

interface SmartCalendarProps {
  aircraftId?: number;
  onSlotSelect?: (start: Date, end: Date) => void;
  onEventClick?: (event: ScheduleEvent) => void;
}

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00', '00:00'
];

const SmartCalendar: React.FC<SmartCalendarProps> = ({
  aircraftId,
  onSlotSelect,
  onEventClick
}) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<number | null>(aircraftId || null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Buscar aeronaves disponíveis apenas se não tiver aircraftId
  useEffect(() => {
    if (!aircraftId) {
      fetchAircrafts();
    }
  }, [aircraftId]);

  // Buscar agenda quando aeronave ou mês mudar
  useEffect(() => {
    if (selectedAircraft) {
      fetchSchedule();
    }
  }, [selectedAircraft, currentMonth]);

  const resolveBackendUrl = () => {
    const raw = (import.meta as any).env.VITE_BACKEND_URL || 'http://72.60.62.143:4000';
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  };

  const fetchAircrafts = async () => {
    try {
      const backendUrl = resolveBackendUrl();
      const response = await fetch(`${backendUrl}/aircrafts/available`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ${response.status}: ${text.slice(0, 200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta não JSON do backend: ${text.slice(0, 120)}...`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setAircrafts(data);
        if (!selectedAircraft && data.length > 0) {
          setSelectedAircraft(data[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar aeronaves:', error);
      toast.error('Erro ao carregar aeronaves');
    }
  };

  const fetchSchedule = async () => {
    if (!selectedAircraft) return;

    setLoading(true);
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const backendUrl = resolveBackendUrl();
      const url = `${backendUrl}/schedule/bookings/${selectedAircraft}?startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(endDate.toISOString())}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ${response.status}: ${text.slice(0, 200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta não JSON do backend: ${text.slice(0, 120)}...`);
      }

      const data = await response.json();
      // console.log('📅 Dados recebidos do backend:', data);
      
      if (data && Array.isArray(data.bookings)) {
        const scheduleEvents: ScheduleEvent[] = data.bookings.map((booking: any) => {
          // Determinar o tipo baseado no status
          let eventType: 'booking' | 'maintenance' | 'unavailable';
          if (booking.status === 'blocked') {
            eventType = 'unavailable';
          } else if (booking.status === 'available') {
            eventType = 'booking'; // Slots disponíveis do admin
          } else {
            eventType = 'booking'; // Reservas reais
          }

          // Criar datas corretas
          const startDate = new Date(booking.departure_date);
          const endDate = new Date(booking.return_date);

          // console.log(`📅 Processando booking ${booking.id}:`);
          // console.log(`   Status: ${booking.status}`);
          // console.log(`   Partida: ${startDate.toLocaleString()}`);
          // console.log(`   Retorno: ${endDate.toLocaleString()}`);
          // console.log(`   Blocked until: ${booking.blocked_until ? new Date(booking.blocked_until).toLocaleString() : 'N/A'}`);
          // console.log(`   Blocked until (ISO): ${booking.blocked_until || 'N/A'}`);

          return {
            id: booking.id.toString(),
            title: booking.status === 'available' 
              ? `📅 Slot Disponível` 
              : `${booking.origin} → ${booking.destination}`,
            start: startDate,
            end: endDate,
            type: eventType,
            resource: booking // Incluir o booking completo com blocked_until
          };
        });
        
        // console.log('📅 Eventos processados:', scheduleEvents.map(e => ({
          title: e.title,
          start: e.start.toLocaleString(),
          end: e.end.toLocaleString(),
          blocked_until: e.resource?.blocked_until ? new Date(e.resource.blocked_until).toLocaleString() : 'N/A'
        })));
        
        setEvents(scheduleEvents);
        
        // Gerar datas disponíveis para o mês
        generateAvailableDates(scheduleEvents);
      }
    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDates = (scheduleEvents: ScheduleEvent[]) => {
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset para início do dia
    
    // Filtrar datas que não estão completamente ocupadas
    const available = allDates.filter(date => {
      // Verificar se a data não é no passado
      if (isBefore(date, today)) {
        return false;
      }

      const dayEvents = scheduleEvents.filter(event => 
        isSameDay(new Date(event.start), date)
      );
      
             // Se há menos de 5 eventos no dia (mais permissivo), o dia está disponível
       // Ou se não há eventos cadastrados, considerar disponível
       // Ou se é uma data futura sem eventos específicos
       let isAvailable = dayEvents.length < 5 || scheduleEvents.length === 0 || dayEvents.length === 0;
       
               // Se é hoje, verificar se ainda há horários disponíveis
        if (isToday(date)) {
          const now = new Date();
          const currentHour = now.getHours();
          
          // Se já passou de meia-noite (00h), não há mais horários disponíveis hoje
          if (currentHour >= 0 && currentHour < 6) {
            // Entre 00h e 06h, ainda pode ter horários disponíveis (00:00)
            isAvailable = true;
          } else if (currentHour >= 6) {
            // Após 06h, verificar se ainda há horários futuros
            const availableSlots = getAvailableTimeSlots(date).filter(slot => slot.available);
            isAvailable = availableSlots.length > 0;
          }
        }
      
             // Debug: log para datas importantes
       if (date.getDate() === 18) {
         const now = new Date();
         const currentHour = now.getHours();
         // console.log(`🔍 Dia 18: ${date.toISOString()}, eventos: ${dayEvents.length}, hora atual: ${currentHour}h, disponível: ${isAvailable}`);
       }
      
      return isAvailable;
    });
    
    // console.log(`📅 Datas disponíveis: ${available.map(d => d.getDate()).join(', ')}`);
    setAvailableDates(available);
  };

  const getAvailableTimeSlots = (date: Date): TimeSlot[] => {
    // CORREÇÃO: Buscar TODOS os eventos que podem afetar este dia
    // Incluindo eventos que atravessam a meia-noite
    const relevantEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      
      // Calcular o período total de bloqueio (incluindo voo de volta + manutenção)
      let eventEnd: Date;
      if (event.resource?.blocked_until) {
        eventEnd = new Date(event.resource.blocked_until);
      } else {
        const returnTime = new Date(event.end);
        const totalFlightDuration = event.resource?.flight_duration || 1;
        const returnFlightDuration = totalFlightDuration / 2;
        const flightEnd = new Date(returnTime.getTime() + (returnFlightDuration * 60 * 60 * 1000));
        eventEnd = new Date(flightEnd.getTime() + (3 * 60 * 60 * 1000));
      }
      
      // Verificar se o evento afeta este dia específico
      // Um evento afeta um dia se:
      // 1. Começa neste dia, OU
      // 2. Termina neste dia, OU  
      // 3. Atravessa este dia (início antes e fim depois)
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return (eventStart <= dayEnd && eventEnd >= dayStart);
    });
    
    const now = new Date();
    const isToday = isSameDay(date, now);
    
         // console.log('🔍 SmartCalendar - Calculando slots para:', date.toLocaleDateString());
     // console.log('🔍 Eventos relevantes:', relevantEvents.length);
     relevantEvents.forEach((event, index) => {
       // console.log(`   Evento ${index + 1}: ${event.title} - ${format(event.start, 'HH:mm')} até ${format(event.end, 'HH:mm')}`);
       // console.log(`   Blocked until: ${event.resource?.blocked_until ? format(new Date(event.resource.blocked_until), 'HH:mm') : 'N/A'}`);
     });
    
    return TIME_SLOTS.map(time => {
      // Verificar se o horário já passou (se for hoje)
      if (isToday) {
        const [hours, minutes] = time.split(':').map(Number);
        const timeSlot = new Date(now);
        
        // Tratar 00:00 como 24:00 do dia atual
        if (hours === 0) {
          timeSlot.setHours(24, minutes, 0, 0);
        } else {
          timeSlot.setHours(hours, minutes, 0, 0);
        }
        
        if (timeSlot <= now) {
          return {
            time,
            available: false,
            booking: undefined
          };
        }
      }
      
             const conflictingEvent = relevantEvents.find(event => {
         // Se é um slot disponível do admin, não é conflito
         if (event.resource?.status === 'available') {
           return false;
         }

                   // Criar horário completo para o slot atual
          const [hours, minutes] = time.split(':').map(Number);
          // CORREÇÃO: Criar data UTC para comparação consistente com o backend
          const slotDateTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0));
         
         // CORREÇÃO: Determinar o período total bloqueado
         // O período bloqueado vai desde o início da missão até: retorno + voo de volta + 3h de manutenção
         let blockedUntil: Date;
         if (event.resource?.blocked_until) {
           // Se tem blocked_until, usar ele (inclui retorno + tempo de voo de volta + 3h de manutenção)
           blockedUntil = new Date(event.resource.blocked_until);
           // console.log(`🔍 Usando blocked_until: ${blockedUntil.toLocaleString()} (inclui retorno + voo de volta + manutenção)`);
         } else {
           // Se não tem blocked_until, calcular: retorno + tempo de voo de volta + 3h de manutenção
           const returnTime = new Date(event.end); // Horário de retorno
           const totalFlightDuration = event.resource?.flight_duration || 1; // tempo total de voo (ida + volta)
           const returnFlightDuration = totalFlightDuration / 2; // tempo de voo de volta (metade do total)
           const flightEnd = new Date(returnTime.getTime() + (returnFlightDuration * 60 * 60 * 1000)); // Retorno + tempo de voo de volta
           blockedUntil = new Date(flightEnd.getTime() + (3 * 60 * 60 * 1000)); // +3 horas de manutenção
           // console.log(`🔍 Calculado: retorno ${returnTime.toLocaleString()} + ${returnFlightDuration}h voo de volta + 3h manutenção = ${blockedUntil.toLocaleString()}`);
         }
         
                   // CORREÇÃO: Verificar se o slot atual está dentro do período bloqueado
          // Um slot está bloqueado se qualquer parte dele (1 hora) está dentro do período bloqueado
          const slotEnd = new Date(slotDateTime);
          slotEnd.setHours(slotDateTime.getHours() + 1, 0, 0, 0);
          
          const isBlocked = slotDateTime < blockedUntil && slotEnd > event.start;
          
          // Debug para entender o problema específico
          if (slotDateTime.getHours() === 0 || slotDateTime.getHours() === 12 || slotDateTime.getHours() === 11) {
            // console.log(`🔍 VIROU DIA DEBUG ${slotDateTime.getHours()}h:`);
            // console.log(`   slotDateTime: ${slotDateTime.toLocaleString()}`);
            // console.log(`   event.start: ${event.start.toLocaleString()}`);
            // console.log(`   blockedUntil: ${blockedUntil.toLocaleString()}`);
            // console.log(`   >= start: ${slotDateTime >= event.start}, <= end: ${slotDateTime <= blockedUntil}`);
            // console.log(`   isBlocked = ${isBlocked}`);
          }
          

         
         return isBlocked;
       });
      
      const isAvailable = !conflictingEvent;
      
             // Debug: log para slots bloqueados
       if (!isAvailable) {
         // console.log(`❌ Slot ${time} BLOQUEADO por: ${conflictingEvent?.title}`);
         // console.log(`   Evento: ${conflictingEvent?.start.toLocaleString()} → ${conflictingEvent?.resource?.blocked_until ? new Date(conflictingEvent.resource.blocked_until).toLocaleString() : conflictingEvent?.end.toLocaleString()}`);
       }
      
      return {
        time,
        available: isAvailable,
        booking: conflictingEvent
      };
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

     const handleTimeSelect = (time: string) => {
     setSelectedTime(time);
     
     if (selectedDate && onSlotSelect) {
       const selectedDateTime = new Date(selectedDate);
       const [hours, minutes] = time.split(':').map(Number);
       
       // Tratar 00:00 como 24:00 do dia atual
       if (hours === 0) {
         selectedDateTime.setHours(24, minutes, 0, 0);
       } else {
         selectedDateTime.setHours(hours, minutes, 0, 0);
       }
       
       const endDateTime = new Date(selectedDateTime);
       if (hours === 0) {
         endDateTime.setHours(25, minutes, 0, 0); // 01:00 do dia seguinte
       } else {
         endDateTime.setHours(hours + 1, minutes, 0, 0);
       }
       
       toast.success(`Horário selecionado: ${format(selectedDateTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`);
       onSlotSelect(selectedDateTime, endDateTime);
     }
   };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' 
      ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="space-y-4">
      {/* Seletor de Aeronave - apenas se não tiver aircraftId */}
      {!aircraftId && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Selecione a Aeronave:
          </label>
          <select
            value={selectedAircraft || ''}
            onChange={(e) => setSelectedAircraft(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Escolha uma aeronave</option>
            {aircrafts.map((aircraft) => (
              <option key={aircraft.id} value={aircraft.id}>
                {aircraft.name} ({aircraft.registration})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Header do Calendário */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Seleção de Data e Horário</h3>
            <p className="text-sm text-gray-600">Escolha uma data disponível e depois o horário</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Aeronave</div>
            <div className="text-sm font-medium text-gray-900">
              {selectedAircraft ? `ID: ${selectedAircraft}` : 'Selecionada'}
            </div>
          </div>
        </div>

        {/* Navegação do Mês */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleNavigate('prev')}
            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            ← Anterior
          </button>
          <h4 className="text-lg font-medium text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h4>
          <button
            onClick={() => handleNavigate('next')}
            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            Próximo →
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Carregando...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 mb-6">
            {/* Cabeçalho dos dias da semana */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50 rounded">
                {day}
              </div>
            ))}
            
            {/* Dias do mês */}
            {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate() }, (_, i) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
              const isAvailable = availableDates.some(d => isSameDay(d, date));
              const isSelected = selectedDate && isSameDay(selectedDate, date);
              const isCurrentDay = isToday(date);
              
              return (
                <button
                  key={i}
                  onClick={() => isAvailable && handleDateSelect(date)}
                  disabled={!isAvailable}
                  className={`p-2 text-sm rounded-lg transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white font-medium'
                      : isAvailable
                      ? 'bg-white border border-gray-200 hover:bg-sky-50 hover:border-sky-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } ${isCurrentDay ? 'ring-2 ring-sky-300' : ''}`}
                >
                  {i + 1}
                  {isAvailable && (
                    <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1"></div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Seleção de Horário */}
        {selectedDate && (
          <div className="border-t pt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">
              Horários disponíveis para {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}:
            </h5>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {getAvailableTimeSlots(selectedDate).map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`p-3 text-sm rounded-lg border transition-all ${
                    slot.available
                      ? selectedTime === slot.time
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'bg-white border-gray-200 hover:bg-sky-50 hover:border-sky-300'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{slot.time}</span>
                  </div>
                  {slot.available && (
                    <div className="flex items-center justify-center mt-1">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="bg-white p-3 rounded-lg border shadow-sm">
        <div className="text-sm font-medium text-gray-700 mb-2">Legenda:</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Data disponível</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Data selecionada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-xs text-gray-600">Indisponível</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCalendar;


