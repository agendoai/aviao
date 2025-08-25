import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plane, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTimeSlots, getAircrafts } from '@/utils/api';
import { toast } from 'sonner';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  status: string;
}

interface TimeSlot {
  start: Date;
  end: Date;
  status: 'available' | 'booked' | 'blocked' | 'invalid' | 'selected' | 'conflict';
  booking?: any;
  reason?: string;
  nextAvailable?: Date;
  blockType?: 'pre-voo' | 'missao' | 'pos-voo';
}

interface IntelligentTimeSelectionStepProps {
  title: string;
  selectedDate: string;
  currentMonth: Date;
  selectedAircraft?: Aircraft;
  onTimeSelect: (timeSlot: TimeSlot | string) => void;
  onBack: () => void;
  onAircraftSelect?: (aircraft: Aircraft) => void;
  departureDateTime?: Date; // Data/hora de partida para validar retorno
}

const IntelligentTimeSelectionStep: React.FC<IntelligentTimeSelectionStepProps> = ({
  title,
  selectedDate,
  currentMonth,
  selectedAircraft,
  onTimeSelect,
  onBack,
  onAircraftSelect,
  departureDateTime
}) => {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Iniciar na semana atual, começando na segunda-feira
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const aircraftsData = await getAircrafts();
        setAircrafts(aircraftsData);
        
        // Selecionar primeira aeronave disponível se nenhuma estiver selecionada
        if (!selectedAircraft && aircraftsData.length > 0) {
          const availableAircraft = aircraftsData.find(a => a.status === 'available');
          if (availableAircraft && onAircraftSelect) {
            onAircraftSelect(availableAircraft);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados do calendário');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Buscar slots de tempo do backend
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedAircraft) return;

      try {
        setLoadingSlots(true);
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
        
        // Estimar duração da missão (padrão 2 horas se não especificado)
        const estimatedMissionDuration = 2; // horas
        
        const slots = await getTimeSlots(
          selectedAircraft.id, 
          weekStart.toISOString(),
          undefined,
          undefined,
          estimatedMissionDuration
        );
        
        console.log('🔍 Slots recebidos do backend:', slots);
        
        // Log detalhado dos slots
        if (slots.length > 0) {
          console.log('🔍 Primeiros 5 slots:');
          slots.slice(0, 5).forEach((slot, index) => {
            console.log(`   Slot ${index + 1}:`, {
              start: slot.start,
              end: slot.end,
              status: slot.status,
              blockType: slot.blockType,
              reason: slot.reason
            });
          });
        }
        
        // Converter strings para objetos Date e validar
        // OS SLOTS JÁ ESTÃO EM HORÁRIO LOCAL (sem timezone)
        const convertedSlots = slots.map(slot => {
          // Criar datas diretamente (sem aplicar timezone)
          const start = new Date(slot.start);
          const end = new Date(slot.end);
          const nextAvailable = slot.nextAvailable ? new Date(slot.nextAvailable) : undefined;
          
          // Validar se as datas são válidas
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn('Slot com data inválida:', slot);
            return null;
          }
          
          return {
            ...slot,
            start,
            end,
            nextAvailable
          };
        }).filter(Boolean); // Remover slots inválidos
        
        console.log('🔍 Slots convertidos:', convertedSlots);
        
        // Verificar slots de pré-voo
        const preVooSlots = convertedSlots.filter(s => s.blockType === 'pre-voo');
        const missaoSlots = convertedSlots.filter(s => s.blockType === 'missao');
        const posVooSlots = convertedSlots.filter(s => s.blockType === 'pos-voo');
        
        console.log('🔍 Resumo dos slots:');
        console.log(`   Pré-voo: ${preVooSlots.length}`);
        console.log(`   Missão: ${missaoSlots.length}`);
        console.log(`   Pós-voo: ${posVooSlots.length}`);
        
        if (preVooSlots.length > 0) {
          console.log('🟡 Slots de pré-voo encontrados:');
          preVooSlots.slice(0, 3).forEach(slot => {
            console.log(`   ${slot.start.toLocaleTimeString('pt-BR')}: ${slot.reason}`);
          });
        }
        
        setTimeSlots(convertedSlots);
      } catch (error) {
        console.error('Erro ao buscar slots de tempo:', error);
        toast.error('Erro ao carregar calendário');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [selectedAircraft, currentWeek]);

  // Navegar entre semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  // Lidar com clique em slot
  const handleSlotClick = (slot: TimeSlot) => {
    // Verificar se o slot tem datas válidas
    if (!(slot.start instanceof Date) || isNaN(slot.start.getTime())) {
      console.error('Slot com data inválida:', slot);
      toast.error('Erro: data inválida no slot');
      return;
    }

    // Validar se o horário de retorno é posterior ao horário de partida
    if (departureDateTime && slot.start <= departureDateTime) {
      const departureTimeStr = departureDateTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const departureDateStr = departureDateTime.toLocaleDateString('pt-BR');
      toast.error(`❌ Horário inválido! O retorno deve ser após a partida (${departureDateStr} às ${departureTimeStr})`);
      return;
    }

    if (slot.status === 'available') {
      setSelectedSlot(slot);
      const timeString = format(slot.start, 'HH:mm');
      const dateString = format(slot.start, 'yyyy-MM-dd');
      
      console.log('🔍 Slot selecionado:');
      console.log('🔍 Data:', dateString);
      console.log('🔍 Hora:', timeString);
      console.log('🔍 Slot completo:', slot);
      
      onTimeSelect(slot); // Passar o slot completo em vez de apenas a string
      toast.success(`Horário selecionado: ${format(slot.start, 'dd/MM/yyyy às HH:mm', { locale: ptBR })}`);
    } else {
      // Mostrar mensagem de erro
      let message = 'Horário indisponível';
      if (slot.nextAvailable && slot.nextAvailable instanceof Date && !isNaN(slot.nextAvailable.getTime())) {
        message += `. Próxima disponibilidade: ${format(slot.nextAvailable, 'dd/MM às HH:mm', { locale: ptBR })}`;
      }
      toast.error(message);
    }
  };

  // Obter cor do slot baseado no status
  const getSlotColor = (slot: TimeSlot) => {
    // Debug: log do slot sendo processado
    const time = slot.start.toLocaleTimeString('pt-BR');
    console.log(`🎨 Processando slot ${time}: status=${slot.status}, blockType=${slot.blockType}`);
    
    // Verificar se o slot está selecionado
    if (selectedSlot && selectedSlot.start.getTime() === slot.start.getTime()) {
      console.log(`   → Selecionado: azul`);
      return 'bg-blue-500 border-blue-600 text-white cursor-pointer ring-2 ring-blue-300';
    }
    
    // Verificar se o horário é anterior à partida
    if (departureDateTime && slot.start <= departureDateTime) {
      console.log(`   → Anterior à partida: vermelho`);
      return 'bg-red-200 border-red-400 cursor-not-allowed';
    }

    switch (slot.status) {
      case 'available':
        console.log(`   → Disponível: verde`);
        return 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer';
      case 'booked':
        console.log(`   → Reservado: cinza`);
        return 'bg-gray-200 border-gray-400 cursor-not-allowed';
      case 'blocked':
        // Diferenciar entre tipos de bloqueio
        switch (slot.blockType) {
          case 'pre-voo':
            console.log(`   → Pré-voo: amarelo`);
            return 'bg-yellow-100 border-yellow-300 cursor-not-allowed';
          case 'pos-voo':
            console.log(`   → Pós-voo: laranja`);
            return 'bg-orange-100 border-orange-300 cursor-not-allowed';
          default:
            console.log(`   → Bloqueado (outro): vermelho`);
            return 'bg-red-100 border-red-300 cursor-not-allowed';
        }
      case 'invalid':
        console.log(`   → Inválido: vermelho`);
        return 'bg-red-200 border-red-400 cursor-not-allowed';
      case 'selected':
        console.log(`   → Selecionado: azul`);
        return 'bg-blue-500 border-blue-600 text-white cursor-pointer';
      case 'conflict':
        console.log(`   → Conflito: vermelho`);
        return 'bg-red-500 border-red-600 text-white cursor-not-allowed';
      default:
        console.log(`   → Padrão: cinza`);
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Verificar se um slot está selecionado
  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlot && selectedSlot.start.getTime() === slot.start.getTime();
  };

  // Obter ícone do slot
  const getSlotIcon = (status: TimeSlot['status'], slot?: TimeSlot) => {
    // Verificar se o slot está selecionado
    if (slot && isSlotSelected(slot)) {
      return <CheckCircle className="h-4 w-4 text-white" />;
    }
    
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'booked':
        return <Plane className="h-4 w-4 text-gray-600" />;
      case 'blocked':
        // Diferenciar entre tipos de bloqueio
        switch (slot?.blockType) {
          case 'pre-voo':
            return <Clock className="h-4 w-4 text-yellow-600" />;
          case 'pos-voo':
            return <Clock className="h-4 w-4 text-orange-600" />;

          default:
            return <AlertTriangle className="h-4 w-4 text-red-600" />;
        }
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-700" />;

      case 'selected':
        return <CheckCircle className="h-4 w-4 text-white" />;
      case 'conflict':
        return <XCircle className="h-4 w-4 text-white" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Formatar horário para exibição (HH:mm)
  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: ptBR });
  };

  // Formatar data para exibição (dd/MM)
  const formatDate = (date: Date) => {
    return format(date, 'dd/MM', { locale: ptBR });
  };

     if (loading || loadingSlots) {
     return (
       <div className="flex items-center justify-center py-6 md:py-8">
         <div className="text-center">
           <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-sky-500 mx-auto mb-2" />
           <p className="text-xs md:text-sm text-gray-600">Carregando horários disponíveis...</p>
         </div>
       </div>
     );
   }

     return (
     <TooltipProvider>
       <div className="space-y-4 md:space-y-6">
                 {/* Cabeçalho */}
         <div className="flex items-center justify-between">
           <div className="flex-1 min-w-0">
             <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{title}</h2>
             <p className="text-xs md:text-sm text-gray-600">
               Data selecionada: {selectedDate}/{currentMonth.getFullYear()}
             </p>
           </div>
           <Button variant="outline" size="sm" onClick={onBack} className="flex items-center space-x-1 md:space-x-2 ml-2 flex-shrink-0">
             <ArrowLeft className="h-4 w-4" />
             <span className="hidden sm:inline">Voltar</span>
           </Button>
         </div>

                 {/* Horário Selecionado */}
                 {selectedSlot && (
                   <Card className="mb-4 border-blue-200 bg-blue-50">
                     <CardContent className="p-3">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           <CheckCircle className="h-5 w-5 text-blue-600" />
                           <span className="font-medium text-blue-800">Horário Selecionado:</span>
                         </div>
                         <Badge variant="default" className="bg-blue-600 text-white">
                           {format(selectedSlot.start, 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
                         </Badge>
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {/* Seletor de Aeronave */}
         {onAircraftSelect && (
           <Card>
             <CardContent className="p-3 md:p-4">
               <div className="mb-3 md:mb-4">
                 <label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">
                   Aeronave:
                 </label>
                 <div className="flex flex-wrap gap-1 md:gap-2">
                   {aircrafts.map(aircraft => (
                     <Button
                       key={aircraft.id}
                       variant={selectedAircraft?.id === aircraft.id ? "default" : "outline"}
                       size="sm"
                       onClick={() => onAircraftSelect(aircraft)}
                       disabled={aircraft.status !== 'available'}
                       className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm"
                     >
                       <Plane className="h-3 w-3 md:h-4 md:w-4" />
                       <span className="truncate">{aircraft.registration}</span>
                       {aircraft.status !== 'available' && (
                         <Badge variant="secondary" className="text-xs hidden sm:inline">
                           {aircraft.status}
                         </Badge>
                       )}
                     </Button>
                   ))}
                 </div>
               </div>
             </CardContent>
           </Card>
         )}

        {/* Calendário de Horários */}
        {selectedAircraft && (
          <Card>
                         <CardHeader className="p-3 md:p-6">
               <CardTitle className="flex items-center space-x-1 md:space-x-2 text-sm md:text-base">
                 <Calendar className="h-4 w-4 md:h-5 md:w-5 text-sky-600" />
                 <span className="truncate">Horários Disponíveis (30min) - {selectedAircraft.registration}</span>
               </CardTitle>
             </CardHeader>
                         <CardContent className="p-3 md:p-6">
                             {/* Legenda */}
                             <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                               <h4 className="text-sm font-medium text-gray-700 mb-2">Legenda:</h4>
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                 <div className="flex items-center space-x-2">
                                   <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                                   <span>Disponível</span>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                   <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
                                   <span>Missão em andamento</span>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                   <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                                   <span>Pré-voo (-3h)</span>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                   <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                                   <span>Pós-voo (+3h)</span>
                                 </div>

                               </div>
                             </div>
                             
                             {/* Navegação da Semana */}
               <div className="flex items-center justify-between mb-3 md:mb-4">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => navigateWeek('prev')}
                   className="text-xs md:text-sm"
                 >
                   <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                   <span className="hidden sm:inline">Semana Anterior</span>
                   <span className="sm:hidden">Anterior</span>
                 </Button>
                 
                 <div className="text-center flex-1 mx-2">
                   <h3 className="text-sm md:text-lg font-semibold">
                     {format(currentWeek, 'MMMM yyyy', { locale: ptBR })}
                   </h3>
                   <p className="text-xs md:text-sm text-gray-600">
                     {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd/MM', { locale: ptBR })} -{' '}
                     {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd/MM', { locale: ptBR })}
                   </p>
                 </div>

                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => navigateWeek('next')}
                   className="text-xs md:text-sm"
                 >
                   <span className="hidden sm:inline">Próxima Semana</span>
                   <span className="sm:hidden">Próxima</span>
                   <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                 </Button>
               </div>

                             {/* Grade de Horários */}
               <div className="overflow-x-auto">
                 {/* Desktop: Grade completa */}
                 <div className="hidden md:block min-w-[800px]">
                   {/* Cabeçalho dos dias */}
                   <div className="grid grid-cols-8 gap-1 mb-2">
                     <div className="h-8"></div> {/* Espaço vazio para horários */}
                     {Array.from({ length: 7 }, (_, i) => {
                       const day = addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i);
                       return (
                         <div key={i} className="text-center text-sm font-medium text-gray-700 p-2 bg-gray-50 rounded">
                           <div>{format(day, 'EEE', { locale: ptBR })}</div>
                           <div className="text-xs text-gray-500">{format(day, 'dd/MM')}</div>
                         </div>
                       );
                     })}
                   </div>

                   {/* Slots de tempo */}
                   {Array.from({ length: 48 }, (_, slotIndex) => {
                     const hour = Math.floor(slotIndex / 2); // 00h às 23h
                     const minute = (slotIndex % 2) * 30; // 00 ou 30 minutos
                     const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                     
                     return (
                       <div key={slotIndex} className="grid grid-cols-8 gap-1 mb-1">
                         {/* Horário */}
                         <div className="text-right text-sm text-gray-600 p-2 pr-3 flex items-center justify-end">
                           {timeString}
                         </div>

                         {/* Slots para cada dia */}
                         {Array.from({ length: 7 }, (_, dayIndex) => {
                           const currentDay = addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), dayIndex);
                           
                           const slot = timeSlots.find(s => {
                             // Verificar se s.start é um objeto Date válido
                             if (!(s.start instanceof Date) || isNaN(s.start.getTime())) {
                               console.warn('Slot com data inválida:', s);
                               return false;
                             }
                             
                             // Verificar se é o mesmo dia, hora e minuto
                             return s.start.getDate() === currentDay.getDate() &&
                                    s.start.getMonth() === currentDay.getMonth() &&
                                    s.start.getFullYear() === currentDay.getFullYear() &&
                                    s.start.getHours() === hour && 
                                    s.start.getMinutes() === minute;
                           });

                           if (!slot) return <div key={dayIndex} className="h-8"></div>;

                           return (
                             <Tooltip key={dayIndex}>
                               <TooltipTrigger asChild>
                                 <div
                                   className={`h-8 border rounded cursor-pointer transition-colors ${getSlotColor(slot)}`}
                                   onClick={() => handleSlotClick(slot)}
                                 >
                                   <div className="flex items-center justify-center h-full">
                                     {getSlotIcon(slot.status, slot)}
                                   </div>
                                 </div>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs">
                                 <div className="space-y-1">
                                   <div className="text-sm">
                                     {departureDateTime && slot.start <= departureDateTime ? (
                                       <span className="text-red-600">❌ Antes da partida</span>
                                     ) : slot.status === 'available' ? (
                                       <span className="text-green-600">✅ Disponível</span>
                                     ) : slot.status === 'blocked' ? (
                                       <span className="text-yellow-600">{slot.reason}</span>
                                     ) : (
                                       <span className="text-red-600">{slot.reason}</span>
                                     )}
                                   </div>
                                   {departureDateTime && slot.start <= departureDateTime && (
                                     <div className="text-xs text-blue-600">
                                       ⏰ Partida: {format(departureDateTime, 'dd/MM HH:mm', { locale: ptBR })}
                                     </div>
                                   )}
                                   {slot.status === 'blocked' && slot.blockType === 'pre-voo' && (
                                     <div className="text-xs text-yellow-600">
                                       ⏰ 3h necessárias antes da decolagem
                                     </div>
                                   )}
                                   {slot.status === 'blocked' && slot.blockType === 'pos-voo' && (
                                     <div className="text-xs text-orange-600">
                                       🔧 3h de encerramento/manutenção
                                     </div>
                                   )}

                                   {slot.nextAvailable && slot.nextAvailable instanceof Date && !isNaN(slot.nextAvailable.getTime()) && (
                                     <div className="text-xs text-blue-600">
                                       ✅ Próxima disponibilidade: {format(slot.nextAvailable, 'dd/MM às HH:mm', { locale: ptBR })}
                                     </div>
                                   )}
                                 </div>
                               </TooltipContent>
                             </Tooltip>
                           );
                         })}
                       </div>
                     );
                   })}
                 </div>

                 {/* Mobile: Lista vertical de horários */}
                 <div className="md:hidden space-y-3">
                   {Array.from({ length: 7 }, (_, dayIndex) => {
                     const day = addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), dayIndex);
                     const daySlots = timeSlots.filter(s => {
                       if (!(s.start instanceof Date) || isNaN(s.start.getTime())) return false;
                       return s.start.getDate() === day.getDate();
                     });

                     return (
                       <div key={dayIndex} className="border rounded-lg p-3">
                         <div className="text-center mb-3">
                           <div className="font-medium text-gray-900">
                             {format(day, 'EEEE', { locale: ptBR })}
                           </div>
                           <div className="text-sm text-gray-600">
                             {format(day, 'dd/MM/yyyy', { locale: ptBR })}
                           </div>
                         </div>
                         
                         <div className="grid grid-cols-6 gap-2">
                           {Array.from({ length: 48 }, (_, slotIndex) => {
                             const hour = Math.floor(slotIndex / 2);
                             const minute = (slotIndex % 2) * 30;
                             const slot = daySlots.find(s => 
                               s.start.getHours() === hour && s.start.getMinutes() === minute
                             );
                             
                             if (!slot) return <div key={slotIndex} className="h-8"></div>;
                             
                             return (
                               <Tooltip key={slotIndex}>
                                 <TooltipTrigger asChild>
                                   <div
                                     className={`h-8 border rounded flex items-center justify-center transition-colors ${getSlotColor(slot)}`}
                                     onClick={() => handleSlotClick(slot)}
                                   >
                                     <div className="text-xs font-medium">
                                       {formatTime(slot.start)}
                                     </div>
                                   </div>
                                 </TooltipTrigger>
                                 <TooltipContent side="top" className="max-w-xs">
                                   <div className="space-y-1">
                                     <div className="text-sm">
                                       {departureDateTime && slot.start <= departureDateTime ? (
                                         <span className="text-red-600">❌ Antes da partida</span>
                                       ) : slot.status === 'available' ? (
                                         <span className="text-green-600">✅ Disponível</span>
                                       ) : (
                                         <span className="text-red-600">{slot.reason}</span>
                                       )}
                                     </div>
                                     {departureDateTime && slot.start <= departureDateTime && (
                                       <div className="text-xs text-blue-600">
                                         ⏰ Partida: {format(departureDateTime, 'dd/MM HH:mm', { locale: ptBR })}
                                       </div>
                                     )}
                                     {slot.nextAvailable && slot.nextAvailable instanceof Date && !isNaN(slot.nextAvailable.getTime()) && (
                                       <div className="text-xs text-blue-600">
                                         ✅ Próxima: {format(slot.nextAvailable, 'dd/MM HH:mm', { locale: ptBR })}
                                       </div>
                                     )}
                                   </div>
                                 </TooltipContent>
                               </Tooltip>
                             );
                           })}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            </CardContent>
          </Card>
        )}

                 {/* Legenda */}
         <Card>
           <CardContent className="p-3 md:p-4">
             <div className="grid grid-cols-2 md:flex md:items-center md:justify-center gap-2 md:gap-6 text-xs md:text-sm">
               <div className="flex items-center space-x-1 md:space-x-2">
                 <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                 <span>Disponível (30min)</span>
               </div>
               <div className="flex items-center space-x-1 md:space-x-2">
                 <Plane className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                 <span className="hidden sm:inline">Missão em andamento</span>
                 <span className="sm:hidden">Missão</span>
               </div>
               <div className="flex items-center space-x-1 md:space-x-2">
                 <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                 <span className="hidden sm:inline">Bloqueado (preparação/encerramento)</span>
                 <span className="sm:hidden">Bloqueado</span>
               </div>
               <div className="flex items-center space-x-1 md:space-x-2">
                 <Clock className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
                 <span className="hidden sm:inline">Espaço insuficiente</span>
                 <span className="sm:hidden">Insuficiente</span>
               </div>
               <div className="flex items-center space-x-1 md:space-x-2">
                 <XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-700" />
                 <span>Indisponível</span>
               </div>
             </div>
           </CardContent>
         </Card>

                 {/* Informações da Aeronave Selecionada */}
         {selectedAircraft && (
           <Card>
             <CardContent className="p-3 md:p-4">
               <div className="flex items-center justify-between">
                 <div className="flex-1 min-w-0">
                   <h4 className="font-medium text-sm md:text-base truncate">{selectedAircraft.registration}</h4>
                   <p className="text-xs md:text-sm text-gray-600 truncate">{selectedAircraft.model}</p>
                 </div>
                 <Badge variant={selectedAircraft.status === 'available' ? 'default' : 'secondary'} className="text-xs md:text-sm ml-2 flex-shrink-0">
                   {selectedAircraft.status === 'available' ? 'Disponível' : selectedAircraft.status}
                 </Badge>
               </div>
             </CardContent>
           </Card>
         )}
      </div>
    </TooltipProvider>
  );
};

export default IntelligentTimeSelectionStep;
