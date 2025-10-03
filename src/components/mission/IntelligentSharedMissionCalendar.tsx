import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { convertUTCToBrazilianTime } from '@/utils/dateUtils';
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
  hasSecondaryDestination?: boolean;
  primaryDestination?: string;
  secondaryDestination?: string;
}

export default function IntelligentSharedMissionCalendar({
  selectedAircraft,
  onTimeSlotSelect,
  selectedTimeSlot,
  onBack,
  hasSecondaryDestination = false,
  primaryDestination = '',
  secondaryDestination = ''
}: IntelligentSharedMissionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarEntries, setCalendarEntries] = useState<any[]>([]);
  const [secondaryDepartureTime, setSecondaryDepartureTime] = useState<string>('');

  // DEBUG: Vamos logar as props para ver se estão chegando
  console.log('🔍 DEBUG IntelligentSharedMissionCalendar props:');
  console.log('   hasSecondaryDestination:', hasSecondaryDestination);
  console.log('   primaryDestination:', primaryDestination);
  console.log('   secondaryDestination:', secondaryDestination);

  // Gerar slots de 30 minutos das 06:00 às 24:00 (incluindo slots noturnos)
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 6;
    const endHour = 24; // Alterado de 22 para 24 para incluir slots até 23:30
    
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
      
      const response = await getCalendar();
      
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
        const bookingStart = convertUTCToBrazilianTime(booking.departure_date);
        const bookingEnd = convertUTCToBrazilianTime(booking.return_date);
        
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
      // Buscar próximos horários disponíveis
      const slotsDisponiveis = availableTimeSlots.filter(s => s.available);
      const proximosHorarios = slotsDisponiveis.slice(0, 3).map(s => s.start);
      
      let message = '⛔ Horário indisponível!';
      if (proximosHorarios.length > 0) {
        const sugestoes = proximosHorarios.map(h => h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })).join(', ');
        message += ` 💡 Sugestões: ${sugestoes}`;
      }
      
      toast.error(message, {
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
            
            <div className="mt-4">
              <p className="text-center text-xs text-gray-500 mb-2">
                Ir para data: {format(selectedDate, 'dd/MM/yyyy')}
              </p>
              <p className="text-center text-xs text-blue-600 font-semibold">
                Hoje
              </p>
            </div>
            
            {/* CAMPO OBRIGATÓRIO - SEMPRE VISÍVEL QUANDO TEM DESTINO SECUNDÁRIO */}
            {/* DEBUG: Forçando aparecer para testar */}
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center">
                ⚠️ Horário de Decolagem para Segundo Destino
                <span className="ml-2 bg-red-600 text-white px-2 py-1 rounded text-xs">OBRIGATÓRIO</span>
              </h4>
              <p className="text-xs text-red-600 mb-3 font-semibold">
                Preencha este campo antes de selecionar horário de retorno!
              </p>
              <p className="text-xs text-blue-600 mb-3">
                DEBUG: hasSecondaryDestination = {hasSecondaryDestination ? 'TRUE' : 'FALSE'}
              </p>
              <p className="text-xs text-blue-600 mb-3">
                DEBUG: primaryDestination = "{primaryDestination}"
              </p>
              <p className="text-xs text-blue-600 mb-3">
                DEBUG: secondaryDestination = "{secondaryDestination}"
              </p>
              
              <div className="space-y-3">
                <Label htmlFor="secondaryDeptTime" className="text-xs font-bold text-red-800">
                  Horário: {primaryDestination || 'SBSP'} → {secondaryDestination || 'SBGR'}
                </Label>
                <Input
                  id="secondaryDeptTime"
                  type="time"
                  value={secondaryDepartureTime}
                  onChange={(e) => setSecondaryDepartureTime(e.target.value)}
                  className="h-12 text-lg border-red-300 focus:border-red-500 bg-white font-bold"
                  placeholder="--:--"
                />
                
                <div className="bg-red-100 p-2 rounded text-xs text-red-700 font-bold text-center">
                  🛫 {primaryDestination || 'SBSP'} → {secondaryDestination || 'SBGR'}
                </div>
                
                {!secondaryDepartureTime ? (
                  <div className="bg-red-200 border border-red-400 p-2 rounded text-xs text-red-800 font-semibold">
                    🚫 Bloqueado: Não é possível selecionar horário de retorno até preencher este campo
                  </div>
                ) : (
                  <div className="bg-green-100 border border-green-400 p-2 rounded text-xs text-green-800 font-semibold">
                    ✅ Horário definido: {secondaryDepartureTime}
                  </div>
                )}
              </div>
            </div>
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

      {/* Campo de horário de decolagem para segundo destino */}
      {hasSecondaryDestination && selectedTimeSlot && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Plane className="h-5 w-5" />
              <span>⚠️ Horário de Decolagem para Segundo Destino</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <p className="text-sm font-semibold text-orange-800 mb-2">
                🛫 Defina quando a aeronave deve DECOLAR de {primaryDestination || 'Primeiro Destino'} para {secondaryDestination || 'Segundo Destino'}
              </p>
              <p className="text-xs text-orange-600">
                Este horário é obrigatório para missões com destino secundário
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondaryDepartureTime" className="text-sm font-bold text-orange-800">
                Horário de Decolagem: {primaryDestination} → {secondaryDestination}
              </Label>
              <Input
                id="secondaryDepartureTime"
                type="time"
                value={secondaryDepartureTime}
                onChange={(e) => setSecondaryDepartureTime(e.target.value)}
                className="h-12 text-lg border-orange-300 focus:border-orange-500 bg-white font-bold"
                placeholder="--:--"
              />
            </div>
            
            <div className="bg-white border border-orange-200 p-3 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-orange-700">
                <span className="font-bold">Rota:</span>
                <span>🏠 Base → {primaryDestination} →</span>
                <span className="bg-orange-200 px-2 py-1 rounded font-bold">{secondaryDepartureTime || '--:--'}</span>
                <span>→ {secondaryDestination} → 🏠 Base</span>
              </div>
            </div>
            
            {!secondaryDepartureTime && (
              <div className="bg-red-100 border border-red-300 p-2 rounded text-sm text-red-700 font-semibold">
                🚫 Preencha o horário de decolagem para continuar
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
