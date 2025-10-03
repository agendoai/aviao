import React, { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Clock, Check } from 'lucide-react';
// Remover conversões para horário brasileiro: trabalhar direto com UTC do backend

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
    const raw = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:4000';
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

          // Usar diretamente as datas UTC vindas do backend
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
        //   title: e.title,
        //   start: e.start.toLocaleString(),
        //   end: e.end.toLocaleString(),
        //   blocked_until: e.resource?.blocked_until ? new Date(e.resource.blocked_until).toLocaleString() : 'N/A'
        // })));
        
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

      const dayEvents = scheduleEvents.filter(event => {
        const eventStart = convertUTCToBrazilianTime(event.start);
        // FIM DA JANELA: usar SEMPRE return_date
        const eventEnd = convertUTCToBrazilianTime(event.end);

        // Limites do dia no horário local brasileiro
        const dayStartLocal = new Date(date);
        dayStartLocal.setHours(0, 0, 0, 0);
        const dayEndLocal = new Date(date);
        dayEndLocal.setDate(dayEndLocal.getDate() + 1);
        dayEndLocal.setHours(0, 0, 0, 0);

        return (eventStart < dayEndLocal && eventEnd > dayStartLocal);
      });
      
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
      // Trabalhar em UTC: eventos e limites diários em UTC
      const eventStartUTC = event.start instanceof Date ? event.start : new Date(event.start);
      const eventEndUTC = event.end instanceof Date ? event.end : new Date(event.end);

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const dayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const dayEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

      // CORREÇÃO PREVENTIVA: Para slots noturnos (21h-23h), verificar se o evento
      // tem actual_departure_date no dia atual, independentemente do período total
      let eventAffectsDay = (eventStartUTC < dayEnd && eventEndUTC > dayStart);

      // Se o evento tem actual_departure_date, usar essa data para slots noturnos
      if (event.resource?.actual_departure_date) {
        const ad = new Date(event.resource.actual_departure_date);
        const actualDepartureDayStart = new Date(Date.UTC(ad.getUTCFullYear(), ad.getUTCMonth(), ad.getUTCDate(), 0, 0, 0, 0));
        // Se a partida real (UTC) é neste dia, considerar
        const thisDayStartUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        if (actualDepartureDayStart.getTime() === thisDayStartUTC.getTime()) {
          eventAffectsDay = true;
        }
      }

      // Evento afeta o dia se há sobreposição
      return eventAffectsDay;
    });
    
    const now = new Date();
    const isToday = isSameDay(date, now);
    
    console.log('🔍 SmartCalendar - Calculando slots para:', date.toLocaleDateString());
    console.log('🔍 Eventos relevantes:', relevantEvents.length);
    console.log('🔍 É hoje:', isToday);
    console.log('🔍 Hora atual:', now.toLocaleTimeString());
    console.log('🔍 TIME_SLOTS total:', TIME_SLOTS.length);
     
    const slots = TIME_SLOTS.map(time => {
      // CORREÇÃO: Não bloquear slots por "horário passado" quando estamos vendo calendário de retorno
      // O calendário de retorno pode ser para dias futuros, então slots de 21:00 são válidos
      // Apenas bloquear se for realmente o mesmo dia E horário já passou
      if (isToday) {
        const [hours, minutes] = time.split(':').map(Number);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        let timeSlot = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
        
        // Tratar 00:00 como 24:00 do dia atual
        if (hours === 0) {
          timeSlot = new Date(Date.UTC(year, month, day + 1, 0, minutes, 0, 0));
        } else {
          // já definido acima
        }
        
        // CORREÇÃO: Só bloquear se for EXATAMENTE o mesmo dia E horário já passou
        // Se estamos vendo um calendário de retorno (dia futuro), não bloquear
        const isExactlySameDay = isSameDay(date, now);
        const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
        const isTimeInPast = isExactlySameDay && timeSlot <= nowUTC;
        
        console.log(`   🕐 Slot ${time}: data=${date.toLocaleDateString()}, hoje=${now.toLocaleDateString()}, mesmodia=${isExactlySameDay}, passou=${isTimeInPast}`);
        
        // Só bloquear se for exatamente hoje E horário passou E não há eventos
        if (relevantEvents.length === 0 && isTimeInPast) {
          console.log(`   ❌ Slot ${time} BLOQUEADO (passado no mesmo dia, sem eventos)`);
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

         // LÓGICA CORRIGIDA: Criar slot no timezone local brasileiro
         const [hours, minutes] = time.split(':').map(Number);
         const y = date.getFullYear();
         const m = date.getMonth();
         const d = date.getDate();
         // Construir slot em UTC
         const slotDateTime = hours === 0
           ? new Date(Date.UTC(y, m, d + 1, 0, minutes, 0, 0))
           : new Date(Date.UTC(y, m, d, hours, minutes, 0, 0));
         const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
         
         // Trabalhar com eventos em UTC
         const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
         const finalEnd = event.end instanceof Date ? event.end : new Date(event.end);
         
         // Comparar em UTC
         let isBlocked = slotDateTime < finalEnd && slotEndDateTime > eventStart;
         
         return isBlocked;
       });
      
      const isAvailable = !conflictingEvent;
      
      // Debug: log para slots bloqueados
      if (!isAvailable) {
        console.log(`❌ Slot ${time} BLOQUEADO por: ${conflictingEvent?.title}`);
        const finalEnd = convertUTCToBrazilianTime(conflictingEvent?.end as any);
        const eventStartLocal = convertUTCToBrazilianTime(conflictingEvent?.start as any);
        const eventEndLocal = finalEnd;
        console.log(`   Missão: ${eventStartLocal.toLocaleString('pt-BR')} → ${eventEndLocal.toLocaleString('pt-BR')}`);
      } else {
        console.log(`✅ Slot ${time} DISPONÍVEL`);
      }
      
      return {
        time,
        available: isAvailable,
        booking: conflictingEvent
      };
    });
    
    console.log(`🔍 Slots processados: ${slots.length}`);
    const availableSlots = slots.filter(s => s.available);
    const unavailableSlots = slots.filter(s => !s.available);
    console.log(`✅ Disponíveis: ${availableSlots.length} - ${availableSlots.map(s => s.time).join(', ')}`);
    console.log(`❌ Indisponíveis: ${unavailableSlots.length} - ${unavailableSlots.map(s => s.time).join(', ')}`);
    
    return slots;
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
       
       // Para horários noturnos (21:00-23:30), manter no mesmo dia selecionado
       // Para 00:00, colocar no próximo dia
       if (hours === 0) {
         // 00:00 = meia-noite do próximo dia
         selectedDateTime.setDate(selectedDate.getDate() + 1);
         selectedDateTime.setHours(0, minutes, 0, 0);
       } else {
         // Todos os outros horários (incluindo 21:00-23:30) ficam no mesmo dia
         selectedDateTime.setHours(hours, minutes, 0, 0);
       }
       
       const endDateTime = new Date(selectedDateTime);
       if (hours === 0) {
         endDateTime.setHours(1, minutes, 0, 0); // 01:00 do dia seguinte
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


