import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plane, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

type Booking = Tables<'bookings'>;
type Aircraft = Tables<'aircraft'>;

const localizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string, culture?: string) => 
    format(date, formatStr, { locale: culture === 'pt-BR' ? ptBR : undefined }),
  parse: (dateStr: string, formatStr: string, culture?: string) => 
    parse(dateStr, formatStr, new Date(), { locale: culture === 'pt-BR' ? ptBR : undefined }),
  startOfWeek: (date: Date, culture?: string) => 
    startOfWeek(date, { weekStartsOn: 0, locale: culture === 'pt-BR' ? ptBR : undefined }),
  getDay: (date: Date) => getDay(date),
  locales: {
    'pt-BR': ptBR,
  },
});

// Simple messages for the calendar
const messages = {
  next: "Próximo",
  previous: "Anterior",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Horário",
  event: "Evento",
  noEventsInRange: "Nenhum evento neste período",
  showMore: (total: number) => `+ ${total} mais`
};

interface FlightEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    booking: Booking;
    aircraft: Aircraft;
    type: 'flight' | 'blocked' | 'maintenance';
  };
}

interface FlightCalendarProps {
  selectedAircraft?: Aircraft;
  onDateSelect?: (date: Date) => void;
}

const FlightCalendar: React.FC<FlightCalendarProps> = ({ selectedAircraft, onDateSelect }) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<FlightEvent[]>([]);
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAircraft();
    fetchBookings();
  }, []);

  const fetchAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*');
      
      if (error) throw error;
      if (data) {
        setAircraftList(data);
      }
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          aircraft:aircraft_id (*)
        `)
        .in('status', ['confirmed', 'pending']);
      
      if (error) throw error;
      if (data) {
        const calendarEvents: FlightEvent[] = [];
        
        data.forEach((booking) => {
          const aircraft = booking.aircraft as Aircraft;
          if (!aircraft) return;

          const departureDateTime = new Date(`${booking.departure_date}T${booking.departure_time}`);
          const returnDateTime = new Date(`${booking.return_date}T${booking.return_time}`);
          
          calendarEvents.push({
            id: `flight-${booking.id}`,
            title: `✈️ ${booking.origin} → ${booking.destination}`,
            start: departureDateTime,
            end: returnDateTime,
            resource: {
              booking,
              aircraft,
              type: 'flight'
            }
          });

          if (booking.blocked_until) {
            const blockedUntil = new Date(booking.blocked_until);
            calendarEvents.push({
              id: `blocked-${booking.id}`,
              title: `🔒 Manutenção/Preparação`,
              start: returnDateTime,
              end: blockedUntil,
              resource: {
                booking,
                aircraft,
                type: 'blocked'
              }
            });
          }
        });

        setEvents(calendarEvents);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos do calendário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const eventStyleGetter = (event: FlightEvent) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    switch (event.resource.type) {
      case 'flight':
        style.backgroundColor = '#3174ad';
        break;
      case 'blocked':
        style.backgroundColor = '#f59e0b';
        break;
      case 'maintenance':
        style.backgroundColor = '#ef4444';
        break;
    }

    return { style };
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    if (onDateSelect) {
      onDateSelect(start);
    }
  };

  const handleSelectEvent = (event: FlightEvent) => {
    const booking = event.resource.booking;
    toast({
      title: "Detalhes do Voo",
      description: `${booking.origin} → ${booking.destination} | Passageiros: ${booking.passengers} | Status: ${booking.status}`,
    });
  };

  if (isLoading) {
    return (
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Carregando Calendário...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Calendário de Voos</span>
          </CardTitle>
          <CardDescription>
            Visualize disponibilidade em tempo real - Clique em uma data para reservar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day']}
              defaultView="month"
              culture="pt-BR"
              messages={messages}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm">Voo Confirmado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-sm">Período de Bloqueio (+3h)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Manutenção</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card className="aviation-card border-aviation-gold">
          <CardHeader>
            <CardTitle className="text-aviation-blue">
              Data Selecionada: {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Clique em "Nova Reserva" para criar uma reserva para esta data.
            </p>
            <Button 
              onClick={() => onDateSelect && onDateSelect(selectedDate)}
              className="bg-aviation-gradient hover:opacity-90 text-white"
            >
              <Plane className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlightCalendar;
