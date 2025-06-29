
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Plus, Trash2, Calculator, Plane, Home } from 'lucide-react';
import { getFlightTime, getDistance, calculateArrivalTime, formatFlightTime, suggestDestinations, airports } from '@/utils/flightCalculations';

interface RouteStop {
  id: string;
  destination: string;
  departureTime: string;
  calculatedArrivalTime: string;
  calculatedArrivalDate: string;
  stayDuration: number;
}

interface CostSegment {
  from: string;
  to: string;
  flightTime: number;
  flightCost: number;
  airportFees: number;
  distance: number;
  overnightCost: number;
  hasOvernight: boolean;
  total: number;
  estimatedArrival?: string;
  estimatedArrivalDate?: string;
  isReturnToBase?: boolean;
}

interface RouteBuilderProps {
  baseLocation: string;
  onRouteChange: (route: RouteStop[]) => void;
  onCostCalculation: (costs: any) => void;
  onTimingChange: (timing: any) => void;
  selectedAircraftId?: string;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({
  baseLocation,
  onRouteChange,
  onCostCalculation,
  onTimingChange,
  selectedAircraftId
}) => {
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [missionDate, setMissionDate] = useState('');
  const [initialDepartureTime, setInitialDepartureTime] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newDepartureTime, setNewDepartureTime] = useState('');

  const calculateRouteTimings = (updatedRoute: RouteStop[], startDate: string, startTime: string) => {
    if (!startDate || !startTime || updatedRoute.length === 0) return updatedRoute;

    let currentDate = startDate;
    let currentTime = startTime;

    return updatedRoute.map((stop, index) => {
      // Calcular tempo de voo para este destino
      const fromLocation = index === 0 ? baseLocation : updatedRoute[index - 1].destination;
      const flightTime = getFlightTime(fromLocation, stop.destination);
      
      // Calcular horário de chegada
      const arrivalData = calculateArrivalTime(currentTime, flightTime, currentDate);
      
      // Atualizar para próxima iteração
      currentTime = stop.departureTime;
      currentDate = arrivalData.date;
      
      return {
        ...stop,
        calculatedArrivalTime: arrivalData.time,
        calculatedArrivalDate: arrivalData.date,
        stayDuration: calculateStayDuration(arrivalData.time, stop.departureTime)
      };
    });
  };

  const calculateStayDuration = (arrivalTime: string, departureTime: string): number => {
    if (!arrivalTime || !departureTime) return 0;
    
    try {
      const arrival = new Date(`2024-01-01T${arrivalTime}`);
      const departure = new Date(`2024-01-01T${departureTime}`);
      
      if (departure < arrival) {
        departure.setDate(departure.getDate() + 1);
      }
      
      const diffMs = departure.getTime() - arrival.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
      
      return diffHours;
    } catch (error) {
      return 0;
    }
  };

  const addStop = () => {
    if (!newDestination || !newDepartureTime || !missionDate || !initialDepartureTime) {
      return;
    }

    const newStop: RouteStop = {
      id: Date.now().toString(),
      destination: newDestination,
      departureTime: newDepartureTime,
      calculatedArrivalTime: '',
      calculatedArrivalDate: '',
      stayDuration: 0
    };

    const updatedRoute = [...route, newStop];
    const routeWithTimings = calculateRouteTimings(updatedRoute, missionDate, initialDepartureTime);
    
    setRoute(routeWithTimings);
    onRouteChange(routeWithTimings);

    setNewDestination('');
    setNewDepartureTime('');
  };

  const removeStop = (id: string) => {
    const updatedRoute = route.filter(stop => stop.id !== id);
    const routeWithTimings = calculateRouteTimings(updatedRoute, missionDate, initialDepartureTime);
    
    setRoute(routeWithTimings);
    onRouteChange(routeWithTimings);
  };

