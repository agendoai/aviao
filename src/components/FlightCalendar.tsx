

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plane, Clock, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { validarHorarioCalendario, converterBookingParaMissao, sugerirHorarios } from '@/services/missionValidator';
import 'react-big-calendar/lib/css/react-big-calendar.css';

type Booking = Tables<'bookings'>;
type Aircraft = Tables<'aircraft'>;

const localizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string, culture?: string) => {
    return format(date, formatStr, { locale: ptBR });
  },
  parse: (dateStr: string, formatStr: string, culture?: string) => {
    return parse(dateStr, formatStr, new Date(), { locale: ptBR });
  },
  startOfWeek: (date: Date, culture?: string) => {
    return startOfWeek(date, { weekStartsOn: 0, locale: ptBR });
  },
  getDay: (date: Date) => {
    return getDay(date);
  },
  locales: {
    'pt-BR': ptBR,
  },
});

// Messages for the calendar
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

interface ValidationMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  suggestedTime?: Date;
  showSuggestions?: boolean;
}

const FlightCalendar: React.FC<FlightCalendarProps> = ({ selectedAircraft, onDateSelect }) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<FlightEvent[]>([]);
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationMessage, setValidationMessage] = useState<ValidationMessage | null>(null);
  const [suggestedTimes, setSuggestedTimes] = useState<Date[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

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
        setBookings(data); // Guardar bookings para validação
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
    
    // Validar o horário selecionado
    const validacao = validarHorarioCalendario(start, bookings, 2); // 2 horas padrão
    
    if (validacao.valido) {
      // Horário válido
      setValidationMessage({
        type: 'success',
        title: '✅ Horário Disponível',
        message: 'Este horário está disponível para agendamento. Clique em "Nova Reserva" para continuar.',
        showSuggestions: false
      });
      setSuggestedTimes([]);
      
      if (onDateSelect) {
        onDateSelect(start);
      }
    } else {
      // Horário inválido - mostrar mensagem e sugestões
      setValidationMessage({
        type: 'error',
        title: '⛔ Horário Indisponível',
        message: validacao.mensagem,
        suggestedTime: validacao.sugerido,
        showSuggestions: true
      });
      
      // Gerar sugestões de horários
      if (validacao.sugerido) {
        const sugestoes = sugerirHorarios(start, 2, bookings.map(converterBookingParaMissao));
        setSuggestedTimes(sugestoes);
      } else {
        setSuggestedTimes([]);
      }
    }
  };

  const handleSelectEvent = (event: FlightEvent) => {
    const booking = event.resource.booking;
    toast({
      title: "Detalhes do Voo",
      description: `${booking.origin} → ${booking.destination} | Passageiros: ${booking.passengers} | Status: ${booking.status}`,
    });
  };

  // Limpar validação quando necessário
  const clearValidation = () => {
    setSelectedDate(null);
    setValidationMessage(null);
    setSuggestedTimes([]);
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Calendário de Voos</span>
              </CardTitle>
              <CardDescription>
                Visualize disponibilidade em tempo real - Clique em uma data para reservar
              </CardDescription>
            </div>
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearValidation}
                className="text-xs"
              >
                Limpar Seleção
              </Button>
            )}
          </div>
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
          <CardTitle>Legenda e Validação Inteligente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legenda dos eventos */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Eventos do Calendário:</h4>
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
            </div>
            
            {/* Informações sobre validação */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">Validação Inteligente:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>✅ <strong>Horário Disponível:</strong> Pode agendar normalmente</span>
                </div>
                <div className="flex items-start space-x-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>⛔ <strong>Horário Indisponível:</strong> Precisa de 3h livres antes da decolagem</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>💡 <strong>Sugestões Automáticas:</strong> Sistema recomenda próximos horários disponíveis</span>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>⚠️ <strong>Regra de 3 Horas:</strong> Cada missão precisa de 3h de preparação antes da decolagem</span>
                </div>
              </div>
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
            {/* Mensagem de Validação */}
            {validationMessage && (
              <div className={`mb-4 p-4 rounded-lg border ${
                validationMessage.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : validationMessage.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : validationMessage.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-start space-x-3">
                  {validationMessage.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                  {validationMessage.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                  {validationMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{validationMessage.title}</h4>
                    <p className="text-sm">{validationMessage.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sugestões de Horários */}
            {validationMessage?.showSuggestions && suggestedTimes.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Horários Sugeridos:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {suggestedTimes.map((time, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(time);
                        setValidationMessage({
                          type: 'success',
                          title: '✅ Horário Selecionado',
                          message: `Horário sugerido selecionado: ${format(time, 'dd/MM/yyyy às HH:mm', { locale: ptBR })}`,
                          showSuggestions: false
                        });
                        setSuggestedTimes([]);
                        if (onDateSelect) {
                          onDateSelect(time);
                        }
                      }}
                      className="text-xs bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                    >
                      {format(time, 'dd/MM HH:mm', { locale: ptBR })}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Clique em um horário sugerido para selecioná-lo automaticamente
                </p>
              </div>
            )}

            {/* Botão de Nova Reserva - só mostrar se o horário for válido */}
            {validationMessage?.type === 'success' && (
              <div className="space-y-3">
                <p className="text-gray-600">
                  Este horário está disponível para agendamento. Clique em "Nova Reserva" para continuar.
                </p>
                <Button 
                  onClick={() => onDateSelect && onDateSelect(selectedDate)}
                  className="bg-aviation-gradient hover:opacity-90 text-white"
                >
                  <Plane className="h-4 w-4 mr-2" />
                  Nova Reserva
                </Button>
              </div>
            )}

            {/* Mensagem quando horário é inválido */}
            {validationMessage?.type === 'error' && (
              <div className="space-y-3">
                <p className="text-gray-600">
                  Este horário não está disponível. Verifique as sugestões acima ou selecione outro horário no calendário.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedDate(null);
                      setValidationMessage(null);
                      setSuggestedTimes([]);
                    }}
                  >
                    Limpar Seleção
                  </Button>
                  {validationMessage.suggestedTime && (
                    <Button 
                      onClick={() => {
                        const suggestedDate = validationMessage.suggestedTime!;
                        setSelectedDate(suggestedDate);
                        setValidationMessage({
                          type: 'success',
                          title: '✅ Horário Sugerido Selecionado',
                          message: `Horário sugerido selecionado: ${format(suggestedDate, 'dd/MM/yyyy às HH:mm', { locale: ptBR })}`,
                          showSuggestions: false
                        });
                        setSuggestedTimes([]);
                        if (onDateSelect) {
                          onDateSelect(suggestedDate);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Usar Horário Sugerido
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlightCalendar;

