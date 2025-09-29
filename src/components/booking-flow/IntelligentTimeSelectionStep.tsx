import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { buildApiUrl } from '@/config/api';
import { convertWeekStartToBrazilianTimezone } from '@/utils/dateUtils';
import { toast } from 'sonner';
// Removido: não precisamos mais validar no frontend
// O backend já faz toda a validação corretamente

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
  isReturnSelection?: boolean; // Identifica se é seleção de retorno
  selectedAirport?: string; // Aeroporto selecionado (destino ou retorno)
  onAutoAdvance?: () => void; // Função para auto-avançar após seleção
  
  // Props simplificadas para destino secundário
  hasSecondaryDestination?: boolean; // Se tem destino secundário ativo
  selectedDestinations?: {
    primary?: string; // Aeroporto destino principal
    secondary?: string; // Aeroporto destino secundário
  };
  onSecondaryTimeUpdate?: (time: string) => void; // Callback para atualizar horário secundário
}

const IntelligentTimeSelectionStep: React.FC<IntelligentTimeSelectionStepProps> = ({
  title,
  selectedDate,
  currentMonth,
  selectedAircraft,
  onTimeSelect,
  onBack,
  onAircraftSelect,
  departureDateTime,
  isReturnSelection = false,
  selectedAirport,
  onAutoAdvance,
  hasSecondaryDestination = false,
  selectedDestinations = {},
  onSecondaryTimeUpdate
}) => {
  // DETECÇÃO INTELIGENTE: Ativar destino secundário apenas se há um destino secundário selecionado
  const hasSecondaryDestinationActive = selectedDestinations?.secondary ? true : false;

  // DEBUG: Apenas logs essenciais para o problema dos slots cinza
  if (isReturnSelection) {
    console.log('🔍 DEBUG RETORNO - Props essenciais:', {
      isReturnSelection,
      departureDateTime: departureDateTime?.toLocaleString(),
      hasValidDepartureDateTime: !!departureDateTime
    });
  }

  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Usar currentMonth se fornecido, senão data atual
    const initialDate = currentMonth || new Date();
    return initialDate;
  });

  // Atualizar currentWeek quando currentMonth mudar
  useEffect(() => {
    if (currentMonth) {
      setCurrentWeek(currentMonth);
    }
  }, [currentMonth]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [suggestedTimes, setSuggestedTimes] = useState<Date[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const lastFetchedWeek = useRef<string>('');
  
  // Estado para horário de destino secundário
  const [secondaryTime, setSecondaryTime] = useState<string>('');
  
  // Estado para controlar se pode selecionar retorno
  const [canSelectReturn, setCanSelectReturn] = useState<boolean>(true);

  // Atualizar currentWeek quando currentMonth mudar
  useEffect(() => {
    if (currentMonth) {
      setCurrentWeek(currentMonth);
    }
  }, [currentMonth]);
  
  // Callback para atualizar horário secundário
  const handleSecondaryTimeChange = (time: string) => {
    setSecondaryTime(time);
    if (onSecondaryTimeUpdate) {
      onSecondaryTimeUpdate(time);
    }
  };

  // Controlar se pode selecionar retorno baseado no preenchimento do horário secundário
  useEffect(() => {
    if (hasSecondaryDestinationActive && isReturnSelection) {
      // Se tem destino secundário e é seleção de retorno, precisa preencher o horário secundário primeiro
      setCanSelectReturn(secondaryTime !== '');
    } else {
      // Caso contrário, sempre pode selecionar
      setCanSelectReturn(true);
    }
  }, [hasSecondaryDestinationActive, isReturnSelection, secondaryTime]);

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

  // Carregar bookings para validação
  useEffect(() => {
    const fetchBookings = async () => {
      if (!selectedAircraft) return;
      
      try {
        // Buscar bookings reais da API
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(buildApiUrl(`/api/bookings/aircraft/${selectedAircraft.id}`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          
          if (response.ok) {
            const bookingsData = await response.json();
            
            // Validar e limpar os dados dos bookings
            const bookingsValidos = bookingsData.filter((booking: any) => {
              // Verificar se tem pelo menos as datas básicas
              const temDadosBasicos = booking.departure_date && booking.return_date;
              
              if (!temDadosBasicos) {
                return false;
              }
              
              // Se não tem horários, usar horários padrão
              if (!booking.departure_time) {
                booking.departure_time = '00:00';
              }
              if (!booking.return_time) {
                booking.return_time = '23:59';
              }
              
              // Testar se as datas são válidas
              const departureTest = new Date(`${booking.departure_date}T${booking.departure_time}`);
              const returnTest = new Date(`${booking.return_date}T${booking.return_time}`);
              
              if (isNaN(departureTest.getTime()) || isNaN(returnTest.getTime())) {
                return false;
              }
              
              return true;
            });
            
            setBookings(bookingsValidos);
          } else {
            setBookings([]);
          }
        } catch (error) {
          console.error('Erro na requisição da API:', error);
          setBookings([]);
        }
      } catch (error) {
        console.error('Erro ao carregar bookings:', error);
      }
    };

    fetchBookings();
  }, [selectedAircraft?.id]); // Mudança: depende apenas do ID da aeronave

  // Buscar slots de tempo do backend
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedAircraft) return;

      // Verificar se já buscamos para esta semana
      const weekKey = currentWeek.toDateString();
      if (lastFetchedWeek.current === weekKey) {
        return;
      }

      try {
        setLoadingSlots(true);
        // Usar apenas o dia atual para a API
        const dayStart = new Date(currentWeek);
        dayStart.setHours(0, 0, 0, 0); // Início do dia atual
        
        // Converter para timezone brasileiro antes de enviar para o backend
        const dayStartBrazilian = convertWeekStartToBrazilianTimezone(dayStart);
        
        // Estimar duração da missão (padrão 2 horas se não especificado)
        const estimatedMissionDuration = 2; // horas
        
        const slots = await getTimeSlots(
          selectedAircraft.id, 
          dayStartBrazilian,
          undefined,
          undefined,
          estimatedMissionDuration,
          true // singleDay = true para mostrar apenas o dia atual
        );
        
        // Verificar se temos slots para todas as 24 horas
        const hoursWithSlots = new Set();
        slots.forEach(slot => {
          const start = new Date(slot.start);
          hoursWithSlots.add(start.getHours());
        });

        
        // Converter e NORMALIZAR a data dos slots para o dia exibido (currentWeek)
        const convertedSlots = slots.map(slot => {
          const originalStart = new Date(slot.start);
          if (isNaN(originalStart.getTime())) {
            console.warn('Slot com data inválida:', slot);
            return null;
          }

          // Extrair HH:mm do slot devolvido pela API
          const hours = originalStart.getHours();
          const minutes = originalStart.getMinutes();

          // Fixar a data para currentWeek (dia exibido no calendário)
          const baseDate = new Date(currentWeek);
          const start = new Date(baseDate);
          start.setHours(hours, minutes, 0, 0);

          // Fim do slot: +29 minutos
          const end = new Date(start.getTime() + 29 * 60 * 1000);

          // Normalizar nextAvailable (se existir) para o mesmo dia exibido, mantendo HH:mm
          let nextAvailable: Date | undefined = undefined;
          if (slot.nextAvailable) {
            const na = new Date(slot.nextAvailable);
            if (!isNaN(na.getTime())) {
              const naNorm = new Date(baseDate);
              naNorm.setHours(na.getHours(), na.getMinutes(), 0, 0);
              nextAvailable = naNorm;
            }
          }

          return {
            ...slot,
            start,
            end,
            nextAvailable
          };
        }).filter(Boolean); // Remover slots inválidos
        
        setTimeSlots(convertedSlots);
        
        // Auto-scroll para a posição mais útil após carregar os slots
        setTimeout(() => {
          autoScrollToBestPosition();
        }, 300);
        
        // Marcar que já buscamos para esta semana
        lastFetchedWeek.current = weekKey;
        
      } catch (error) {
        console.error('Erro ao buscar slots de tempo:', error);
        toast.error('Erro ao carregar calendário');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [selectedAircraft?.id, currentWeek]);

  // Navegar entre dias
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 1 : -1));
  };

  // Função para auto-scroll para a melhor posição
  const autoScrollToBestPosition = () => {
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    
    // Calcular o slot atual (hora * 2 + minuto >= 30)
    const currentSlotIndex = (currentHour * 2) + (currentMinute >= 30 ? 1 : 0);
    
    // Se for muito cedo (antes das 6h), ir para 6h
    const targetSlotIndex = currentHour < 6 ? 12 : currentSlotIndex;
    
    
    // Tentar encontrar o slot exato primeiro
    let slotElement = document.querySelector(`[data-slot-index="${targetSlotIndex}"]`);
    
    if (slotElement) {
      slotElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      return;
    }
    
    // Se não encontrar, tentar slots próximos
    for (let offset = 1; offset <= 5; offset++) {
      // Tentar slot anterior
      const prevSlot = targetSlotIndex - offset;
      if (prevSlot >= 0) {
        slotElement = document.querySelector(`[data-slot-index="${prevSlot}"]`);
        if (slotElement) {
          slotElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          return;
        }
      }
      
      // Tentar slot posterior
      const nextSlot = targetSlotIndex + offset;
      if (nextSlot <= 47) { // Máximo 23:30
        slotElement = document.querySelector(`[data-slot-index="${nextSlot}"]`);
        if (slotElement) {
          slotElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          return;
        }
      }
    }
    
  };

  // Função para navegar para uma data específica
  const goToDate = (date: Date) => {
    setCurrentWeek(date);
    // O auto-scroll será executado automaticamente pelo useEffect
  };


  // Lidar com clique em slot
  const handleSlotClick = (slot: TimeSlot) => {
    console.log('🎯 CLIQUE NO SLOT:', {
      time: slot.start.toLocaleTimeString(),
      status: slot.status,
      isReturnSelection,
      hasSecondaryDestinationActive,
      canSelectReturn,
      departureDateTime: departureDateTime?.toLocaleTimeString()
    });
    
    // Verificar se o slot tem datas válidas
    if (!(slot.start instanceof Date) || isNaN(slot.start.getTime())) {
      console.error('Slot com data inválida:', slot);
      toast.error('Erro: data inválida no slot');
      return;
    }

    // Normalizar a data do slot para o dia atualmente exibido (currentWeek), preservando HH:mm
    // Corrige casos em que o backend/envio trouxe a data do dia anterior por timezone
    try {
      if (currentWeek instanceof Date && slot.start instanceof Date) {
        const normalizedStart = new Date(currentWeek);
        normalizedStart.setHours(slot.start.getHours(), slot.start.getMinutes(), 0, 0);
        const normalizedEnd = new Date(normalizedStart.getTime() + 29 * 60 * 1000);
        // Substituir start/end do slot para garantir o dia correto
        slot = { ...slot, start: normalizedStart, end: normalizedEnd };
      }
    } catch {}

    // VALIDAÇÃO OBRIGATÓRIA: Se é seleção de retorno com destino secundário, precisa preencher horário secundário primeiro
    if (isReturnSelection && hasSecondaryDestinationActive && !canSelectReturn) {
      console.log('🚫 BLOQUEADO: Horário secundário não preenchido');
      toast.error('⚠️ Preencha primeiro o horário de ida para o destino secundário antes de selecionar o retorno!');
      return;
    }

    // VALIDAÇÃO: Impedir seleção de slots que estão dentro do período da missão
    if (timeline && isSlotInMissionPeriod(slot)) {
      const periodType = getMissionPeriodType(slot);
      let message = 'Horário indisponível - missão em andamento';
      
      switch (periodType) {
        case 'base-to-primary':
          message = '🛫 Horário indisponível - voo Base → Principal em andamento';
          break;
        case 'primary-to-secondary':
          message = '🛫 Horário indisponível - voo Principal → Secundário em andamento';
          break;
        case 'secondary-to-base':
          message = '🛫 Horário indisponível - voo Secundário → Base em andamento';
          break;
      }
      
      toast.error(message);
      return;
    }

    // VALIDAÇÃO: Impedir seleção de retorno que conflite com o voo de ida (preview)
    // REMOVIDO: Agora permitimos seleção para mostrar missão completa
    // if (isReturnSelection && missionPreview && isSlotInPreviewPeriod(slot)) {
    //   console.log('🚫 BLOQUEADO: Conflito com voo de ida');
    //   toast.error(`🛫 Horário indisponível - voo de ida para ${missionPreview.destination} em andamento (${Math.round(missionPreview.flightTimeMinutes)}min)`);
    //   return;
    // }

    // BLOQUEAR SLOTS COM STATUS "blocked" - PÓS-VOO, PRÉ-VOO, ETC
    if (slot.status === 'blocked') {
      console.log('🚫 BLOQUEADO: Slot com status blocked', slot.blockType);
      let message = 'Horário indisponível';
      
      if (slot.blockType === 'pos-voo') {
        message = '⛔ Pós-voo em andamento - 3h de encerramento';
      } else if (slot.blockType === 'pre-voo') {
        message = '⛔ Pré-voo em andamento - 3h de preparação';
      } else if (slot.blockType === 'missao') {
        message = '⛔ Missão em andamento';
      }
      
      toast.error(message);
      return; // BLOQUEAR COMPLETAMENTE
    }

    // BLOQUEAR SLOTS COM STATUS "booked"
    if (slot.status === 'booked') {
      console.log('🚫 BLOQUEADO: Slot já reservado');
      // Buscar próximos horários disponíveis (respeitando 3 horas)
      const slotsDisponiveis = timeSlots.filter(s => s.status === 'available');
      const proximosHorarios = [];
      
      // Encontrar slots que estão pelo menos 3 horas após o slot reservado
      for (const slot of slotsDisponiveis) {
        const horarioMinimo = new Date(slot.start.getTime() - (3 * 60 * 60 * 1000));
        
        if (horarioMinimo >= slot.end) { // slot.end é o fim do slot reservado
          proximosHorarios.push(slot.start);
          if (proximosHorarios.length >= 3) break;
        }
      }
      
      // Se não encontrou sugestões adequadas, buscar próximos disponíveis
      if (proximosHorarios.length === 0) {
        const proximosDisponiveis = slotsDisponiveis.slice(0, 3).map(s => s.start);
        proximosHorarios.push(...proximosDisponiveis);
      }
      
      const mensagem = `⛔ Horário já reservado! 💡 Sugestões: ${proximosHorarios.map(h => h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })).join(', ')}`;
      toast.error(mensagem);
      return; // BLOQUEAR COMPLETAMENTE
    }

    // Validar se o horário de retorno é posterior ao horário de partida (APENAS NO MESMO DIA)
    if (departureDateTime && slot.start <= departureDateTime) {
      // Verificar se é o mesmo dia
      const slotDate = slot.start.toDateString();
      const departureDate = departureDateTime.toDateString();
      
      // Só bloquear se for o MESMO DIA e horário anterior
      if (slotDate === departureDate) {
        const departureTimeStr = departureDateTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        toast.error(`❌ Horário inválido! Você partiu às ${departureTimeStr} e está tentando voltar às ${slot.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} no mesmo dia. Selecione um horário após a partida.`);
        return;
      }
    }

    // VALIDAÇÃO DE ATROPELAMENTO: Verificar se há missões no caminho entre partida e retorno
    if (isReturnSelection && departureDateTime && slot.status === 'available') {
      
      
      // Verificar se há slots bloqueados ou reservados entre a partida e o retorno selecionado
      const missionStart = departureDateTime;
      const missionEnd = slot.start;
      
      
      
      // Procurar por slots que indicam missões existentes no período
      const conflictingSlots = timeSlots.filter(existingSlot => {
        // Verificar se o slot está no período da missão proposta
        const slotInPeriod = (
          existingSlot.start >= missionStart && existingSlot.start <= missionEnd
        );
        
        // Verificar se o slot indica uma missão existente
        const isExistingMission = (
          existingSlot.status === 'booked' || 
          (existingSlot.status === 'blocked' && existingSlot.blockType === 'missao')
        );
        
        if (slotInPeriod && isExistingMission) {

        }
        
        return slotInPeriod && isExistingMission;
      });
      

      
      if (conflictingSlots.length > 0) {

        // Buscar próximos horários disponíveis após o conflito (respeitando 3 horas)
        const slotsDisponiveis = timeSlots.filter(s => s.status === 'available');
        const proximosHorarios = [];
        
        // Encontrar slots que estão pelo menos 3 horas após o fim do conflito
        for (const slot of slotsDisponiveis) {
          const horarioMinimo = new Date(slot.start.getTime() - (3 * 60 * 60 * 1000));
          const conflitoTermina = conflictingSlots[0].end; // Assumindo que há pelo menos um conflito
          
          if (horarioMinimo >= conflitoTermina) {
            proximosHorarios.push(slot.start);
            if (proximosHorarios.length >= 3) break;
          }
        }
        
        // Se não encontrou sugestões adequadas, buscar próximos disponíveis
        if (proximosHorarios.length === 0) {
          const proximosDisponiveis = slotsDisponiveis.slice(0, 3).map(s => s.start);
          proximosHorarios.push(...proximosDisponiveis);
        }
        
        const mensagem = `⛔ Conflito de horário! Já existe missão neste período. 💡 Sugestões: ${proximosHorarios.map(h => h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })).join(', ')}`;
        toast.error(mensagem);

        return; // BLOQUEAR seleção
      } else {

      }
    }

    // VALIDAÇÃO ESPECÍFICA PARA RETORNO - Verificar 3 horas ANTES do pré-voo
    if (isReturnSelection && slot.status === 'available') {
      
      
      // Encontrar o próximo pré-voo (slot bloqueado com blockType 'pre-voo')
      const proximoPreVoo = timeSlots.find(existingSlot => {
        return existingSlot.status === 'blocked' && 
               existingSlot.blockType === 'pre-voo' && 
               existingSlot.start > slot.start;
      });
      
      
      
      if (proximoPreVoo) {
        // Calcular se há 3 horas livres antes do pré-voo
        const preVooInicio = proximoPreVoo.start;
        const tresHorasAntes = new Date(preVooInicio.getTime() - (3 * 60 * 60 * 1000));
        
        
        
        // Verificar se o retorno selecionado está DENTRO do período de 3h antes do pré-voo (deve bloquear)
        if (slot.start >= tresHorasAntes && slot.start < preVooInicio) {
          
          // Sugerir horário após o pré-voo
          const proximoHorario = new Date(proximoPreVoo.end.getTime() + (3 * 60 * 60 * 1000));
          const sugestao = proximoHorario.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          // Buscar horários disponíveis que respeitam a regra das 3 horas após o pré-voo
          const horarioMinimoAposPreVoo = new Date(proximoPreVoo.end.getTime() + (3 * 60 * 60 * 1000));
          const slotsDisponiveis = timeSlots.filter(s => s.status === 'available' && s.start >= horarioMinimoAposPreVoo);
          const horariosSugeridos = slotsDisponiveis.slice(0, 3).map(s => s.start);
          
          // Se não encontrou sugestões adequadas, buscar próximos disponíveis
          let sugestoesFinais = horariosSugeridos;
          if (sugestoesFinais.length === 0) {
            const proximosDisponiveis = timeSlots.filter(s => s.status === 'available' && s.start > proximoPreVoo.end);
            sugestoesFinais = proximosDisponiveis.slice(0, 3).map(s => s.start);
          }
          
          const mensagem = `⛔ Tempo insuficiente! Precisa de 3h livres antes do pré-voo. 💡 Sugestões: ${sugestoesFinais.map(h => h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })).join(', ')}`;
          toast.error(mensagem);
          setValidationMessage(`💡 Próximo horário disponível após o pré-voo`);
          setSuggestedTimes([proximoHorario]);
          
          return; // BLOQUEAR seleção
        }
      }
    }
    
    // VALIDAÇÃO DAS 3 HORAS ANTES - Verificar se há 3h livres antes do slot (para partida)
    if (!isReturnSelection && slot.status === 'available') {
      const preInicio = new Date(slot.start.getTime() - (3 * 60 * 60 * 1000)); // 3 horas antes
      const preFim = slot.start;
      
      // Verificar se o período de 3h antes sobrepõe com algum slot bloqueado
      // Encontrar TODOS os conflitos e pegar o que termina mais tarde
      const conflitos = timeSlots.filter(existingSlot => {
        if (existingSlot.status === 'blocked' || existingSlot.status === 'booked') {
          // Verificar sobreposição entre o período de 3h antes e o slot bloqueado
          const sobrepoe = preInicio < existingSlot.end && existingSlot.start < preFim;
          
          
          return sobrepoe;
        }
        return false;
      });
      
      // Pegar o conflito que termina mais tarde (o mais problemático)
      const slotConflitante = conflitos.length > 0 ? 
        conflitos.reduce((maior, atual) => atual.end > maior.end ? atual : maior) : 
        null;
      
      if (slotConflitante) {
        // Calcular horário mínimo necessário (3 horas após o fim do conflito)
        const horarioMinimo = new Date(slotConflitante.end.getTime() + (3 * 60 * 60 * 1000));
        
        
        // Buscar slots disponíveis que respeitam a regra das 3 horas
        const slotsDisponiveis = timeSlots.filter(s => s.status === 'available');
        const horariosSugeridos = [];
        
        // Encontrar slots que estão pelo menos 3 horas após o fim do conflito
        for (const slot of slotsDisponiveis) {
          if (slot.start >= horarioMinimo) {
            horariosSugeridos.push(slot.start);
            if (horariosSugeridos.length >= 3) break; // Limitar a 3 sugestões
          }
        }
        
        
        // Se não encontrou sugestões adequadas, buscar próximos disponíveis
        if (horariosSugeridos.length === 0) {
          for (const slot of slotsDisponiveis) {
            if (slot.start > slotConflitante.end) {
              horariosSugeridos.push(slot.start);
              if (horariosSugeridos.length >= 3) break;
            }
          }
        }
        
        const mensagem = `⛔ Tempo insuficiente! Precisa de 3h livres antes do voo. 💡 Sugestões: ${horariosSugeridos.map(h => h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })).join(', ')}`;
        toast.error(mensagem);
        
        setValidationMessage(`💡 Horários sugeridos: ${horariosSugeridos.map(h => h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })).join(', ')}`);
        setSuggestedTimes(horariosSugeridos);
        
        return; // BLOQUEAR seleção
      }
    }

    // Se chegou até aqui, o slot é válido
    console.log('✅ SLOT SELECIONADO COM SUCESSO:', slot.start.toLocaleTimeString());
    setSelectedSlot(slot);
    setValidationMessage(null);
    setSuggestedTimes([]);
    
    // Comportamento simples - sempre o mesmo
    onTimeSelect(slot);
    
    // AUTO-AVANÇO: Apenas para seleção de RETORNO (não para partida)
    // TEMPORARIAMENTE DESABILITADO para debug
    // if (isReturnSelection && onAutoAdvance) {
    //   setTimeout(() => {
    //     onAutoAdvance();
    //   }, 500);
    // }
  };

  // Obter cor do slot baseado no status
  const getSlotColor = (slot: TimeSlot) => {
    // Verificar se o slot está selecionado
    if (selectedSlot && selectedSlot.start.getTime() === slot.start.getTime()) {
      return 'bg-blue-500 border-blue-600 text-white cursor-pointer ring-2 ring-blue-300';
    }
    
    // DESTACAR HORÁRIO DE PARTIDA: Mostrar o horário de partida selecionado anteriormente
    if (isReturnSelection && departureDateTime && slot.start.getTime() === departureDateTime.getTime()) {
      return 'bg-green-500 border-green-600 text-white cursor-pointer ring-2 ring-green-300';
    }
    
    // MARCAR SLOTS DA MISSÃO: Mostrar visualmente os horários que serão ocupados pela missão
    if (timeline && isSlotInMissionPeriod(slot)) {
      const periodType = getMissionPeriodType(slot);
      switch (periodType) {
        case 'base-to-primary':
          return 'bg-blue-200 border-blue-400 cursor-not-allowed';
        case 'primary-to-secondary':
          return 'bg-yellow-200 border-yellow-400 cursor-not-allowed';
        case 'secondary-to-base':
          return 'bg-orange-200 border-orange-400 cursor-not-allowed';
        default:
          return 'bg-purple-200 border-purple-400 cursor-not-allowed';
      }
    }
    
    // MARCAR HORÁRIO DE DECOLAGEM SECUNDÁRIA: Quando o usuário digita o horário no campo (PRIORIDADE ALTA)
    if (hasSecondaryDestinationActive && secondaryTime) {
      const [hours, minutes] = secondaryTime.split(':').map(Number);
      
      // Verificar se este slot corresponde ao horário digitado
      if (slot.start.getHours() === hours && slot.start.getMinutes() === minutes) {
        return 'bg-purple-300 border-purple-500 cursor-not-allowed';
      }
    }

    // MARCAR HORÁRIO DE POUSO NO DESTINO SECUNDÁRIO: Quando o avião chega no destino secundário (PRIORIDADE ALTA)
    if (hasSecondaryDestinationActive && secondaryTime && selectedDestinations?.secondary) {
      const [departureHours, departureMinutes] = secondaryTime.split(':').map(Number);
      const secondaryDepartureTime = new Date(slot.start);
      secondaryDepartureTime.setHours(departureHours, departureMinutes, 0, 0);
      
      // Calcular tempo de voo para destino secundário
      const secondaryDistance = getDistanceBetweenAirports(selectedDestinations.primary, selectedDestinations.secondary);
      const aircraftSpeed = getAircraftSpeed(selectedAircraft);
      const secondaryFlightTimeMinutes = (secondaryDistance / aircraftSpeed) * 60;
      
      // Calcular horário de pouso no destino secundário
      const secondaryLandingTime = new Date(secondaryDepartureTime.getTime() + secondaryFlightTimeMinutes * 60 * 1000);
      
      // Verificar se este slot corresponde ao horário de pouso secundário (ou é o slot mais próximo)
      const slotTime = slot.start.getTime();
      const landingTimeMs = secondaryLandingTime.getTime();
      const timeDiff = Math.abs(slotTime - landingTimeMs);
      
      // Se o slot está dentro de 15 minutos do pouso secundário, marcar como pouso
      if (timeDiff <= 15 * 60 * 1000) { // 15 minutos em milissegundos
        console.log('🎯 Marcando slot de pouso secundário:', slot.start.toLocaleTimeString(), 'Pouso real:', secondaryLandingTime.toLocaleTimeString());
        return 'bg-orange-300 border-orange-500 cursor-not-allowed';
      }
    }

    // MARCAR HORÁRIO DE POUSO NO DESTINO PRINCIPAL: Quando o avião chega no destino principal (PRIORIDADE ALTA)
    if (missionPreview && departureDateTime) {
      const landingTime = new Date(departureDateTime.getTime() + missionPreview.flightTimeMinutes * 60 * 1000);
      
      // Verificar se este slot corresponde ao horário de pouso (ou é o slot mais próximo)
      const slotTime = slot.start.getTime();
      const landingTimeMs = landingTime.getTime();
      const timeDiff = Math.abs(slotTime - landingTimeMs);
      
      // Se o slot está dentro de 15 minutos do pouso, marcar como pouso
      if (timeDiff <= 15 * 60 * 1000) { // 15 minutos em milissegundos
        return 'bg-cyan-300 border-cyan-500 cursor-not-allowed';
      }
    }

    // MARCAR SLOTS DE PREVIEW: Mostrar visualmente os horários que serão ocupados pelo voo de ida
    if (isSlotInPreviewPeriod(slot)) {
      console.log('🎯 Marcando slot de preview:', slot.start.toLocaleTimeString());
      // Se for seleção de retorno, marcar como missão completa
      if (isReturnSelection) {
        return 'bg-gray-300 border-gray-500 cursor-not-allowed';
      }
      return 'bg-gray-300 border-gray-500 cursor-not-allowed';
    }

    // VALIDAÇÃO: Se não pode selecionar retorno (horário secundário não preenchido)
    if (isReturnSelection && hasSecondaryDestinationActive && !canSelectReturn && slot.status === 'available') {
      return 'bg-gray-200 border-gray-400 cursor-not-allowed opacity-50';
    }
    
    // VALIDAÇÃO CRÍTICA: Verificar se o horário é anterior à partida (para retorno)
    // Só marcar vermelho se for o MESMO DIA e horário anterior
    if (isReturnSelection && departureDateTime && slot.start <= departureDateTime) {
      // Verificar se é o mesmo dia
      const slotDate = slot.start.toDateString();
      const departureDate = departureDateTime.toDateString();
      
      if (slotDate === departureDate) {
        return 'bg-red-200 border-red-400 cursor-not-allowed';
      }
    }

    // NÃO BLOQUEAR VISUALMENTE - O pré-voo vai ocupar as 3h antes
    // Apenas validar no clique se há 3h livres

    switch (slot.status) {
      case 'available':
        return 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer';
      case 'booked':
        return 'bg-gray-200 border-gray-400 cursor-not-allowed';
      case 'blocked':
        // Diferenciar entre tipos de bloqueio
        switch (slot.blockType) {
          case 'pre-voo':
            return 'bg-yellow-100 border-yellow-300 cursor-not-allowed';
          case 'pos-voo':
            return 'bg-orange-100 border-orange-300 cursor-not-allowed';
          default:
            return 'bg-red-100 border-red-300 cursor-not-allowed';
        }
      case 'invalid':
        return 'bg-red-200 border-red-400 cursor-not-allowed';
      case 'selected':
        return 'bg-blue-500 border-blue-600 text-white cursor-pointer';
      case 'conflict':
        return 'bg-red-500 border-red-600 text-white cursor-not-allowed';
      default:
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
    
    // DESTACAR HORÁRIO DE PARTIDA: Mostrar ícone especial para o horário de partida
    if (slot && isReturnSelection && departureDateTime && slot.start.getTime() === departureDateTime.getTime()) {
      return <Plane className="h-4 w-4 text-white" />;
    }
    
    // MARCAR SLOTS DA MISSÃO: Mostrar ícones específicos para cada período
    if (slot && timeline && isSlotInMissionPeriod(slot)) {
      const periodType = getMissionPeriodType(slot);
      switch (periodType) {
        case 'base-to-primary':
          return <Plane className="h-4 w-4 text-blue-600" />;
        case 'primary-to-secondary':
          return <Plane className="h-4 w-4 text-yellow-600" />;
        case 'secondary-to-base':
          return <Plane className="h-4 w-4 text-orange-600" />;
        default:
          return <Plane className="h-4 w-4 text-purple-600" />;
      }
    }
    
    // MARCAR HORÁRIO DE DECOLAGEM SECUNDÁRIA: Ícone para decolagem secundária (PRIORIDADE ALTA)
    if (hasSecondaryDestinationActive && secondaryTime) {
      const [hours, minutes] = secondaryTime.split(':').map(Number);
      
      // Verificar se este slot corresponde ao horário digitado
      if (slot.start.getHours() === hours && slot.start.getMinutes() === minutes) {
        console.log('🎯 Ícone de decolagem secundária:', slot.start.toLocaleTimeString());
        return <Plane className="h-4 w-4 text-purple-600" />;
      }
    }

    // MARCAR HORÁRIO DE POUSO NO DESTINO SECUNDÁRIO: Ícone para pouso secundário (PRIORIDADE ALTA)
    if (hasSecondaryDestinationActive && secondaryTime && selectedDestinations?.secondary) {
      const [departureHours, departureMinutes] = secondaryTime.split(':').map(Number);
      const secondaryDepartureTime = new Date(slot.start);
      secondaryDepartureTime.setHours(departureHours, departureMinutes, 0, 0);
      
      // Calcular tempo de voo para destino secundário
      const secondaryDistance = getDistanceBetweenAirports(selectedDestinations.primary, selectedDestinations.secondary);
      const aircraftSpeed = getAircraftSpeed(selectedAircraft);
      const secondaryFlightTimeMinutes = (secondaryDistance / aircraftSpeed) * 60;
      
      // Calcular horário de pouso no destino secundário
      const secondaryLandingTime = new Date(secondaryDepartureTime.getTime() + secondaryFlightTimeMinutes * 60 * 1000);
      
      // Verificar se este slot corresponde ao horário de pouso secundário (ou é o slot mais próximo)
      const slotTime = slot.start.getTime();
      const landingTimeMs = secondaryLandingTime.getTime();
      const timeDiff = Math.abs(slotTime - landingTimeMs);
      
      // Se o slot está dentro de 15 minutos do pouso secundário, marcar como pouso
      if (timeDiff <= 15 * 60 * 1000) { // 15 minutos em milissegundos
        console.log('🎯 Ícone de pouso secundário:', slot.start.toLocaleTimeString(), 'Pouso real:', secondaryLandingTime.toLocaleTimeString());
        return <Plane className="h-4 w-4 text-orange-600" />;
      }
    }

    // MARCAR HORÁRIO DE POUSO NO DESTINO PRINCIPAL: Ícone para pouso principal (PRIORIDADE ALTA)
    if (missionPreview && departureDateTime) {
      const landingTime = new Date(departureDateTime.getTime() + missionPreview.flightTimeMinutes * 60 * 1000);
      
      // Verificar se este slot corresponde ao horário de pouso (ou é o slot mais próximo)
      const slotTime = slot.start.getTime();
      const landingTimeMs = landingTime.getTime();
      const timeDiff = Math.abs(slotTime - landingTimeMs);
      
      // Se o slot está dentro de 15 minutos do pouso, marcar como pouso
      if (timeDiff <= 15 * 60 * 1000) { // 15 minutos em milissegundos
        console.log('🎯 Ícone de pouso principal:', slot.start.toLocaleTimeString(), 'Pouso real:', landingTime.toLocaleTimeString());
        return <Plane className="h-4 w-4 text-cyan-600" />;
      }
    }

    // MARCAR SLOTS DE PREVIEW: Mostrar ícone para voo de ida
    if (slot && isSlotInPreviewPeriod(slot)) {
      // Se for seleção de retorno, mostrar ícone de missão completa
      if (isReturnSelection) {
        return <Plane className="h-4 w-4 text-gray-600" />;
      }
      return <Plane className="h-4 w-4 text-gray-600" />;
    }
    
    // VALIDAÇÃO CRÍTICA: Verificar se o horário é anterior à partida (para retorno)
    // Só marcar vermelho se for o MESMO DIA e horário anterior
    if (slot && isReturnSelection && departureDateTime && slot.start <= departureDateTime) {
      // Verificar se é o mesmo dia
      const slotDate = slot.start.toDateString();
      const departureDate = departureDateTime.toDateString();
      
      if (slotDate === departureDate) {
        return <XCircle className="h-4 w-4 text-red-700" />;
      }
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

  // Limpar validação
  const clearValidation = () => {
    setSelectedSlot(null);
    setValidationMessage(null);
    setSuggestedTimes([]);
  };

  // Função para obter velocidade da aeronave baseada no modelo
  const getAircraftSpeed = (aircraft: Aircraft | undefined) => {
    if (!aircraft) return 250; // Velocidade padrão
    
    // Velocidades baseadas no modelo da aeronave (km/h)
    const speeds: { [key: string]: number } = {
      'Cessna 172': 200,
      'Cessna 182': 220,
      'Piper PA-28': 210,
      'Beechcraft Bonanza': 280,
      'Cirrus SR22': 300,
      'Diamond DA40': 250,
      'Mooney M20': 270,
      'Cessna 206': 200,
      'Piper Seneca': 250,
      'Beechcraft Baron': 300
    };
    
    return speeds[aircraft.model] || 250; // Velocidade padrão se modelo não encontrado
  };

  // Função para calcular distância entre aeroportos (simplificado - você pode integrar com API real)
  const getDistanceBetweenAirports = (from: string, to: string) => {
    // Distâncias aproximadas de Araçatuba para outros aeroportos (km)
    const distances: { [key: string]: number } = {
      'Araçatuba': 0,
      'Bauru': 120,
      'São Paulo': 450,
      'Rio de Janeiro': 800,
      'Brasília': 600,
      'Belo Horizonte': 700,
      'Salvador': 1200,
      'Recife': 1500,
      'Fortaleza': 1800,
      'Manaus': 2000,
      'Porto Alegre': 1000,
      'Curitiba': 650,
      'Goiânia': 550,
      'Campinas': 400,
      'Santos': 420,
      'Ribeirão Preto': 300,
      'São José dos Campos': 380,
      'Sorocaba': 350,
      'Jundiaí': 360,
      'Guarulhos': 440,
      'Congonhas': 450,
      // Códigos IATA
      'SBGR': 450, // Guarulhos
      'SBSP': 450, // Congonhas
      'SBNT': 180, // Natal (exemplo - ajustar conforme necessário)
      'SBMT': 200, // Mato Grosso (exemplo - ajustar conforme necessário)
      'SBRJ': 800, // Rio de Janeiro
      'SBBR': 600, // Brasília
      'SBGL': 800, // Galeão
      'SBKP': 400, // Campinas
      'SBCF': 700, // Confins
      'SBSV': 1200, // Salvador
      'SBRF': 1500, // Recife
      'SBFZ': 1800, // Fortaleza
      'SBEG': 2000, // Manaus
      'SBPA': 1000, // Porto Alegre
      'SBCT': 650, // Curitiba
      'SBGO': 550, // Goiânia
      'SBSJ': 380, // São José dos Campos
      'SBYS': 350, // Sorocaba
      'SBJV': 360, // Jundiaí
      'SBCG': 420, // Santos
      'SBRP': 300  // Ribeirão Preto
    };
    
    const key = `${from}-${to}`;
    return distances[to] || 300; // Distância padrão se não encontrada
  };

  // Função para calcular tempos de voo baseado em distância e velocidade da aeronave
  const calculateFlightTimes = (departureTime: Date, route: 'base-to-primary' | 'primary-to-secondary' | 'secondary-to-base', fromAirport?: string, toAirport?: string) => {
    let distance: number;
    
    if (fromAirport && toAirport) {
      // Usar distância real entre aeroportos
      distance = getDistanceBetweenAirports(fromAirport, toAirport);
      console.log(`🛫 Cálculo de voo: ${fromAirport} → ${toAirport} = ${distance}km`);
    } else {
      // Usar distâncias padrão
      const distances = {
        'base-to-primary': 300,
        'primary-to-secondary': 200,  
        'secondary-to-base': 400
      };
      distance = distances[route];
      console.log(`🛫 Cálculo padrão: ${route} = ${distance}km`);
    }
    
    // Velocidade da aeronave selecionada
    const aircraftSpeed = getAircraftSpeed(selectedAircraft);
    const flightTimeMinutes = (distance / aircraftSpeed) * 60; // Converter para minutos
    
    console.log(`✈️ Voo calculado: ${distance}km ÷ ${aircraftSpeed}km/h = ${flightTimeMinutes}min (${Math.round(flightTimeMinutes/60)}h${flightTimeMinutes%60}min)`);
    
    return {
      distance,
      flightTimeMinutes,
      arrivalTime: new Date(departureTime.getTime() + flightTimeMinutes * 60 * 1000),
      aircraftSpeed
    };
  };

  // Função para calcular timeline visual quando retorno é selecionado
  const calculateTimeline = () => {
    if (!selectedSlot || !departureDateTime || !hasSecondaryDestinationActive || !secondaryTime) {
      return null;
    }

    // Validar se secondaryTime está no formato correto (HH:mm)
    if (!/^\d{2}:\d{2}$/.test(secondaryTime)) {
      return null;
    }

    try {
      // Calcular tempos de voo reais
      const baseToPrimary = departureDateTime;
      const baseToPrimaryFlight = calculateFlightTimes(baseToPrimary, 'base-to-primary');
      
      // Criar data para primaryToSecondary com validação
      const primaryToSecondary = new Date(`${selectedSlot.start.toDateString()}T${secondaryTime}`);
      
      // Validar se a data foi criada corretamente
      if (isNaN(primaryToSecondary.getTime())) {
        return null;
      }
      
      const primaryToSecondaryFlight = calculateFlightTimes(primaryToSecondary, 'primary-to-secondary');
      
      const secondaryToBase = selectedSlot.start;
      const secondaryToBaseFlight = calculateFlightTimes(secondaryToBase, 'secondary-to-base');

      return {
        baseToPrimary,
        baseToPrimaryArrival: baseToPrimaryFlight.arrivalTime,
        primaryToSecondary,
        primaryToSecondaryArrival: primaryToSecondaryFlight.arrivalTime,
        secondaryToBase,
        secondaryToBaseArrival: secondaryToBaseFlight.arrivalTime,
        totalFlightTime: baseToPrimaryFlight.flightTimeMinutes + primaryToSecondaryFlight.flightTimeMinutes + secondaryToBaseFlight.flightTimeMinutes
      };
    } catch (error) {
      console.error('Erro ao calcular timeline:', error);
      return null;
    }
  };

  const timeline = calculateTimeline();

  // Função para calcular preview da missão baseado apenas no destino (sem horário selecionado)
  const calculateMissionPreview = () => {
    // Usar selectedDestinations.primary se selectedAirport não estiver disponível
    const destination = selectedAirport || selectedDestinations?.primary;
    
    if (!destination || !selectedAircraft) return null;
    
    // Calcular tempo de voo de Araçatuba para o destino selecionado
    const baseToDestination = calculateFlightTimes(
      new Date(), // Usar data atual como referência
      'base-to-primary',
      'Araçatuba',
      destination
    );
    
    const preview = {
      destination: destination,
      distance: baseToDestination.distance,
      flightTimeMinutes: baseToDestination.flightTimeMinutes,
      aircraftSpeed: baseToDestination.aircraftSpeed,
      aircraftModel: selectedAircraft.model
    };
    
    // Debug para verificar se está sendo calculado
    console.log('🛫 Mission Preview calculado:', preview);
    
    return preview;
  };

  const missionPreview = calculateMissionPreview();

  // Debug para verificar mudanças no selectedDestinations
  useEffect(() => {
    console.log('🔄 selectedDestinations mudou:', selectedDestinations);
    console.log('🔄 selectedAirport:', selectedAirport);
    console.log('🔄 missionPreview recalculado:', missionPreview);
  }, [selectedDestinations, selectedAirport, missionPreview]);

  // Função para verificar se um slot está no período de preview da missão
  const isSlotInPreviewPeriod = (slot: TimeSlot) => {
    if (!slot?.start) return false;
    
    try {
      const slotTime = slot.start;
      
      // Se for seleção de retorno, usar departureDateTime como início da missão
      if (isReturnSelection && selectedSlot && departureDateTime) {
        const missionStart = departureDateTime; // Horário de partida
        const missionEnd = selectedSlot.start; // Horário de retorno selecionado
        
        // Obter as datas (sem horário) para comparação
        const slotDate = new Date(slotTime.getFullYear(), slotTime.getMonth(), slotTime.getDate());
        const startDate = new Date(missionStart.getFullYear(), missionStart.getMonth(), missionStart.getDate());
        const endDate = new Date(missionEnd.getFullYear(), missionEnd.getMonth(), missionEnd.getDate());
        
        let isInMission = false;
        
        // Se a missão é no mesmo dia (partida e retorno no mesmo dia)
        if (startDate.getTime() === endDate.getTime()) {
          // Verificar se o slot está no mesmo dia da missão
          if (slotDate.getTime() === startDate.getTime()) {
            // Verificar se o horário do slot está entre partida e retorno
            isInMission = slotTime >= missionStart && slotTime <= missionEnd;
          }
        }
        // Se a missão atravessa dias (partida em um dia, retorno no dia seguinte ou posterior)
        else if (endDate.getTime() > startDate.getTime()) {
          // Se o slot está no dia da partida
          if (slotDate.getTime() === startDate.getTime()) {
            // Slots a partir do horário de partida até o final do dia (23:59)
            isInMission = slotTime >= missionStart;
          }
          // Se o slot está no dia do retorno
          else if (slotDate.getTime() === endDate.getTime()) {
            // Slots desde o início do dia (00:00) até o horário de retorno
            isInMission = slotTime <= missionEnd;
          }
          // Se o slot está em um dia entre a partida e o retorno
          else if (slotDate.getTime() > startDate.getTime() && slotDate.getTime() < endDate.getTime()) {
            // Todos os slots do dia estão na missão (dia inteiro ocupado)
            isInMission = true;
          }
        }
        
        return isInMission;
      }
      
      // Para seleção de partida, só funciona se tiver missionPreview
      if (!missionPreview) return false;
      
      // Para seleção de partida, usar horário de partida selecionado ou departureDateTime
      const flightStart = selectedSlot?.start || departureDateTime;
      if (!flightStart) return false;
      
      // Calcular período de voo baseado no horário de partida
      const flightEnd = new Date(flightStart.getTime() + missionPreview.flightTimeMinutes * 60 * 1000);
      
      // Verificar se o slot está no período de voo
      return slotTime >= flightStart && slotTime <= flightEnd;
    } catch (error) {
      console.error('Erro ao verificar período de preview:', error);
      return false;
    }
  };

  // Função para verificar se um slot está dentro do período da missão
  const isSlotInMissionPeriod = (slot: TimeSlot) => {
    if (!timeline || !slot?.start) return false;
    
    try {
      const slotTime = slot.start;
      
      // Verificar se o slot está em qualquer período de voo
      const isInBaseToPrimary = slotTime >= timeline.baseToPrimary && slotTime <= timeline.baseToPrimaryArrival;
      const isInPrimaryToSecondary = slotTime >= timeline.primaryToSecondary && slotTime <= timeline.primaryToSecondaryArrival;
      const isInSecondaryToBase = slotTime >= timeline.secondaryToBase && slotTime <= timeline.secondaryToBaseArrival;
      
      return isInBaseToPrimary || isInPrimaryToSecondary || isInSecondaryToBase;
    } catch (error) {
      console.error('Erro ao verificar período da missão:', error);
      return false;
    }
  };

  // Função para obter o tipo de período da missão
  const getMissionPeriodType = (slot: TimeSlot) => {
    if (!timeline || !slot?.start) return null;
    
    try {
      const slotTime = slot.start;
      
      if (slotTime >= timeline.baseToPrimary && slotTime <= timeline.baseToPrimaryArrival) {
        return 'base-to-primary';
      }
      if (slotTime >= timeline.primaryToSecondary && slotTime <= timeline.primaryToSecondaryArrival) {
        return 'primary-to-secondary';
      }
      if (slotTime >= timeline.secondaryToBase && slotTime <= timeline.secondaryToBaseArrival) {
        return 'secondary-to-base';
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter tipo de período da missão:', error);
      return null;
    }
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
       <div className="space-y-1 md:space-y-2">
                 {/* Cabeçalho */}
         <div className="flex items-center justify-between">
           <div className="flex-1 min-w-0">
             <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
               {title}
             </h2>
             <p className="text-xs md:text-sm text-gray-600">
               Data selecionada: {selectedDate}/{currentMonth.getFullYear()}
             </p>
           </div>
           <div className="flex space-x-1">
             {(selectedSlot || validationMessage) && (
               <Button 
                 type="button"
                 variant="outline" 
                 size="sm" 
                 onClick={clearValidation}
                 className="text-xs"
               >
                 Limpar
               </Button>
             )}
             <Button type="button" variant="outline" size="sm" onClick={onBack} className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
               <ArrowLeft className="h-4 w-4" />
               <span className="hidden sm:inline">Voltar</span>
             </Button>
           </div>
         </div>

                 {/* Horário de Partida Selecionado - Aparece quando é seleção de retorno */}
                 {isReturnSelection && departureDateTime && (
                   <Card className="mb-1 md:mb-2 border-green-200 bg-green-50">
                     <CardContent className="p-1 md:p-2">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           <Plane className="h-4 w-4 text-green-600" />
                           <span className="text-sm font-medium text-green-800">
                             ✈️ Horário de Partida Selecionado:
                           </span>
                         </div>
                         <Badge variant="default" className="bg-green-600 text-white">
                           {format(departureDateTime, 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
                         </Badge>
                       </div>
                       <div className="text-xs text-green-700 mt-1">
                         Agora selecione o horário de retorno à base
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {/* Missão Simples */}
                 {!hasSecondaryDestinationActive && !isReturnSelection && !missionPreview && (
                   <Card className="mb-1 md:mb-2 border-green-200 bg-green-50">
                     <CardContent className="p-1 md:p-2">
                       <div className="flex items-center space-x-2">
                         <CheckCircle className="h-4 w-4 text-green-600" />
                         <span className="text-sm font-medium text-green-800">
                           Selecione o horário de partida da Base
                         </span>
                       </div>
                       <div className="text-xs text-green-700 mt-1">
                         O sistema calculará automaticamente os horários de chegada e retorno
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {/* Debug Info - Removido para produção */}

                 {/* Validação Simples - Removida para simplicidade */}

                 {/* Horário Selecionado */}
                 {selectedSlot && (
                   <Card className="mb-1 md:mb-2 border-blue-200 bg-blue-50">
                     <CardContent className="p-1 md:p-2">
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

                 {/* Timeline Completa - Aparece quando retorno é selecionado com destino secundário */}
                 {timeline && (
                   <Card className="mb-1 md:mb-2 border-green-200 bg-green-50">
                     <CardContent className="p-1 md:p-2">
                       <div className="space-y-2">
                         <div className="flex items-center space-x-2">
                           <Plane className="h-4 w-4 text-green-600" />
                           <span className="text-sm font-medium text-green-800">
                             ✅ Timeline Completa da Missão
                           </span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                           <div className="bg-blue-100 p-2 rounded border border-blue-200">
                             <div className="font-medium text-blue-800">1️⃣ Base → Principal</div>
                             <div className="text-blue-600">
                               {timeline.baseToPrimary && timeline.baseToPrimaryArrival && 
                                 !isNaN(timeline.baseToPrimary.getTime()) && !isNaN(timeline.baseToPrimaryArrival.getTime()) ? (
                                 <>
                                   {format(timeline.baseToPrimary, 'HH:mm')} - {format(timeline.baseToPrimaryArrival, 'HH:mm')}
                                 </>
                               ) : (
                                 'Calculando...'
                               )}
                             </div>
                             <div className="text-blue-500 text-xs">
                               {timeline.baseToPrimary && timeline.baseToPrimaryArrival && 
                                 !isNaN(timeline.baseToPrimary.getTime()) && !isNaN(timeline.baseToPrimaryArrival.getTime()) ? (
                                 `${Math.round((timeline.baseToPrimaryArrival.getTime() - timeline.baseToPrimary.getTime()) / (1000 * 60))}min`
                               ) : (
                                 '...'
                               )}
                             </div>
                           </div>
                           <div className="bg-yellow-100 p-2 rounded border border-yellow-200">
                             <div className="font-medium text-yellow-800">2️⃣ Principal → Secundário</div>
                             <div className="text-yellow-600">
                               {timeline.primaryToSecondary && timeline.primaryToSecondaryArrival && 
                                 !isNaN(timeline.primaryToSecondary.getTime()) && !isNaN(timeline.primaryToSecondaryArrival.getTime()) ? (
                                 <>
                                   {format(timeline.primaryToSecondary, 'HH:mm')} - {format(timeline.primaryToSecondaryArrival, 'HH:mm')}
                                 </>
                               ) : (
                                 'Calculando...'
                               )}
                             </div>
                             <div className="text-yellow-500 text-xs">
                               {timeline.primaryToSecondary && timeline.primaryToSecondaryArrival && 
                                 !isNaN(timeline.primaryToSecondary.getTime()) && !isNaN(timeline.primaryToSecondaryArrival.getTime()) ? (
                                 `${Math.round((timeline.primaryToSecondaryArrival.getTime() - timeline.primaryToSecondary.getTime()) / (1000 * 60))}min`
                               ) : (
                                 '...'
                               )}
                             </div>
                           </div>
                           <div className="bg-green-100 p-2 rounded border border-green-200">
                             <div className="font-medium text-green-800">3️⃣ Secundário → Base</div>
                             <div className="text-green-600">
                               {timeline.secondaryToBase && timeline.secondaryToBaseArrival && 
                                 !isNaN(timeline.secondaryToBase.getTime()) && !isNaN(timeline.secondaryToBaseArrival.getTime()) ? (
                                 <>
                                   {format(timeline.secondaryToBase, 'HH:mm')} - {format(timeline.secondaryToBaseArrival, 'HH:mm')}
                                 </>
                               ) : (
                                 'Calculando...'
                               )}
                             </div>
                             <div className="text-green-500 text-xs">
                               {timeline.secondaryToBase && timeline.secondaryToBaseArrival && 
                                 !isNaN(timeline.secondaryToBase.getTime()) && !isNaN(timeline.secondaryToBaseArrival.getTime()) ? (
                                 `${Math.round((timeline.secondaryToBaseArrival.getTime() - timeline.secondaryToBase.getTime()) / (1000 * 60))}min`
                               ) : (
                                 '...'
                               )}
                             </div>
                           </div>
                         </div>
                         <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                           ⏱️ <strong>Duração Total da Missão:</strong> {
                             timeline.totalFlightTime && !isNaN(timeline.totalFlightTime) ? (
                               `${Math.round(timeline.totalFlightTime)} minutos (${Math.round(timeline.totalFlightTime / 60)}h ${timeline.totalFlightTime % 60}min)`
                             ) : (
                               'Calculando...'
                             )
                           }
                         </div>
                         <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                           🎯 <strong>Missão Completa:</strong> {selectedDestinations?.primary} → {selectedDestinations?.secondary} → Base
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 )}



                 {/* Seletor de Aeronave */}
         {onAircraftSelect && (
           <Card>
             <CardContent className="p-1 md:p-2">
               <div className="mb-1 md:mb-2">
                 <label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">
                   Aeronave:
                 </label>
                 <div className="flex flex-wrap gap-0.5 md:gap-1">
                   {aircrafts.map(aircraft => (
                     <Button
                       key={aircraft.id}
                       variant={selectedAircraft?.id === aircraft.id ? "default" : "outline"}
                       size="sm"
                       onClick={() => onAircraftSelect(aircraft)}
                       disabled={aircraft.status !== 'available'}
                       className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm min-w-0"
                     >
                       <Plane className="h-3 w-3 md:h-4 md:w-4" />
                       <span className="truncate max-w-[80px] md:max-w-none">{aircraft.registration}</span>
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
                         <CardHeader className="p-1 md:p-2">
               <CardTitle className="flex items-center space-x-1 md:space-x-2 text-sm md:text-base">
                 <Calendar className="h-4 w-4 md:h-5 md:w-5 text-sky-600" />
                 <span className="truncate">
                   Horários Disponíveis - {selectedAircraft.registration}
                 </span>
               </CardTitle>
             </CardHeader>
                         <CardContent className="p-1 md:p-2">
                             {/* Legenda */}
                             <div className="mb-1 md:mb-2 p-1 md:p-2 bg-gray-50 rounded-lg">
                               <h4 className="text-sm font-medium text-gray-700 mb-2">Legenda e Validação Inteligente:</h4>
                               <div className="space-y-3">
                                 <div className="grid grid-cols-2 md:grid-cols-10 gap-2 text-xs">
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                                     <span>Disponível</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-green-500 border border-green-600 rounded"></div>
                                     <span>Partida Selecionada</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-cyan-300 border border-cyan-500 rounded"></div>
                                     <span>Pouso Principal</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-purple-300 border border-purple-500 rounded"></div>
                                     <span>Decolagem Secundária</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-orange-300 border border-orange-500 rounded"></div>
                                     <span>Pouso Secundário</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-gray-300 border border-gray-500 rounded"></div>
                                     <span>Missão Completa</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
                                     <span>Base → Principal</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
                                     <span>Principal → Secundário</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-orange-200 border border-orange-400 rounded"></div>
                                     <span>Secundário → Base</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
                                     <span>Bloqueado</span>
                                   </div>
                                 </div>
                                 
                                 <div className="border-t pt-2">
                                   <div className="space-y-1 text-xs text-gray-600">
                                     <div className="flex items-center space-x-1">
                                       <CheckCircle className="h-3 w-3 text-green-600" />
                                       <span><strong>✅ Disponível:</strong> Pode agendar (3h livres antes)</span>
                                     </div>
                                     <div className="flex items-center space-x-1">
                                       <XCircle className="h-3 w-3 text-red-600" />
                                       <span><strong>⛔ Indisponível:</strong> Não clicável (precisa de 3h)</span>
                                     </div>
                                     <div className="flex items-center space-x-1">
                                       <Clock className="h-3 w-3 text-blue-600" />
                                       <span><strong>💡 Sugestões:</strong> Sistema recomenda próximos horários</span>
                                     </div>
                                     <div className="flex items-center space-x-1">
                                       <AlertTriangle className="h-3 w-3 text-orange-600" />
                                       <span><strong>🚫 Missões no Caminho:</strong> Validação impede atropelamento</span>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             </div>
                             
                             {/* Navegação do Dia */}
               <div className="flex items-center justify-between mb-1 md:mb-2">
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => navigateWeek('prev')}
                   className="text-xs md:text-sm"
                 >
                   <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                   <span className="hidden sm:inline">Dia Anterior</span>
                   <span className="sm:hidden">Anterior</span>
                 </Button>
                 
                 <div className="text-center flex-1 mx-2">
                   <h3 className="text-sm md:text-lg font-semibold">
                     {format(currentWeek, 'dd/MM/yyyy', { locale: ptBR })}
                   </h3>
                   <p className="text-xs md:text-sm text-gray-600">
                     {format(currentWeek, 'EEEE', { locale: ptBR })} - {format(currentWeek, 'MMMM yyyy', { locale: ptBR })}
                   </p>
                 </div>

                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => navigateWeek('next')}
                   className="text-xs md:text-sm"
                 >
                   <span className="hidden sm:inline">Próximo Dia</span>
                   <span className="sm:hidden">Próxima</span>
                   <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                 </Button>
               </div>

               {/* Navegação Rápida - Seletor de Data */}
               <div className="flex justify-center mb-1 md:mb-2">
                 <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg">
                   <Calendar className="h-4 w-4 text-gray-600" />
                   <span className="text-sm text-gray-700 font-medium">Ir para data:</span>
                   <input
                     type="date"
                     value={format(currentWeek, 'yyyy-MM-dd')}
                     onChange={(e) => {
                       // Corrigir problema de timezone - criar data local
                       const [year, month, day] = e.target.value.split('-').map(Number);
                       const selectedDate = new Date(year, month - 1, day); // month é 0-indexed
                       setCurrentWeek(selectedDate);
                     }}
                     className="text-sm px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                     min={format(new Date(), 'yyyy-MM-dd')}
                     title="Selecione uma data para navegar rapidamente"
                   />
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       const today = new Date();
                       setCurrentWeek(today);
                     }}
                     className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                     title="Voltar para hoje"
                   >
                     Hoje
                   </Button>
                 </div>
               </div>

               {/* CAMPO OBRIGATÓRIO DE HORÁRIO SECUNDÁRIO - LOGO ABAIXO DO "IR PARA DATA" */}
               {hasSecondaryDestinationActive && (
                 <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded">
                   <h4 className="text-xs font-bold text-red-800 mb-1 flex items-center">
                     ⚠️ Horário de Decolagem para Segundo Destino
                     <span className="ml-1 bg-red-600 text-white px-1 py-0.5 rounded text-xs">OBRIGATÓRIO</span>
                   </h4>
                   
                   <div className="space-y-2">
                     <Label htmlFor="secondaryDeptTime" className="text-xs text-red-800">
                       {selectedDestinations?.primary || 'SBSP'} → {selectedDestinations?.secondary || 'SBGR'}
                     </Label>
                     <Input
                       id="secondaryDeptTime"
                       type="time"
                       value={secondaryTime}
                       onChange={(e) => handleSecondaryTimeChange(e.target.value)}
                       className="h-8 text-sm border-red-300 focus:border-red-500 bg-white"
                       placeholder="--:--"
                     />
                     
                     {!secondaryTime ? (
                       <div className="bg-red-200 border border-red-400 p-1 rounded text-xs text-red-800">
                         🚫 Preencha para continuar
                       </div>
                     ) : (
                       <div className="bg-green-100 border border-green-400 p-1 rounded text-xs text-green-800">
                         ✅ Horário: {secondaryTime}
                       </div>
                     )}
                   </div>
                 </div>
               )}

                             {/* Grade de Horários */}

               <div className="overflow-x-auto">
                 {/* Desktop e Mobile: Layout unificado */}
                 <div className="space-y-3">
                   <div className="border rounded-lg p-1 md:p-2">
                     <div className="text-center mb-1 md:mb-2">
                       <div className="font-medium text-gray-900">
                         {format(currentWeek, 'EEEE', { locale: ptBR })}
                       </div>
                       <div className="text-sm text-gray-600">
                         {format(currentWeek, 'dd/MM/yyyy', { locale: ptBR })}
                       </div>
                     </div>
                         
                         <div className="grid grid-cols-4 sm:grid-cols-6 gap-0.5 sm:gap-1">
                           {Array.from({ length: 48 }, (_, slotIndex) => {
                             const hour = Math.floor(slotIndex / 2);
                             const minute = (slotIndex % 2) * 30;
                             const slot = timeSlots.find(s => 
                               s.start.getHours() === hour && s.start.getMinutes() === minute
                             );
                             
                             if (!slot) return <div key={slotIndex} className="h-8"></div>;
                             
                             return (
                               <Tooltip key={slotIndex}>
                                 <TooltipTrigger asChild>
                                   <div
                                     data-slot-index={slotIndex}
                                     className={`h-12 sm:h-14 md:h-16 border rounded flex items-center justify-center transition-colors ${getSlotColor(slot)} ${
                                       slot.status === 'available' ? 'cursor-pointer' : 'cursor-not-allowed'
                                     }`}
                                     onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       // SEMPRE chamar handleSlotClick - a validação será feita lá
                                       handleSlotClick(slot);
                                     }}
                                   >
                                     <div className="flex flex-col items-center justify-center h-full p-0 md:p-0.5">
                                       {/* Ícone do slot */}
                                       <div className="mb-1">
                                         {getSlotIcon(slot.status, slot)}
                                       </div>
                                       <div className="text-xs font-semibold leading-tight">
                                         {format(slot.start, 'HH:mm')}
                                       </div>
                                       <div className="text-xs text-gray-500 leading-tight hidden sm:block">
                                         {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                                       </div>
                                     </div>
                                   </div>
                                 </TooltipTrigger>
                                 <TooltipContent side="top" className="max-w-xs">
                                   <div className="space-y-1">
                                     {/* Intervalo de tempo - Padrão 04:00 - 04:29 */}
                                     <div className="text-xs text-gray-500 border-b pb-1 mb-1">
                                       <strong>Horário:</strong> {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                                     </div>
                                     
                                     <div className="text-sm">
                                       {isReturnSelection && departureDateTime && slot.start.getTime() === departureDateTime.getTime() ? (
                                         <span className="text-green-600">✈️ Horário de Partida Selecionado</span>
                                       ) : timeline && isSlotInMissionPeriod(slot) ? (
                                         (() => {
                                           const periodType = getMissionPeriodType(slot);
                                           switch (periodType) {
                                             case 'base-to-primary':
                                               return <span className="text-blue-600">🛫 Base → Principal (em voo)</span>;
                                             case 'primary-to-secondary':
                                               return <span className="text-yellow-600">🛫 Principal → Secundário (em voo)</span>;
                                             case 'secondary-to-base':
                                               return <span className="text-orange-600">🛫 Secundário → Base (em voo)</span>;
                                             default:
                                               return <span className="text-purple-600">🛫 Missão em andamento</span>;
                                           }
                                         })()
                                       ) : missionPreview && departureDateTime && !isReturnSelection && slot.start.getHours() === new Date(departureDateTime.getTime() + missionPreview.flightTimeMinutes * 60 * 1000).getHours() && slot.start.getMinutes() === new Date(departureDateTime.getTime() + missionPreview.flightTimeMinutes * 60 * 1000).getMinutes() ? (
                                         <span className="text-cyan-600">🛬 Pouso no destino principal</span>
                                       ) : hasSecondaryDestinationActive && secondaryTime && selectedDestinations?.secondary && (() => {
                                         const [departureHours, departureMinutes] = secondaryTime.split(':').map(Number);
                                         const secondaryDepartureTime = new Date(slot.start);
                                         secondaryDepartureTime.setHours(departureHours, departureMinutes, 0, 0);
                                         const secondaryDistance = getDistanceBetweenAirports(selectedDestinations.primary, selectedDestinations.secondary);
                                         const aircraftSpeed = getAircraftSpeed(selectedAircraft);
                                         const secondaryFlightTimeMinutes = (secondaryDistance / aircraftSpeed) * 60;
                                         const secondaryLandingTime = new Date(secondaryDepartureTime.getTime() + secondaryFlightTimeMinutes * 60 * 1000);
                                         const slotTime = slot.start.getTime();
                                         const landingTimeMs = secondaryLandingTime.getTime();
                                         const timeDiff = Math.abs(slotTime - landingTimeMs);
                                         return timeDiff <= 15 * 60 * 1000;
                                       })() ? (
                                         <span className="text-orange-600">🛬 Pouso no destino secundário</span>
                                       ) : hasSecondaryDestinationActive && secondaryTime && slot.start.getHours() === parseInt(secondaryTime.split(':')[0]) && slot.start.getMinutes() === parseInt(secondaryTime.split(':')[1]) ? (
                                         <span className="text-purple-600">🛫 Decolagem para destino secundário</span>
                                       ) : isSlotInPreviewPeriod(slot) ? (
                                         isReturnSelection ? (
                                           <span className="text-gray-600">🛫 Missão completa: Araçatuba → {missionPreview?.destination || 'Destino'} → Araçatuba</span>
                                         ) : missionPreview ? (
                                           <span className="text-gray-600">🛫 Araçatuba → {missionPreview.destination} (preview)</span>
                                         ) : (
                                           <span className="text-gray-600">🛫 Preview da missão</span>
                                         )
                                       ) : isReturnSelection && hasSecondaryDestinationActive && !canSelectReturn && slot.status === 'available' ? (
                                         <span className="text-red-600">🚫 Preencha horário secundário primeiro</span>
                                       ) : isReturnSelection && departureDateTime && slot.start <= departureDateTime && slot.start.toDateString() === departureDateTime.toDateString() ? (
                                         <span className="text-red-600">❌ Antes da partida</span>
                                       ) : slot.status === 'available' ? (
                                         <span className="text-green-600">✅ Disponível</span>
                                       ) : slot.status === 'blocked' ? (
                                         <span className="text-yellow-600">{slot.reason}</span>
                                       ) : (
                                         <span className="text-red-600">{slot.reason}</span>
                                       )}
                                     </div>
                                     
                                     {isSlotInPreviewPeriod(slot) && (
                                       <div className={`text-xs ${isReturnSelection ? 'text-gray-600' : 'text-gray-600'}`}>
                                         {isReturnSelection ? (
                                           <span className="text-gray-600">🛫 Missão completa</span>
                                         ) : missionPreview ? (
                                           <>🛫 Preview: {missionPreview.flightTimeMinutes}min de voo para {missionPreview.destination}</>
                                         ) : (
                                           <span className="text-gray-600">🛫 Preview da missão</span>
                                         )}
                                       </div>
                                     )}
                                     {isReturnSelection && departureDateTime && slot.start.getTime() === departureDateTime.getTime() && (
                                       <div className="text-xs text-green-600">
                                         🎯 Este é o horário de partida que você selecionou anteriormente
                                       </div>
                                     )}
                                     {isReturnSelection && hasSecondaryDestinationActive && !canSelectReturn && slot.status === 'available' && (
                                       <div className="text-xs text-red-600">
                                         ⚠️ Preencha o horário de ida para o destino secundário primeiro
                                       </div>
                                     )}
                                     {isReturnSelection && departureDateTime && slot.start <= departureDateTime && slot.start.toDateString() === departureDateTime.toDateString() && slot.start.getTime() !== departureDateTime.getTime() && (
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
                   </div>
                 </div>
               </div>
            </CardContent>
          </Card>
        )}

                 {/* Legenda */}
         <Card>
           <CardContent className="p-1 md:p-2">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center md:justify-center gap-0.5 md:gap-4 text-xs md:text-sm">
               <div className="flex items-center space-x-1 md:space-x-2">
                 <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                 <span>Disponível (30min)</span>
               </div>
               <div className="flex items-center space-x-1 md:space-x-2">
                 <Plane className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                 <span className="hidden sm:inline">Partida Selecionada</span>
                 <span className="sm:hidden">Partida</span>
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
             <CardContent className="p-1 md:p-2">
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
