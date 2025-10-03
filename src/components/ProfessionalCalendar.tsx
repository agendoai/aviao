import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Clock, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { convertUTCToBrazilianTime } from '@/utils/dateUtils';

// Configurar localização
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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

interface ProfessionalCalendarProps {
  aircraftId?: number;
  onSlotSelect?: (start: Date, end: Date) => void;
  onEventClick?: (event: any) => void;
}

const ProfessionalCalendar: React.FC<ProfessionalCalendarProps> = ({
  aircraftId,
  onSlotSelect,
  onEventClick
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<number | null>(aircraftId || null);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [showSlotDialog, setShowSlotDialog] = useState(false);

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
      const response = await fetch(`${backendUrl}/bookings?aircraftId=${selectedAircraft}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();
      // console.log('📅 Bookings recebidos:', data);
      setBookings(data);
    } catch (error) {
      console.error('Erro ao buscar bookings:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  // Converter bookings para eventos do calendário
  const events = useMemo(() => {
    return bookings.map(booking => {
      // Converter para horário brasileiro preservando os componentes exatos
      const start = convertUTCToBrazilianTime(booking.departure_date);
      const end = convertUTCToBrazilianTime(booking.return_date);

      return {
        id: booking.id,
        title: `${booking.origin} → ${booking.destination}`,
        start,
        end,
        resource: booking,
        status: booking.status
      };
    });
  }, [bookings]);

  // Verificar se um horário está disponível
  const isTimeSlotAvailable = (date: Date): boolean => {
    const now = new Date();
    
    // Se é no passado, não está disponível
    if (date < now) {
      return false;
    }

    // Verificar se conflita com algum booking
    return !events.some(event => {
      const eventStart = event.start as Date;
      const eventEnd = event.end as Date;

      // Um slot está bloqueado se qualquer parte dele está dentro do período bloqueado
      const slotEnd = new Date(date);
      slotEnd.setHours(date.getHours() + 1, 0, 0, 0);

      return date < eventEnd && slotEnd > eventStart;
    });
  };

  // Gerar slots de horário disponíveis para um dia
  const getAvailableTimeSlots = (date: Date) => {
    const slots = [];
    const startHour = 6; // 06:00
    const endHour = 24; // 00:00 (meia-noite)

    for (let hour = startHour; hour < endHour; hour++) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, 0, 0, 0);
      
      if (isTimeSlotAvailable(slotDate)) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          date: slotDate
        });
      }
    }

    // Adicionar 00:00 se disponível
    const midnightSlot = new Date(date);
    midnightSlot.setHours(0, 0, 0, 0);
    if (isTimeSlotAvailable(midnightSlot)) {
      slots.push({
        time: '00:00',
        date: midnightSlot
      });
    }

    return slots;
  };

  const handleSelect = ({ start, end }: { start: Date; end: Date }) => {
    // Se clicou em um evento existente
    if (events.some(event => 
      new Date(event.start).getTime() === start.getTime() && 
      new Date(event.end).getTime() === end.getTime()
    )) {
      const event = events.find(event => 
        new Date(event.start).getTime() === start.getTime() && 
        new Date(event.end).getTime() === end.getTime()
      );
      if (event && onEventClick) {
        onEventClick(event);
      }
      return;
    }

    // Se clicou em um slot vazio, mostrar horários disponíveis
    const availableSlots = getAvailableTimeSlots(start);
    if (availableSlots.length > 0) {
      setSelectedSlot({ start, end });
      setShowSlotDialog(true);
    } else {
      toast.error('Nenhum horário disponível neste dia');
    }
  };

  const handleTimeSlotSelect = (slotDate: Date) => {
    const endDate = new Date(slotDate);
    endDate.setHours(slotDate.getHours() + 1, 0, 0, 0);
    
    if (onSlotSelect) {
      onSlotSelect(slotDate, endDate);
    }
    
    setShowSlotDialog(false);
    setSelectedSlot(null);
    toast.success(`Horário selecionado: ${format(slotDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`);
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6'; // Azul padrão
    
    switch (event.status) {
      case 'pendente':
        backgroundColor = '#f59e0b'; // Amarelo
        break;
      case 'confirmada':
        backgroundColor = '#10b981'; // Verde
        break;
      case 'paga':
        backgroundColor = '#059669'; // Verde escuro
        break;
      case 'cancelada':
        backgroundColor = '#ef4444'; // Vermelho
        break;
      case 'blocked':
        backgroundColor = '#6b7280'; // Cinza
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
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

        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={handleSelect}
            onSelectSlot={handleSelect}
            selectable
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            defaultView="month"
            culture="pt-BR"
            messages={{
              next: "Próximo",
              previous: "Anterior",
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              noEventsInRange: "Não há eventos neste período.",
              showMore: total => `+ ${total} mais`
            }}
          />
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm font-medium text-gray-700 mb-3">Legenda:</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-sky-500 rounded"></div>
            <span className="text-xs text-gray-600">Disponível</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-xs text-gray-600">Pendente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Confirmada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-600">Cancelada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-xs text-gray-600">Bloqueada</span>
          </div>
        </div>
      </div>

      {/* Dialog de Seleção de Horário */}
      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Horários Disponíveis - {selectedSlot && format(selectedSlot.start, 'dd/MM/yyyy', { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {selectedSlot && getAvailableTimeSlots(selectedSlot.start).map((slot) => (
              <Button
                key={slot.time}
                variant="outline"
                size="sm"
                onClick={() => handleTimeSlotSelect(slot.date)}
                className="flex items-center space-x-2"
              >
                <Clock className="h-3 w-3" />
                <span>{slot.time}</span>
              </Button>
            ))}
          </div>
          {selectedSlot && getAvailableTimeSlots(selectedSlot.start).length === 0 && (
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

export default ProfessionalCalendar;