  const calculateCosts = () => {
    if (route.length === 0 || !missionDate || !initialDepartureTime) return;

    const segments: CostSegment[] = [];
    const hourlyRate = 5000;
    const baseAirportFee = 300;
    let totalCost = 0;
    let totalFlightTime = 0;
    let overnightFee = 0;
    let overnightCount = 0;

    // Primeiro trecho: Base → Primeiro destino
    const firstDestination = route[0];
    const firstDistance = getDistance(baseLocation, firstDestination.destination);
    const firstFlightTime = getFlightTime(baseLocation, firstDestination.destination);
    const firstFlightCost = firstFlightTime * hourlyRate;

    segments.push({
      from: baseLocation,
      to: firstDestination.destination,
      flightTime: firstFlightTime,
      flightCost: firstFlightCost,
      airportFees: baseAirportFee,
      distance: firstDistance,
      overnightCost: 0,
      hasOvernight: false,
      total: firstFlightCost + baseAirportFee,
      estimatedArrival: firstDestination.calculatedArrivalTime,
      estimatedArrivalDate: firstDestination.calculatedArrivalDate
    });

    totalCost += firstFlightCost + baseAirportFee;
    totalFlightTime += firstFlightTime;

    // Trechos intermediários
    for (let i = 0; i < route.length - 1; i++) {
      const currentStop = route[i];
      const nextStop = route[i + 1];
      const distance = getDistance(currentStop.destination, nextStop.destination);
      const flightTime = getFlightTime(currentStop.destination, nextStop.destination);
      const flightCost = flightTime * hourlyRate;

      // Verificar pernoite baseado na diferença de datas
      let hasOvernight = false;
      let segmentOvernightCost = 0;

      if (nextStop.calculatedArrivalDate !== currentStop.calculatedArrivalDate) {
        hasOvernight = true;
        segmentOvernightCost = 1500;
        overnightFee += segmentOvernightCost;
        overnightCount++;
      }

      segments.push({
        from: currentStop.destination,
        to: nextStop.destination,
        flightTime,
        flightCost,
        airportFees: baseAirportFee,
        distance,
        overnightCost: segmentOvernightCost,
        hasOvernight,
        total: flightCost + baseAirportFee + segmentOvernightCost,
        estimatedArrival: nextStop.calculatedArrivalTime,
        estimatedArrivalDate: nextStop.calculatedArrivalDate
      });

      totalCost += flightCost + baseAirportFee + segmentOvernightCost;
      totalFlightTime += flightTime;
    }

    // Último trecho: Último destino → Base
    const lastDestination = route[route.length - 1];
    const returnDistance = getDistance(lastDestination.destination, baseLocation);
    const returnFlightTime = getFlightTime(lastDestination.destination, baseLocation);
    const returnFlightCost = returnFlightTime * hourlyRate;

    const returnArrival = calculateArrivalTime(lastDestination.departureTime, returnFlightTime, missionDate);

    segments.push({
      from: lastDestination.destination,
      to: baseLocation,
      flightTime: returnFlightTime,
      flightCost: returnFlightCost,
      airportFees: baseAirportFee,
      distance: returnDistance,
      overnightCost: 0,
      hasOvernight: false,
      total: returnFlightCost + baseAirportFee,
      estimatedArrival: returnArrival.time,
      estimatedArrivalDate: returnArrival.date,
      isReturnToBase: true
    });

    totalCost += returnFlightCost + baseAirportFee;
    totalFlightTime += returnFlightTime;

    const costData = {
      segments,
      totalCost,
      totalFlightTime,
      overnightFee,
      overnightCount
    };

    const timingData = {
      calculatedReturnTime: returnArrival.time,
      calculatedReturnDate: returnArrival.date,
      totalFlightTime,
      segments: segments.length
    };

    onCostCalculation(costData);
    onTimingChange(timingData);
  };

  useEffect(() => {
    if (route.length > 0 && missionDate && initialDepartureTime) {
      const routeWithTimings = calculateRouteTimings(route, missionDate, initialDepartureTime);
      setRoute(routeWithTimings);
      calculateCosts();
    }
  }, [missionDate, initialDepartureTime]);

  useEffect(() => {
    if (route.length > 0) {
      calculateCosts();
    }
  }, [route]);

  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Construtor de Rotas</span>
        </CardTitle>
        <CardDescription>
          Defina sua missão com data e horários de partida. Os horários de chegada são calculados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Home className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Base de Origem</span>
          </div>
          <p className="text-lg font-bold text-blue-600">{baseLocation}</p>
          <p className="text-sm text-blue-600">Ponto de partida e retorno obrigatório</p>
        </div>

        {/* Configuração da Missão */}
        <div className="space-y-4">
          <h4 className="font-medium">Configuração da Missão:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mission-date">Data da Missão</Label>
              <Input
                id="mission-date"
                type="date"
                value={missionDate}
                onChange={(e) => setMissionDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label htmlFor="initial-departure">Horário de Saída da Base</Label>
              <Input
                id="initial-departure"
                type="time"
                value={initialDepartureTime}
                onChange={(e) => setInitialDepartureTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        {route.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Rota Planejada:</h4>
            {route.map((stop, index) => (
              <div key={stop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <p className="font-medium">{stop.destination}</p>
                    <p className="text-sm text-gray-600">
                      Chegada: {stop.calculatedArrivalTime} ({new Date(stop.calculatedArrivalDate).toLocaleDateString('pt-BR')})
                    </p>
                    <p className="text-sm text-gray-600">
                      Saída: {stop.departureTime}
                    </p>
                    <p className="text-xs text-gray-500">
                      Permanência: {formatFlightTime(stop.stayDuration)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeStop(stop.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Adicionar Nova Escala:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                placeholder="Ex: São Paulo (GRU)"
                list="cities"
              />
              <datalist id="cities">
                {airports.map(airport => (
                  <option key={airport.code} value={`${airport.city} (${airport.code})`} />
                ))}
              </datalist>
            </div>
            
            <div>
              <Label htmlFor="departure">Horário de Saída</Label>
              <Input
                id="departure"
                type="time"
                value={newDepartureTime}
                onChange={(e) => setNewDepartureTime(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={addStop} 
            className="w-full"
            disabled={!missionDate || !initialDepartureTime}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Escala
          </Button>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h5 className="font-medium text-amber-800 mb-2">💡 Exemplo de Missão Completa:</h5>
          <div className="text-sm text-amber-700 space-y-1">
            <p><strong>Data:</strong> 15/01/2024</p>
            <p><strong>08:00</strong> - Saída de Araçatuba → São Paulo (chegada calculada: 09:30)</p>
            <p><strong>15:00</strong> - Saída de São Paulo → Mato Grosso (chegada calculada: 17:12)</p>
            <p><strong>23:00</strong> - Saída de Mato Grosso → Araçatuba (chegada calculada: 01:12)</p>
            <p className="mt-2 text-xs">* Horários de chegada e custos calculados automaticamente</p>
          </div>
        </div>

        {route.length > 0 && missionDate && initialDepartureTime && (
          <Button onClick={calculateCosts} className="w-full bg-green-600 hover:bg-green-700">
            <Calculator className="h-4 w-4 mr-2" />
            Recalcular Custos
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteBuilder;
