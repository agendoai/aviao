
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, X, ArrowRight, Clock, Moon, Plane, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getFlightTime, getDistance, calculateArrivalTime, formatFlightTime, airports } from '@/utils/flightCalculations';

interface RouteStop {
  id: string;
  destination: string;
  arrivalTime: string;
  departureTime: string;
  stayDuration: number;
  arrivalDate?: string;
  departureDate?: string;
  flightTimeFromPrevious?: number;
  distanceFromPrevious?: number;
}

interface RouteBuilderProps {
  baseLocation: string;
  onRouteChange: (route: RouteStop[]) => void;
  onCostCalculation: (costs: any) => void;
  onTimingChange?: (timing: { 
    departureFromBase: string; 
    returnToBase: string; 
    returnDate: string;
    flightDate: string;
    hasOvernight: boolean; 
    overnightCount: number; 
    calculatedReturnTime: string; 
    calculatedReturnDate: string;
    desiredReturnTime: string;
    desiredReturnDate: string;
  }) => void;
  selectedAircraftId?: string;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({
  baseLocation = "Araçatuba (ABC)",
  onRouteChange,
  onCostCalculation,
  onTimingChange,
  selectedAircraftId
}) => {
  const { toast } = useToast();
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [newDestination, setNewDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  
  // Estados do calendário e horários
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [flightDate, setFlightDate] = useState('');
  const [departureFromBase, setDepartureFromBase] = useState('08:00');
  
  // Estados para disponibilidade da aeronave
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  useEffect(() => {
    if (selectedAircraftId) {
      fetchOccupiedDates();
    }
  }, [selectedAircraftId]);

  useEffect(() => {
    if (selectedDate && flightDate) {
      calculateTimingAndNotify();
    }
  }, [departureFromBase, flightDate, route, selectedDate]);

  const fetchOccupiedDates = async () => {
    if (!selectedAircraftId) return;
    
    setIsLoadingDates(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('departure_date, return_date')
        .eq('aircraft_id', selectedAircraftId)
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;

      const dates: Date[] = [];
      if (data) {
        data.forEach(booking => {
          const start = new Date(booking.departure_date);
          const end = new Date(booking.return_date);
          
          for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dates.push(new Date(date));
          }
        });
      }
      
      setOccupiedDates(dates);
    } catch (error) {
      console.error('Erro ao buscar datas ocupadas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar disponibilidade da aeronave.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDates(false);
    }
  };

  const isDateOccupied = (date: Date) => {
    return occupiedDates.some(occupiedDate => 
      occupiedDate.toDateString() === date.toDateString()
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (isDateOccupied(date)) {
      toast({
        title: "Data Indisponível",
        description: "Esta data já possui reserva confirmada para a aeronave selecionada.",
        variant: "destructive"
      });
      return;
    }

    if (date < new Date()) {
      toast({
        title: "Data Inválida",
        description: "Não é possível selecionar datas passadas.",
        variant: "destructive"
      });
      return;
    }

    setSelectedDate(date);
    setFlightDate(date.toISOString().split('T')[0]);

    toast({
      title: "Data Selecionada",
      description: `${date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} selecionada com sucesso!`,
    });
  };

  const loadExampleMission = () => {
    // Configurar data para hoje se nenhuma estiver selecionada
    if (!selectedDate) {
      const today = new Date();
      setSelectedDate(today);
      setFlightDate(today.toISOString().split('T')[0]);
    }

    // Configurar horários do exemplo
    setDepartureFromBase('08:00');

    // Configurar escalas do exemplo com cálculos automáticos
    const exampleRoute: RouteStop[] = [];
    
    // Primeira escala: Araçatuba → São Paulo (chegada calculada, saída às 15:00)
    const spFlightTime = getFlightTime(baseLocation, 'São Paulo (GRU)');
    const spArrival = calculateArrivalTime('08:00', spFlightTime, flightDate);
    const spDepartureTime = '15:00';
    const spStayDuration = calculateStayDurationWithDates(spArrival.time, spArrival.date, spDepartureTime, spArrival.date);
    
    exampleRoute.push({
      id: 'example-1',
      destination: 'São Paulo (GRU)',
      arrivalTime: spArrival.time,
      arrivalDate: spArrival.date,
      departureTime: spDepartureTime,
      departureDate: spArrival.date,
      stayDuration: spStayDuration,
      flightTimeFromPrevious: spFlightTime,
      distanceFromPrevious: getDistance(baseLocation, 'São Paulo (GRU)')
    });

    // Segunda escala: São Paulo → Mato Grosso (chegada calculada, saída às 23:00)
    const mgFlightTime = getFlightTime('São Paulo (GRU)', 'Mato Grosso (VGF)');
    const mgArrival = calculateArrivalTime(spDepartureTime, mgFlightTime, spArrival.date);
    const mgDepartureTime = '23:00';
    const mgStayDuration = calculateStayDurationWithDates(mgArrival.time, mgArrival.date, mgDepartureTime, mgArrival.date);
    
    exampleRoute.push({
      id: 'example-2',
      destination: 'Mato Grosso (VGF)',
      arrivalTime: mgArrival.time,
      arrivalDate: mgArrival.date,
      departureTime: mgDepartureTime,
      departureDate: mgArrival.date,
      stayDuration: mgStayDuration,
      flightTimeFromPrevious: mgFlightTime,
      distanceFromPrevious: getDistance('São Paulo (GRU)', 'Mato Grosso (VGF)')
    });

    setRoute(exampleRoute);
    onRouteChange(exampleRoute);
    calculateRouteCosts(exampleRoute);

    toast({
      title: "Exemplo Carregado!",
      description: "Missão configurada: Araçatuba → São Paulo → Mato Grosso → Araçatuba (retorno obrigatório)",
    });
  };

  const calculateReturnTimeToBase = (): { time: string; date: string } => {
    if (route.length === 0) {
      // Se não há escalas, calcular retorno direto de uma viagem simples (ida e volta no mesmo dia)
      const directFlightTime = getFlightTime(baseLocation, baseLocation); // Default flight time
      const returnArrival = calculateArrivalTime(departureFromBase, directFlightTime * 2, flightDate);
      return { 
        time: returnArrival.time, 
        date: returnArrival.date 
      };
    }
    
    // Pegar a última escala
    const lastStop = route[route.length - 1];
    
    // Calcular tempo de voo de volta à base
    const returnFlightTime = getFlightTime(lastStop.destination, baseLocation);
    const returnArrival = calculateArrivalTime(lastStop.departureTime, returnFlightTime, lastStop.departureDate!);
    
    return {
      time: returnArrival.time,
      date: returnArrival.date
    };
  };

  const calculateTimingAndNotify = () => {
    const calculatedReturn = calculateReturnTimeToBase();
    const hasOvernight = checkForOvernight(calculatedReturn.time, calculatedReturn.date);
    const overnightCount = calculateOvernightDays(calculatedReturn.date);
    
    if (onTimingChange) {
      onTimingChange({
        departureFromBase,
        returnToBase: calculatedReturn.time,
        returnDate: calculatedReturn.date,
        flightDate,
        hasOvernight,
        overnightCount,
        calculatedReturnTime: calculatedReturn.time,
        calculatedReturnDate: calculatedReturn.date,
        desiredReturnTime: calculatedReturn.time,
        desiredReturnDate: calculatedReturn.date
      });
    }
  };

  const checkForOvernight = (returnTime?: string, returnDate?: string): boolean => {
    const checkDate = returnDate || calculateReturnTimeToBase().date;
    return checkDate !== flightDate;
  };

  const calculateOvernightDays = (returnDate?: string): number => {
    const checkDate = returnDate || calculateReturnTimeToBase().date;
    
    const departure = new Date(flightDate);
    const returnDay = new Date(checkDate);
    
    const timeDiff = returnDay.getTime() - departure.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  };

  // Função para calcular permanência considerando datas
  const calculateStayDurationWithDates = (arrivalTime: string, arrivalDate: string, departureTime: string, departureDate: string): number => {
    const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}`);
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    
    return (departureDateTime.getTime() - arrivalDateTime.getTime()) / (1000 * 60 * 60);
  };

  const getStayDurationPreview = (): number => {
    if (!newDestination || !departureTime) return 0;
    
    // Determinar ponto de partida (base ou última escala)
    const previousLocation = route.length === 0 ? baseLocation : route[route.length - 1].destination;
    const previousDeparture = route.length === 0 ? departureFromBase : route[route.length - 1].departureTime;
    const previousDate = route.length === 0 ? flightDate : route[route.length - 1].departureDate || flightDate;
    
    // Calcular tempo de voo e chegada
    const flightTime = getFlightTime(previousLocation, newDestination);
    const arrival = calculateArrivalTime(previousDeparture, flightTime, previousDate);
    
    // Assumir saída no mesmo dia da chegada para o preview
    const departureDate = arrival.date;
    
    // Calcular permanência baseada na chegada e saída com datas
    return calculateStayDurationWithDates(arrival.time, arrival.date, departureTime, departureDate);
  };

  const addStop = () => {
    if (!newDestination || !departureTime) return;
    
    // Determinar ponto de partida (base ou última escala)
    const previousLocation = route.length === 0 ? baseLocation : route[route.length - 1].destination;
    const previousDeparture = route.length === 0 ? departureFromBase : route[route.length - 1].departureTime;
    const previousDate = route.length === 0 ? flightDate : route[route.length - 1].departureDate || flightDate;
    
    // Calcular tempo de voo e chegada
    const flightTime = getFlightTime(previousLocation, newDestination);
    const distance = getDistance(previousLocation, newDestination);
    const arrival = calculateArrivalTime(previousDeparture, flightTime, previousDate);
    
    // Assumir saída no mesmo dia da chegada (usuário pode alterar depois se necessário)
    const departureDate = arrival.date;
    
    // Calcular permanência automaticamente
    const stayDuration = calculateStayDurationWithDates(arrival.time, arrival.date, departureTime, departureDate);
    
    const newStop: RouteStop = {
      id: Date.now().toString(),
      destination: newDestination,
      arrivalTime: arrival.time,
      arrivalDate: arrival.date,
      departureTime,
      departureDate,
      stayDuration,
      flightTimeFromPrevious: flightTime,
      distanceFromPrevious: distance
    };

    const updatedRoute = [...route, newStop];
    setRoute(updatedRoute);
    onRouteChange(updatedRoute);
    
    // Reset form
    setNewDestination('');
    setDepartureTime('');
    
    // Calculate costs
    calculateRouteCosts(updatedRoute);

    toast({
      title: "Escala Adicionada",
      description: `${newDestination} - Chegada: ${arrival.date} ${arrival.time}, Saída: ${departureDate} ${departureTime}`,
    });
  };

  const removeStop = (stopId: string) => {
    const updatedRoute = route.filter(stop => stop.id !== stopId);
    setRoute(updatedRoute);
    onRouteChange(updatedRoute);
    calculateRouteCosts(updatedRoute);
  };

  const calculateRouteCosts = (routeStops: RouteStop[]) => {
    const hourlyRate = 5000; // R$ 5.000 por hora de voo
    let totalCost = 0;
    const segments = [];
    const returnCalculation = calculateReturnTimeToBase();
    const overnightCount = calculateOvernightDays(returnCalculation.date);
    const overnightFee = overnightCount * 1500; // R$ 1.500 por pernoite

    // Adicionar segmentos da rota de ida
    let previousLocation = baseLocation;
    
    routeStops.forEach((stop, index) => {
      const flightTime = stop.flightTimeFromPrevious || 2;
      const flightCost = flightTime * hourlyRate;
      const airportFees = 1000; // Taxa de aeroporto fixa
      
      const segmentCost = flightCost + airportFees;
      totalCost += segmentCost;
      
      segments.push({
        from: previousLocation,
        to: stop.destination,
        flightTime,
        flightCost,
        airportFees,
        distance: stop.distanceFromPrevious || 0,
        overnightCost: 0,
        hasOvernight: false,
        total: segmentCost
      });
      
      previousLocation = stop.destination;
    });

    // Adicionar trecho de retorno OBRIGATÓRIO à base
    const returnFlightTime = getFlightTime(previousLocation, baseLocation);
    const returnDistance = getDistance(previousLocation, baseLocation);
    const returnFlightCost = returnFlightTime * hourlyRate;
    const returnAirportFees = 600; // Taxa menor para retorno à base
    const returnSegmentCost = returnFlightCost + returnAirportFees;
    
    totalCost += returnSegmentCost;
    
    segments.push({
      from: previousLocation,
      to: baseLocation,
      flightTime: returnFlightTime,
      flightCost: returnFlightCost,
      airportFees: returnAirportFees,
      distance: returnDistance,
      overnightCost: 0,
      hasOvernight: false,
      total: returnSegmentCost,
      estimatedArrival: returnCalculation.time,
      estimatedArrivalDate: returnCalculation.date,
      isReturnToBase: true // Marcar como retorno obrigatório
    });

    // Adicionar taxa de pernoite ao total
    totalCost += overnightFee;

    onCostCalculation({
      segments,
      totalCost,
      overnightFee,
      overnightCount,
      totalFlightTime: segments.reduce((acc, seg) => acc + seg.flightTime, 0),
      calculatedReturnTime: returnCalculation.time,
      calculatedReturnDate: returnCalculation.date
    });
  };

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Planejamento de Voo com Retorno Obrigatório</span>
          </CardTitle>
          <CardDescription>
            Base: {baseLocation} - Todas as missões devem retornar à base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* EXEMPLO DE MISSÃO */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-green-800">Exemplo: Araçatuba → São Paulo → Mato Grosso</h3>
                <p className="text-sm text-green-700">
                  Saída 08:00, São Paulo 15:00, Mato Grosso 23:00, Retorno obrigatório à base
                </p>
              </div>
              <Button 
                onClick={loadExampleMission}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Carregar Exemplo
              </Button>
            </div>
          </div>
          
          {/* PASSO 1: Seleção de Data */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <h3 className="text-lg font-semibold">Selecione a Data da Missão</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                {selectedAircraftId ? (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-lg border bg-white shadow-sm w-full max-w-none"
                    disabled={(date) => date < new Date() || isDateOccupied(date)}
                    modifiers={{
                      occupied: occupiedDates,
                      available: (date) => !isDateOccupied(date) && date >= new Date()
                    }}
                    modifiersStyles={{
                      occupied: {
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        textDecoration: 'line-through'
                      },
                      available: {
                        backgroundColor: '#dcfce7',
                        color: '#16a34a'
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border">
                    <div className="text-center text-gray-500">
                      <Plane className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">Selecione uma aeronave primeiro</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {selectedDate && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-sm mb-2 text-green-800">Data Selecionada</h4>
                    <p className="text-sm font-medium text-green-700">
                      {selectedDate.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PASSO 2: Configuração de Horários */}
          {selectedDate && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <h3 className="text-lg font-semibold">Horário de Saída da Base</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-6 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="departure-time">Saída de {baseLocation}</Label>
                  <Input
                    id="departure-time"
                    type="time"
                    value={departureFromBase}
                    onChange={(e) => setDepartureFromBase(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-600">Retorno à Base (Calculado)</Label>
                  <Input
                    type="text"
                    value={`${calculateReturnTimeToBase().time} - ${new Date(calculateReturnTimeToBase().date).toLocaleDateString('pt-BR')}`}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              </div>

              {/* Alerta de Pernoite */}
              {checkForOvernight() && (
                <Alert className="border-amber-200 bg-amber-50">
                  <Moon className="h-4 w-4" />
                  <AlertDescription className="text-amber-800">
                    <strong>Pernoite Detectada!</strong> Missão com {calculateOvernightDays()} dia(s) de duração.
                    Taxa adicional: R$ {(calculateOvernightDays() * 1500).toLocaleString('pt-BR')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* PASSO 3: Escalas */}
          {selectedDate && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="text-lg font-semibold">Escalas (Opcional)</h3>
              </div>

              {/* Visualização da rota atual */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Rota Programada:</h4>
                <div className="flex items-center space-x-2 flex-wrap">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {baseLocation} ({selectedDate.toLocaleDateString('pt-BR')} {departureFromBase})
                  </Badge>
                  {route.map((stop, index) => (
                    <React.Fragment key={stop.id}>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <Badge variant="outline" className="relative group">
                        {stop.destination} ({new Date(stop.arrivalDate!).toLocaleDateString('pt-BR')} {stop.arrivalTime} - {stop.departureTime})
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeStop(stop.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    </React.Fragment>
                  ))}
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <Badge variant="outline" className="text-blue-600 border-blue-600 font-bold">
                    {baseLocation} ({new Date(calculateReturnTimeToBase().date).toLocaleDateString('pt-BR')} {calculateReturnTimeToBase().time}) - RETORNO OBRIGATÓRIO
                  </Badge>
                </div>
              </div>

              {/* Formulário para nova escala */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Nova Escala</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destino</Label>
                    <Select value={newDestination} onValueChange={setNewDestination}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {airports.filter(airport => airport.name !== baseLocation).map(airport => (
                          <SelectItem key={airport.code} value={airport.name}>
                            {airport.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="departure">Horário de Saída</Label>
                    <Input
                      id="departure"
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={addStop} 
                      className="w-full"
                      disabled={!newDestination || !departureTime}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Escala
                    </Button>
                  </div>
                </div>

                {/* Preview do cálculo */}
                {newDestination && departureTime && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <h5 className="text-sm font-medium mb-2">Preview:</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        Distância: {getDistance(
                          route.length === 0 ? baseLocation : route[route.length - 1].destination, 
                          newDestination
                        )}km
                      </div>
                      <div>
                        Tempo de voo: {formatFlightTime(getFlightTime(
                          route.length === 0 ? baseLocation : route[route.length - 1].destination, 
                          newDestination
                        ))}
                      </div>
                      <div>
                        Custo estimado: R$ {(getFlightTime(
                          route.length === 0 ? baseLocation : route[route.length - 1].destination, 
                          newDestination
                        ) * 5000 + 1000).toLocaleString('pt-BR')}
                      </div>
                      <div className="font-medium text-blue-600">
                        Permanência: {formatFlightTime(getStayDurationPreview())}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de escalas */}
              {route.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Escalas Confirmadas:</h4>
                  {route.map((stop, index) => (
                    <div key={stop.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <div className="space-y-1">
                          <p className="font-medium">{stop.destination}</p>
                          <div className="text-sm text-gray-600 space-y-0.5">
                            <div>
                              Chegada: {new Date(stop.arrivalDate!).toLocaleDateString('pt-BR')} {stop.arrivalTime} | 
                              Saída: {stop.departureTime}
                            </div>
                            <div>
                              Voo: {formatFlightTime(stop.flightTimeFromPrevious || 0)} | 
                              Distância: {stop.distanceFromPrevious}km | 
                              Custo: R$ {((stop.flightTimeFromPrevious || 0) * 5000 + 1000).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStop(stop.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteBuilder;
