import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plane, MapPin, Clock, Users, Calendar, AlertCircle, Search, Globe, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { searchAirports, getPopularAirports, getAirportsByRegion, Airport } from '@/utils/airport-search';
import { getAircrafts, createSharedMission, validateSharedMission } from '@/utils/api';
import IntelligentSharedMissionCalendar from './IntelligentSharedMissionCalendar';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  max_passengers: number;
  hourly_rate: number;
  overnight_fee: number;
  status: string;
}

interface SharedMissionData {
  aircraft: Aircraft;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  origin: string;
  destination: string;
  secondaryDestination: string;
  stops: string;
  notes: string;
  availableSeats: number;
  totalCost: number;
}

interface CreateSharedMissionProps {
  onBack: () => void;
  onMissionCreated: (data: SharedMissionData) => void;
}

const CreateSharedMission: React.FC<CreateSharedMissionProps> = ({
  onBack,
  onMissionCreated
}) => {
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loadingAircraft, setLoadingAircraft] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loadingAirports, setLoadingAirports] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Airport | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<Airport | null>(null);
  const [selectedSecondaryDestination, setSelectedSecondaryDestination] = useState<Airport | null>(null);
  const [selectedAirports, setSelectedAirports] = useState<{[icao: string]: 'main' | 'secondary'}>({});
  const [missionData, setMissionData] = useState({
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    origin: '',
    destination: '',
    secondaryDestination: '',
    stops: '',
    notes: '',
    availableSeats: 1
  });

  // Estados para calendário inteligente
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);

  // Buscar aeronaves da API
  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        setLoadingAircraft(true);
        const response = await getAircrafts();
        if (response && Array.isArray(response) && response.length > 0) {
          setAircraft(response);
        } else {
          // console.log('ℹ️ Usando aeronaves locais de fallback');
          // Dados locais de fallback
          const fallbackAircraft: Aircraft[] = [
            {
              id: 1,
              name: 'Baron E55',
              registration: 'PR-FOM',
              model: 'Baron E55',
              max_passengers: 6,
              hourly_rate: 2800,
              overnight_fee: 1500,
              status: 'available'
            },
            {
              id: 2,
              name: 'Cessna 172',
              registration: 'PR-ABC',
              model: 'Cessna 172',
              max_passengers: 4,
              hourly_rate: 2500,
              overnight_fee: 1200,
              status: 'available'
            }
          ];
          setAircraft(fallbackAircraft);
        }
      } catch (error) {
        // console.log('ℹ️ Erro ao buscar aeronaves - usando dados locais');
        // Dados locais de fallback
        const fallbackAircraft: Aircraft[] = [
          {
            id: 1,
            name: 'Baron E55',
            registration: 'PR-FOM',
            model: 'Baron E55',
            max_passengers: 6,
            hourly_rate: 2800,
            overnight_fee: 1500,
            status: 'available'
          },
          {
            id: 2,
            name: 'Cessna 172',
            registration: 'PR-ABC',
            model: 'Cessna 172',
            max_passengers: 4,
            hourly_rate: 2500,
            overnight_fee: 1200,
            status: 'available'
          }
        ];
        setAircraft(fallbackAircraft);
      } finally {
        setLoadingAircraft(false);
      }
    };

    fetchAircraft();
  }, []);

  // Buscar aeroportos quando o termo de busca mudar
  useEffect(() => {
    const searchAirportsAsync = async () => {
      if (searchTerm.length < 2 && !selectedRegion) {
        setAirports(getPopularAirports());
        return;
      }

      setLoadingAirports(true);
      try {
        let results: Airport[] = [];
        
        if (selectedRegion) {
          results = getAirportsByRegion(selectedRegion);
        } else if (searchTerm.length >= 2) {
          results = await searchAirports(searchTerm);
        } else {
          results = getPopularAirports();
        }
        
        setAirports(results);
      } catch (error) {
        console.error('Erro ao buscar aeroportos:', error);
        setAirports(getPopularAirports());
      } finally {
        setLoadingAirports(false);
      }
    };

    const timeout = setTimeout(searchAirportsAsync, 500);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedRegion]);

  const regions = [
    { id: 'sudeste', name: 'Sudeste', states: ['SP', 'RJ', 'MG', 'ES'] },
    { id: 'sul', name: 'Sul', states: ['PR', 'RS', 'SC'] },
    { id: 'centro-oeste', name: 'Centro-Oeste', states: ['DF', 'GO', 'MT', 'MS'] },
    { id: 'nordeste', name: 'Nordeste', states: ['BA', 'PE', 'CE', 'MA', 'PB', 'PI', 'RN', 'SE', 'AL'] },
    { id: 'norte', name: 'Norte', states: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'] }
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setMissionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDestinationSelect = (airport: Airport) => {
    setSelectedDestination(airport);
    setMissionData(prev => ({
      ...prev,
      destination: airport.icao
    }));
  };

  const handleSecondaryDestinationSelect = (airport: Airport) => {
    setSelectedSecondaryDestination(airport);
    setMissionData(prev => ({
      ...prev,
      secondaryDestination: airport.icao
    }));
  };

  const handleAddDestination = (airport: Airport, type: 'main' | 'secondary') => {
    console.log('🎯 Adicionando destino:', airport.icao, 'como', type);
    setSelectedAirports(prev => ({
      ...prev,
      [airport.icao]: type
    }));

    if (type === 'main') {
      setSelectedDestination(airport);
      setMissionData(prev => ({
        ...prev,
        destination: airport.icao
      }));
    } else {
      setSelectedSecondaryDestination(airport);
      setMissionData(prev => ({
        ...prev,
        secondaryDestination: airport.icao
      }));
    }
  };

  const handleOriginSelect = (airport: Airport) => {
    setSelectedOrigin(airport);
    setMissionData(prev => ({
      ...prev,
      origin: airport.icao
    }));
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region === selectedRegion ? '' : region);
    setSearchTerm(''); // Limpar busca quando selecionar região
  };

  // Função para obter velocidade estimada da aeronave
  const getAircraftSpeed = (aircraftModel: string): number => {
    const model = aircraftModel.toLowerCase();
    
    if (model.includes('cessna') || model.includes('172')) {
      return 185; // Cessna 172: ~185 KT (velocidade real de cruzeiro)
    } else if (model.includes('piper') || model.includes('cherokee')) {
      return 190; // Piper Cherokee: ~190 KT
    } else if (model.includes('beechcraft') || model.includes('bonanza') || model.includes('baron')) {
      return 220; // Beechcraft Baron: ~220 KT
    } else if (model.includes('cirrus')) {
      return 200; // Cirrus SR22: ~200 KT
    } else {
      return 185; // Velocidade padrão para aeronaves pequenas (185 KT)
    }
  };

  // Função para calcular distância usando Haversine (em metros) e converter para milhas náuticas
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180; // φ, λ em radianos
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // Distância em metros
    return d / 1852; // Converter para milhas náuticas (1 NM = 1852 metros)
  };

  // Taxa aeroportuária dinâmica
  const calculateAirportFee = (distance: number) => {
    if (distance <= 200) return 100;
    if (distance <= 400) return 200;
    if (distance <= 800) return 300;
    return 400;
  };

  // Substituir cálculo de distance em calculateCosts por busca real na AISWEB
  const calculateCosts = useMemo(() => {
    // Verificação de segurança adicional
    if (!selectedAircraft) {
      return { distance: 0, flightHours: 0, overnight: 0, total: 0 };
    }
    
    if (!missionData.departureDate || !missionData.departureTime || !missionData.returnDate || !missionData.returnTime || !missionData.origin || !missionData.destination) {
      return { distance: 0, flightHours: 0, overnight: 0, total: 0 };
    }
    
    // Usar coordenadas mock para cálculo síncrono
    const airports = {
      SBAU: { lat: -21.1411, lon: -50.4247 },
      SBSP: { lat: -23.6273, lon: -46.6566 },
      SBGR: { lat: -23.4356, lon: -46.4731 },
      SBSV: { lat: -12.9089, lon: -38.3225 },
      SBRJ: { lat: -22.9104, lon: -43.1631 },
      SBKP: { lat: -23.0074, lon: -47.1345 },
      SBCF: { lat: -19.6336, lon: -43.9686 },
      SBFL: { lat: -27.6705, lon: -48.5477 },
      SBBR: { lat: -15.8697, lon: -47.9208 },
      SBPA: { lat: -29.9939, lon: -51.1714 },
    };
    const origem = airports[missionData.origin] || airports['SBAU'];
    const destino = airports[missionData.destination] || airports['SBSP'];
    const distance = haversine(origem.lat, origem.lon, destino.lat, destino.lon);
    
    // Calcular tempo de voo usando a fórmula correta: Tempo (H) = Distância (NM) / Velocidade Cruzeiro (KT)
    const aircraftSpeed = selectedAircraft ? getAircraftSpeed(selectedAircraft.model) : 185; // Velocidade em nós (KT)
    const flightTimeHours = (distance / aircraftSpeed) * 1.1; // Tempo em horas + 10% para tráfego aéreo
    
    // Calcular tempo total (ida + volta)
    const flightHours = Math.max(1, Math.ceil(flightTimeHours * 2)); // Multiplicar por 2 para ida e volta
    
    // Pernoite se retorno < saída (baseado no horário real)
    const departureHour = parseInt(missionData.departureTime.split(':')[0]) || 0;
    const departureMinute = parseInt(missionData.departureTime.split(':')[1]) || 0;
    const returnHour = parseInt(missionData.returnTime.split(':')[0]) || 0;
    const returnMinute = parseInt(missionData.returnTime.split(':')[1]) || 0;
    
    let overnight = 0;
    if (returnHour < departureHour) {
      overnight = 1;
    } else if (returnHour === departureHour) {
      if (returnMinute < departureMinute) {
        overnight = 1;
      }
    }
    
    const hourlyRate = selectedAircraft?.hourly_rate || 2800;
    const overnightFee = selectedAircraft?.overnight_fee || 1500;
    const total = (flightHours * hourlyRate) + (overnight * overnightFee);
    
    return { distance, flightHours, overnight, total };
  }, [selectedAircraft, missionData]);

  const calculateOwnerCost = () => {
    const { total } = calculateCosts;
    return total || 0; // Dono paga o total
  };

  const validateForm = () => {
    if (!selectedAircraft) {
      toast.error("Selecione uma aeronave", {
        description: "É necessário selecionar uma aeronave para continuar"
      });
      return false;
    }

    if (!missionData.departureDate || !missionData.departureTime || !missionData.returnDate || !missionData.returnTime) {
      toast.error("Datas e horários obrigatórios", {
        description: "Preencha todas as datas e horários"
      });
      return false;
    }

    if (!missionData.origin.trim()) {
      toast.error("Origem obrigatória", {
        description: "Informe a origem da viagem"
      });
      return false;
    }

    if (!missionData.destination.trim()) {
      toast.error("Destino obrigatório", {
        description: "Informe o destino da viagem"
      });
      return false;
    }

    if (missionData.availableSeats < 1 || missionData.availableSeats >= (selectedAircraft?.max_passengers || 1)) {
      toast.error("Poltronas disponíveis inválidas", {
        description: `Selecione entre 1 e ${(selectedAircraft?.max_passengers || 1) - 1} poltronas`
      });
      return false;
    }

    return true;
  };

  const handleTimeSlotSelect = (slot: any) => {
    setSelectedTimeSlot(slot);
    setMissionData(prev => ({
      ...prev,
      departureDate: format(slot.start, 'yyyy-MM-dd'),
      departureTime: format(slot.start, 'HH:mm'),
      returnDate: format(slot.start, 'yyyy-MM-dd'), // Para missões compartilhadas, geralmente mesmo dia
      returnTime: format(new Date(slot.start.getTime() + (2 * 60 * 60 * 1000)), 'HH:mm') // +2h para retorno
    }));
    setShowCalendar(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Calcular o preço por assento baseado no custo total dividido pelos assentos disponíveis
    const totalCost = calculateOwnerCost();
    const pricePerSeat = missionData.availableSeats > 0 ? Math.ceil(totalCost / missionData.availableSeats) : 0;
    
    // Validar missão antes de criar
    try {
      const validation = await validateSharedMission({
        aircraftId: selectedAircraft!.id,
        departure_date: `${missionData.departureDate}T${missionData.departureTime}`,
        return_date: `${missionData.returnDate}T${missionData.returnTime}`,
        flight_hours: calculateCosts.flightHours,
        origin: missionData.origin,
        destination: missionData.destination
      });

      if (!validation.valido) {
        toast.error('Conflito de horário', {
          description: validation.error || 'Existe um conflito com outra missão no horário selecionado'
        });
        return;
      }

      // Se validação passou, criar a missão
      await createSharedMission({
         title: `Missão compartilhada de ${missionData.origin} para ${missionData.destination}`,
         description: missionData.notes,
         origin: missionData.origin,
         destination: missionData.destination,
         departure_date: `${missionData.departureDate}T${missionData.departureTime}`,
         return_date: `${missionData.returnDate}T${missionData.returnTime}`,
         aircraftId: selectedAircraft!.id,
         totalSeats: missionData.availableSeats,
         pricePerSeat: pricePerSeat,
         totalCost: totalCost,
         overnightFee: selectedAircraft?.overnight_fee || 0
       });
      toast.success('Missão compartilhada criada com sucesso!');
      onMissionCreated({
        aircraft: selectedAircraft!,
        departureDate: missionData.departureDate,
        departureTime: missionData.departureTime,
        returnDate: missionData.returnDate,
        returnTime: missionData.returnTime,
        origin: missionData.origin,
        destination: missionData.destination,
        secondaryDestination: missionData.secondaryDestination,
        stops: missionData.stops,
        notes: missionData.notes,
        availableSeats: missionData.availableSeats,
        totalCost: totalCost
      });
    } catch (error) {
      toast.error('Erro ao criar missão compartilhada');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Criar Viagem Compartilhada</h2>
          <p className="text-xs md:text-sm text-gray-600">Configure sua missão e disponibilize poltronas</p>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2 text-xs">
          <ArrowLeft className="h-3 w-3" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Seleção de Aeronave */}
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="flex items-center space-x-2 text-sm md:text-base">
              <Plane className="h-4 w-4 text-aviation-blue" />
              <span>Selecione a Aeronave</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            {loadingAircraft ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500 mr-2" />
                <span className="text-sm text-gray-600">Carregando aeronaves...</span>
              </div>
            ) : aircraft.length === 0 ? (
              <div className="text-center py-6">
                <Plane className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Nenhuma aeronave disponível</h3>
                <p className="text-xs text-gray-600">Não há aeronaves cadastradas no sistema.</p>
              </div>
            ) : (
              aircraft.map((plane) => (
                <div
                  key={plane.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAircraft?.id === plane.id
                      ? 'border-aviation-blue bg-aviation-blue/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAircraft(plane)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{plane.name}</div>
                      <div className="text-xs text-gray-500">{plane.registration} • {plane.model}</div>

                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Máx. passageiros</div>
                      <div className="font-medium text-sm">{plane.max_passengers}</div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Cálculo Automático quando Aeronave é Selecionada */}
            {selectedAircraft && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800 text-sm">Cálculo Automático Ativado</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-700">Aeronave selecionada:</span>
                    <span className="font-medium">{selectedAircraft.name}</span>
                  </div>

                  {missionData.origin && missionData.destination && (
                    <div className="pt-1 border-t border-green-200">
                      <div className="flex justify-between">
                        <span className="text-green-700">Distância calculada:</span>
                        <span className="font-medium">{calculateCosts.distance}km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Tempo de voo estimado:</span>
                        <span className="font-medium">{calculateCosts.flightHours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Custo total estimado:</span>
                        <span className="font-medium text-green-800">R$ {calculateCosts.total}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalhes da Missão */}
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="flex items-center space-x-2 text-sm md:text-base">
              <MapPin className="h-4 w-4 text-aviation-blue" />
              <span>Detalhes da Missão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            {/* Botão do Calendário Inteligente */}
            {selectedAircraft && (
              <div className="mb-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCalendar(true)}
                  className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Usar Calendário Inteligente
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="departureDate" className="text-xs">Data de Partida</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={missionData.departureDate}
                  onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="departureTime" className="text-xs">Horário de Partida</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={missionData.departureTime}
                  onChange={(e) => handleInputChange('departureTime', e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="returnDate" className="text-xs">Data de Retorno</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={missionData.returnDate}
                  onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="returnTime" className="text-xs">Horário de Retorno</Label>
                <Input
                  id="returnTime"
                  type="time"
                  value={missionData.returnTime}
                  onChange={(e) => handleInputChange('returnTime', e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="origin" className="text-xs">Origem</Label>
              <div className="space-y-2">
                {/* Busca de Aeroporto de Origem */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar aeroporto de origem..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                  {loadingAirports && (
                    <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-sky-500" />
                  )}
                </div>

                {/* Filtros por Região para Origem */}
                <div>
                  <Label className="text-xs">Filtrar por Região</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {regions.map((region) => (
                      <Badge
                        key={region.id}
                        variant={selectedRegion === region.id ? "default" : "outline"}
                        className={`cursor-pointer text-xs px-2 py-0.5 ${
                          selectedRegion === region.id 
                            ? 'bg-sky-500 text-white' 
                            : 'hover:bg-sky-50'
                        }`}
                        onClick={() => handleRegionSelect(region.id)}
                      >
                        <Globe className="h-2.5 w-2.5 mr-1" />
                        {region.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Lista de Aeroportos de Origem */}
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {airports.length > 0 ? (
                    airports.map((airport) => (
                      <div
                        key={airport.icao}
                        className={`p-2 rounded border cursor-pointer transition-all text-xs ${
                          selectedOrigin?.icao === airport.icao
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleOriginSelect(airport)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {airport.icao} - {airport.name}
                            </div>
                            <div className="text-gray-600">
                              {airport.city}, {airport.state}
                            </div>
                            {airport.iata && (
                              <div className="text-gray-500">
                                IATA: {airport.iata}
                              </div>
                            )}
                          </div>
                          {selectedOrigin?.icao === airport.icao && (
                            <div className="w-3 h-3 bg-sky-500 rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-gray-500">
                      <Plane className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs">Nenhum aeroporto encontrado</p>
                      <p className="text-xs">Tente buscar por outro termo ou região</p>
                    </div>
                  )}
                </div>

                {/* Estatísticas para Origem */}
                {airports.length > 0 && (
                  <div className="text-xs text-gray-500 text-center">
                    {airports.length} aeroporto(s) encontrado(s)
                    {selectedRegion && ` na região ${regions.find(r => r.id === selectedRegion)?.name}`}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="destination" className="text-xs">Destino</Label>
              <div className="space-y-2">
                {/* Busca de Aeroporto */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar aeroporto de destino..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                  {loadingAirports && (
                    <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-sky-500" />
                  )}
                </div>

                {/* Filtros por Região */}
                <div>
                  <Label className="text-xs">Filtrar por Região</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {regions.map((region) => (
                      <Badge
                        key={region.id}
                        variant={selectedRegion === region.id ? "default" : "outline"}
                        className={`cursor-pointer text-xs px-2 py-0.5 ${
                          selectedRegion === region.id 
                            ? 'bg-sky-500 text-white' 
                            : 'hover:bg-sky-50'
                        }`}
                        onClick={() => handleRegionSelect(region.id)}
                      >
                        <Globe className="h-2.5 w-2.5 mr-1" />
                        {region.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Lista de Aeroportos */}
                <div>
                  <Label>Aeroportos Disponíveis</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
                  {airports.length > 0 ? (
                    airports.map((airport) => (
                      <div
                        key={airport.icao}
                        className="p-3 border border-gray-200 rounded-lg hover:border-sky-300 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{airport.name}</div>
                            <div className="text-sm text-gray-600">
                              {airport.city}, {airport.state} - {airport.icao}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant={selectedAirports[airport.icao] === 'main' ? 'default' : 'outline'}
                              className={selectedAirports[airport.icao] === 'main' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                              onClick={() => handleAddDestination(airport, 'main')}
                            >
                              Destino Principal
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedAirports[airport.icao] === 'secondary' ? 'default' : 'outline'}
                              className={selectedAirports[airport.icao] === 'secondary' ? 'bg-gray-500 hover:bg-gray-600 text-white' : ''}
                              onClick={() => handleAddDestination(airport, 'secondary')}
                            >
                              Secundário
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-gray-500">
                      <Plane className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs">Nenhum aeroporto encontrado</p>
                      <p className="text-xs">Tente buscar por outro termo ou região</p>
                    </div>
                  )}
                  </div>
                </div>

                {/* Estatísticas */}
                {airports.length > 0 && (
                  <div className="text-xs text-gray-500 text-center">
                    {airports.length} aeroporto(s) encontrado(s)
                    {selectedRegion && ` na região ${regions.find(r => r.id === selectedRegion)?.name}`}
                  </div>
                )}

                {/* Destinos Selecionados */}
                {(selectedDestination || selectedSecondaryDestination) && (
                  <div className="mt-4">
                    <Label className="text-xs font-medium">Destinos Selecionados</Label>
                    <div className="space-y-2 mt-2">
                      {selectedDestination && (
                        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <div>
                            <div className="font-medium text-blue-800">{selectedDestination.icao}</div>
                            <div className="text-blue-600">{selectedDestination.name}</div>
                            <div className="text-blue-500">{selectedDestination.city}, {selectedDestination.state}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="default" className="bg-blue-500 text-white text-xs">
                              Destino Principal
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDestination(null);
                                setSelectedAirports(prev => {
                                  const newState = { ...prev };
                                  delete newState[selectedDestination.icao];
                                  return newState;
                                });
                                setMissionData(prev => ({ ...prev, destination: '' }));
                              }}
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      )}
                      {selectedSecondaryDestination && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                          <div>
                            <div className="font-medium text-gray-800">{selectedSecondaryDestination.icao}</div>
                            <div className="text-gray-600">{selectedSecondaryDestination.name}</div>
                            <div className="text-gray-500">{selectedSecondaryDestination.city}, {selectedSecondaryDestination.state}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              Secundário
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSecondaryDestination(null);
                                setSelectedAirports(prev => {
                                  const newState = { ...prev };
                                  delete newState[selectedSecondaryDestination.icao];
                                  return newState;
                                });
                                setMissionData(prev => ({ ...prev, secondaryDestination: '' }));
                              }}
                              className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>


            <div>
              <Label htmlFor="stops" className="text-xs">Escalas (opcional)</Label>
              <Input
                id="stops"
                type="text"
                placeholder="Ex: Campo Grande, Brasília"
                value={missionData.stops}
                onChange={(e) => handleInputChange('stops', e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-xs">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a viagem..."
                value={missionData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="mt-1 text-xs"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuração de Compartilhamento */}
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="flex items-center space-x-2 text-sm md:text-base">
            <Users className="h-4 w-4 text-aviation-blue" />
            <span>Configuração de Compartilhamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {selectedAircraft && (
            <div className="mt-4">
              <Label htmlFor="availableSeats" className="text-xs font-bold">Quantos assentos você quer liberar para outros?</Label>
              <Input
                id="availableSeats"
                type="number"
                min="1"
                max={selectedAircraft ? (selectedAircraft.max_passengers || 1) - 1 : 1}
                value={missionData.availableSeats}
                onChange={e => handleInputChange('availableSeats', parseInt(e.target.value) || 1)}
                className="mt-1 h-8 text-xs"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {selectedAircraft ? `Máximo: ${(selectedAircraft.max_passengers || 1) - 1} assentos` : 'Selecione uma aeronave primeiro'}
              </div>
            </div>
          )}

          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 text-sm">Importante sobre compartilhamento:</h3>
                <ul className="text-xs text-blue-700 mt-1 space-y-0.5">
                  <li>• Você mantém o controle total da missão</li>
                  <li>• Você paga apenas sua parte proporcional dos custos</li>
                  <li>• Você pode cancelar ou modificar a viagem até 24h antes</li>
                  <li>• Os passageiros serão notificados sobre mudanças</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={handleSubmit}
          disabled={!selectedAircraft || !missionData.departureDate || !missionData.origin || !missionData.destination}
          className="bg-aviation-gradient hover:opacity-90 text-white text-sm px-6 h-10"
        >
          <Users className="h-3 w-3 mr-2" />
          Criar
        </Button>
      </div>

      {/* Calendário Inteligente Modal */}
      {showCalendar && selectedAircraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <IntelligentSharedMissionCalendar
              selectedAircraft={selectedAircraft}
              onTimeSlotSelect={handleTimeSlotSelect}
              selectedTimeSlot={selectedTimeSlot}
              onBack={() => setShowCalendar(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSharedMission;
