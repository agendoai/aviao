import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { convertUTCToBrazilianTime, formatUTCToBrazilian, formatUTCToBrazilianDateTime } from '@/utils/dateUtils';
import { Clock, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
}

interface Booking {
  id: number;
  userId: number;
  aircraftId: number;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  passengers: number;
  flight_hours: number;
  overnight_stays: number;
  value: number;
  status: string;
  blocked_until: string;
  maintenance_buffer_hours: number;
  aircraft?: Aircraft;
  user?: any;
}

interface SimpleCalendarProps {
  aircraftId?: number;
  onSlotSelect?: (start: Date, end: Date) => void;
  onEventClick?: (event: any) => void;
}

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  aircraftId,
  onSlotSelect,
  onEventClick
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<number | null>(aircraftId || null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTimeDialog, setShowTimeDialog] = useState(false);

  // Buscar aeronaves disponíveis apenas se não tiver aircraftId
  useEffect(() => {
    if (!aircraftId) {
      fetchAircrafts();
    }
  }, [aircraftId]);

  // Buscar agenda quando aeronave mudar
  useEffect(() => {
    if (selectedAircraft) {
      fetchBookings();
    }
  }, [selectedAircraft]);

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

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
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

  const fetchBookings = async () => {
    if (!selectedAircraft) return;

    setLoading(true);
    try {
      const backendUrl = resolveBackendUrl();
      
      // Buscar tanto as reservas quanto os slots configurados pelo admin
      const [bookingsResponse, calendarResponse] = await Promise.all([
        fetch(`${backendUrl}/bookings?aircraftId=${selectedAircraft}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }),
        fetch(`${backendUrl}/calendar`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
      ]);

      if (!bookingsResponse.ok || !calendarResponse.ok) {
        throw new Error(`Erro na requisição`);
      }

      const bookingsData = await bookingsResponse.json();
      const calendarData = await calendarResponse.json();
      
      console.log('📅 Bookings recebidos:', bookingsData);
      console.log('📅 Calendar (slots admin) recebidos:', calendarData);
      
      // Combinar reservas normais com slots configurados pelo admin
      let allBookings = [];
      
      // Adicionar reservas normais
      if (bookingsData.success && Array.isArray(bookingsData.bookings)) {
        allBookings = [...bookingsData.bookings];
      } else if (Array.isArray(bookingsData)) {
        allBookings = [...bookingsData];
      }
      
      // Adicionar slots configurados pelo admin (apenas para a aeronave selecionada)
      if (Array.isArray(calendarData)) {
        const adminSlots = calendarData.filter(slot => 
          slot.aircraftId === selectedAircraft && 
          slot.status === 'available'
        );
        allBookings = [...allBookings, ...adminSlots];
      }
      
      console.log('📅 Todos os bookings combinados:', allBookings);
      setBookings(allBookings);
      
    } catch (error) {
      console.error('Erro ao buscar bookings:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  // Calcular períodos bloqueados (apenas missões reais, não slots disponíveis)
  const blockedPeriods = useMemo(() => {
    console.log('🔍 Calculando blockedPeriods, bookings:', bookings);
    
    // Garantir que bookings seja sempre um array
    if (!bookings || !Array.isArray(bookings)) {
      console.warn('Bookings não é um array válido:', bookings);
      return [];
    }
    
    // Filtrar apenas missões reais (não slots disponíveis configurados pelo admin)
    const realMissions = bookings.filter(booking => 
      booking.status !== 'available' || 
      (booking.origin !== 'AGENDA' && booking.destination !== 'AGENDA')
    );
    
    console.log('🎯 Missões reais encontradas:', realMissions.length);
    
    return realMissions.map(booking => {
      // Converter datas UTC para horário brasileiro
      const start = convertUTCToBrazilianTime(booking.departure_date);
      let end: Date;
      
      if (booking.blocked_until) {
        end = convertUTCToBrazilianTime(booking.blocked_until);
      } else {
        // Calcular: retorno + tempo de voo de volta + 3h de manutenção
        const returnDate = convertUTCToBrazilianTime(booking.return_date);
        const totalFlightDuration = booking.flight_hours || 1;
        const returnFlightDuration = totalFlightDuration / 2; // Metade do tempo total para o voo de volta
        const returnFlightDurationMinutes = returnFlightDuration * 60;
        const flightEnd = new Date(returnDate.getTime() + (returnFlightDurationMinutes * 60 * 1000));
        end = new Date(flightEnd.getTime() + (3 * 60 * 60 * 1000)); // +3h de manutenção
        
        console.log(`🔍 Cálculo de bloqueio para missão ${booking.id}:`);
        console.log(`🔍   Partida: ${start.toLocaleString('pt-BR')}`);
        console.log(`🔍   Retorno: ${returnDate.toLocaleString('pt-BR')}`);
        console.log(`🔍   Tempo total de voo: ${totalFlightDuration}h`);
        console.log(`🔍   Tempo de voo de volta: ${returnFlightDuration}h`);
        console.log(`🔍   Fim do voo de volta: ${flightEnd.toLocaleString('pt-BR')}`);
        console.log(`🔍   Bloqueado até: ${end.toLocaleString('pt-BR')}`);
      }

      return {
        id: booking.id,
        start,
        end,
        title: `${booking.origin} → ${booking.destination}`,
        status: booking.status,
        booking
      };
    });
  }, [bookings]);

  // Verificar se uma data está bloqueada (apenas se estiver completamente ocupada)
  const isDateBlocked = (date: Date): boolean => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Verificar se há algum período que bloqueia o dia inteiro
    const blockingPeriods = blockedPeriods.filter(period => {
      return period.start <= dayStart && period.end >= dayEnd;
    });

    // Se há um período que bloqueia o dia inteiro, então está bloqueado
    return blockingPeriods.length > 0;
  };

  // Verificar se um horário específico está disponível
  const isTimeSlotAvailable = (date: Date, hour: number): boolean => {
    const now = new Date();
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    
    // Se é no passado, não está disponível
    if (slotDate < now) {
      return false;
    }

    // Verificar se conflita com algum período bloqueado
    const slotEnd = new Date(slotDate);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const hasConflict = blockedPeriods.some(period => {
      return slotDate < period.end && slotEnd > period.start;
    });

    if (hasConflict) {
      console.log(`❌ Horário ${hour}:00 do dia ${format(date, 'dd/MM/yyyy')} está bloqueado`);
    }

    return !hasConflict;
  };



  // Verificar se um dia tem horários disponíveis
  const hasAvailableTimeSlots = (date: Date): boolean => {
    const availableSlots = getAvailableTimeSlots(date);
    return availableSlots.some(slot => {
      const hour = slot.date.getHours();
      return isTimeSlotAvailable(date, hour);
    });
  };

  // Gerar horários disponíveis para um dia
  const getAvailableTimeSlots = (date: Date) => {
    const slots = [];
    
    // Buscar slots configurados pelo admin para este dia e aeronave
    const adminSlots = bookings.filter(booking => {
      if (booking.aircraftId !== selectedAircraft) return false;
      if (booking.status !== 'available') return false;
      
      const bookingDate = convertUTCToBrazilianTime(booking.departure_date);
      return format(bookingDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
    
    console.log('🔍 Slots admin para', format(date, 'dd/MM/yyyy'), ':', adminSlots);
    
    // Se há slots configurados pelo admin, mostrar horários disponíveis
    if (adminSlots.length > 0) {
      // Mostrar horários de 0h às 23h (24 horas), mas apenas os disponíveis
      for (let hour = 0; hour < 24; hour++) {
        if (isTimeSlotAvailable(date, hour)) {
          const slotDate = new Date(date);
          slotDate.setHours(hour, 0, 0, 0);
          
          slots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            date: slotDate
          });
        }
      }
    } else {
      // Se não há slots configurados, mostrar horários padrão disponíveis
      const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      
      for (const hour of hours) {
        if (isTimeSlotAvailable(date, hour)) {
          const slotDate = new Date(date);
          slotDate.setHours(hour, 0, 0, 0);
          
          slots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            date: slotDate
          });
        }
      }
    }

    return slots;
  };

  // Gerar dias do mês
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Adicionar dias do mês anterior para completar a primeira semana
    const firstDayOfWeek = start.getDay();
    const daysFromPrevMonth = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      daysFromPrevMonth.push(subMonths(start, 1).getDate() - i);
    }

    return { days, daysFromPrevMonth };
  }, [currentMonth]);

  const handleDateClick = (date: Date) => {
    if (isDateBlocked(date)) {
      toast.error('Este dia está bloqueado por uma missão');
      return;
    }

    const availableSlots = getAvailableTimeSlots(date);
    if (availableSlots.length === 0) {
      toast.error('Nenhum horário disponível neste dia');
      return;
    }

    setSelectedDate(date);
    setShowTimeDialog(true);
  };

  const handleTimeSelect = (slotDate: Date) => {
    const endDate = new Date(slotDate);
    endDate.setHours(slotDate.getHours() + 1, 0, 0, 0);
    
    if (onSlotSelect) {
      onSlotSelect(slotDate, endDate);
    }
    
    setShowTimeDialog(false);
    setSelectedDate(null);
    toast.success(`Horário selecionado: ${format(slotDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500';
      case 'confirmada': return 'bg-green-500';
      case 'paga': return 'bg-emerald-600';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        <span className="ml-2 text-gray-600">Carregando agenda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Aeronave */}
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

      {/* Calendário */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Calendário de Disponibilidade</h3>
          <p className="text-sm text-gray-600">Clique em um dia para ver horários disponíveis</p>
        </div>

        {/* Navegação do Mês */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMonthChange('prev')}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>
          
          <h4 className="text-lg font-medium text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h4>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMonthChange('next')}
            className="flex items-center space-x-1"
          >
            <span>Próximo</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid do Calendário */}
        <div className="grid grid-cols-7 gap-1">
          {/* Cabeçalho dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50 rounded">
              {day}
            </div>
          ))}
          
          {/* Dias do mês anterior (esmaecidos) */}
          {calendarDays.daysFromPrevMonth.map((day, index) => (
            <div key={`prev-${index}`} className="p-2 text-center text-sm text-gray-300 bg-gray-50 rounded">
              {day}
            </div>
          ))}
          
          {/* Dias do mês atual */}
          {calendarDays.days.map((date, index) => {
            const isBlocked = isDateBlocked(date);
            const isCurrentDay = isToday(date);
            const isPast = isBefore(date, new Date()) && !isCurrentDay;
            const hasAvailable = hasAvailableTimeSlots(date);
            
            return (
              <button
                key={index}
                onClick={() => !isPast && hasAvailable && handleDateClick(date)}
                disabled={isPast || isBlocked || !hasAvailable}
                className={`p-2 text-sm rounded-lg transition-all ${
                  isCurrentDay
                    ? 'ring-2 ring-sky-300 bg-sky-50'
                    : isBlocked
                    ? 'bg-red-100 text-red-600 cursor-not-allowed'
                    : isPast
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : hasAvailable
                    ? 'bg-white border border-gray-200 hover:bg-sky-50 hover:border-sky-300 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>{date.getDate()}</span>
                  {isBlocked && (
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                  )}
                  {!isBlocked && !isPast && hasAvailable && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                  )}
                  {!isBlocked && !isPast && !hasAvailable && (
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-1"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Missões do Mês (apenas missões reais) */}
        {blockedPeriods.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Missões do Mês:</h5>
            <div className="space-y-2">
              {blockedPeriods
                .filter(period => {
                  const periodStart = startOfMonth(currentMonth);
                  const periodEnd = endOfMonth(currentMonth);
                  return period.start <= periodEnd && period.end >= periodStart;
                })
                .map(period => (
                  <div key={period.id} className="flex items-center space-x-2 text-sm">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(period.status)}`}></div>
                    <span className="text-gray-600">{period.title}</span>
                    <span className="text-gray-500">
                      {formatUTCToBrazilian(period.start, 'dd/MM')} - {formatUTCToBrazilian(period.end, 'dd/MM')}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Horários Configurados pelo Admin */}
        {(() => {
          const adminSlots = bookings.filter(booking => 
            booking.status === 'available' && 
            booking.origin === 'AGENDA' && 
            booking.destination === 'AGENDA'
          );
          
          if (adminSlots.length > 0) {
            const slotsInMonth = adminSlots.filter(slot => {
              const slotDate = convertUTCToBrazilianTime(slot.departure_date);
              const periodStart = startOfMonth(currentMonth);
              const periodEnd = endOfMonth(currentMonth);
              return slotDate >= periodStart && slotDate <= periodEnd;
            });
            
            if (slotsInMonth.length > 0) {
              return (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-700 mb-3">Horários Disponíveis (Configurados pelo Admin):</h5>
                                     <div className="text-xs text-blue-600">
                     <p>✅ Dias com horários configurados: {new Set(slotsInMonth.map(slot => 
                       format(convertUTCToBrazilianTime(slot.departure_date), 'dd/MM')
                     )).size} dias</p>
                     <p>🕐 Horário de operação: 00:00 às 23:59 (24 horas)</p>
                   </div>
                </div>
              );
            }
          }
          return null;
        })()}
      </div>

      {/* Legenda */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm font-medium text-gray-700 mb-3">Legenda:</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Dia disponível</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Dia bloqueado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Sem horários</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Pendente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-xs text-gray-600">Confirmada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="text-xs text-gray-600">Cancelada</span>
          </div>
        </div>
      </div>

      {/* Dialog de Seleção de Horário */}
      <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Horários Disponíveis - {selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {selectedDate && getAvailableTimeSlots(selectedDate).map((slot) => (
              <Button
                key={slot.time}
                variant="outline"
                size="sm"
                onClick={() => handleTimeSelect(slot.date)}
                className="flex items-center space-x-2"
              >
                <Clock className="h-3 w-3" />
                <span>{slot.time}</span>
              </Button>
            ))}
          </div>
          {selectedDate && getAvailableTimeSlots(selectedDate).length === 0 && (
            <div className="text-center text-gray-500 py-4">
              <X className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum horário disponível neste dia</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleCalendar;
