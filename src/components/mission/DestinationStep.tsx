import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Plane, ArrowLeft, ArrowRight, Loader2, Globe, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { searchAirports, getPopularAirports, calculateDistance, getAirportsByRegion, Airport, getAirportCoordinatesWithFallback } from '@/utils/airport-search';
import IntelligentTimeSelectionStep from '../booking-flow/IntelligentTimeSelectionStep';
import { getAircrafts } from '@/utils/api';

interface DestinationStepProps {
  origin: string;
  departureDate?: Date;
  departureTime?: string;
  onDestinationSelected: (destination: string, returnDate: string, returnTime: string, distance: number) => void;
  onBack: () => void;
}

const DestinationStep: React.FC<DestinationStepProps> = ({
  origin,
  departureDate,
  departureTime,
  onDestinationSelected,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Airport | null>(null);
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [usingAISWEB, setUsingAISWEB] = useState(false);

  const [selectedAircraft, setSelectedAircraft] = useState<any>(null);
  const [aircrafts, setAircrafts] = useState<any[]>([]);

  const regions = [
    { id: 'sudeste', name: 'Sudeste', states: ['SP', 'RJ', 'MG', 'ES'] },
    { id: 'sul', name: 'Sul', states: ['PR', 'RS', 'SC'] },
    { id: 'centro-oeste', name: 'Centro-Oeste', states: ['DF', 'GO', 'MT', 'MS'] },
    { id: 'nordeste', name: 'Nordeste', states: ['BA', 'PE', 'CE', 'MA', 'PB', 'PI', 'RN', 'SE', 'AL'] },
    { id: 'norte', name: 'Norte', states: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'] }
  ];

  // Carregar aeronaves
  useEffect(() => {
    const fetchAircrafts = async () => {
      try {
        // console.log('🔍 Carregando aeronaves...');
        const aircraftsData = await getAircrafts();
        // console.log('🔍 Aeronaves carregadas:', aircraftsData);
        setAircrafts(aircraftsData);
        
        // Selecionar primeira aeronave disponível
        if (aircraftsData.length > 0) {
          const availableAircraft = aircraftsData.find(a => a.status === 'available');
          // console.log('🔍 Aeronave disponível encontrada:', availableAircraft);
          if (availableAircraft) {
            setSelectedAircraft(availableAircraft);
          } else {
            // Se não houver aeronave disponível, usar a primeira
            // console.log('🔍 Usando primeira aeronave como fallback:', aircraftsData[0]);
            setSelectedAircraft(aircraftsData[0]);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar aeronaves:', error);
        toast.error('Erro ao carregar aeronaves');
      }
    };

    fetchAircrafts();
  }, []);



  // Buscar aeroportos quando o termo de busca mudar
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchTerm.length < 2 && !selectedRegion) {
      setAirports(getPopularAirports());
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
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
        setLoading(false);
      }
    }, 500); // Debounce de 500ms

    setSearchTimeout(timeout);
  }, [searchTerm, selectedRegion]);

  const handleDestinationSelect = (airport: Airport) => {
    setSelectedDestination(airport);
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region === selectedRegion ? '' : region);
    setSearchTerm(''); // Limpar busca quando selecionar região
  };

  const handleReturnTimeSelect = (timeSlot: any) => {
    // console.log('🔍 Slot de retorno selecionado:', timeSlot);
    // console.log('🔍 Tipo do timeSlot:', typeof timeSlot);
    // console.log('🔍 timeSlot completo:', timeSlot);
    
    try {
      if (typeof timeSlot === 'object' && timeSlot.start) {
        // Caso do IntelligentTimeSelectionStep que passa objeto com start/end
        const selectedDate = new Date(timeSlot.start);
        // console.log('🔍 Data selecionada (objeto):', selectedDate);
        
        if (isNaN(selectedDate.getTime())) {
          throw new Error('Data inválida recebida do calendário');
        }
        
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const formattedTime = selectedDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        // console.log('🔍 Data formatada:', formattedDate);
        // console.log('🔍 Hora formatada:', formattedTime);
        
        setReturnDate(formattedDate);
        setReturnTime(formattedTime);
        toast.success(`✅ Data/Hora de retorno selecionada: ${formattedDate} às ${formattedTime}`);
      } else if (typeof timeSlot === 'string') {
        // Fallback para string (compatibilidade)
        // console.log('🔍 Processando timeSlot como string:', timeSlot);
        
        const today = new Date();
        const [hours, minutes] = timeSlot.split(':');
        
        if (!hours || !minutes) {
          throw new Error('Formato de hora inválido');
        }
        
        const selectedDateTime = new Date(
          today.getFullYear(), 
          today.getMonth(), 
          today.getDate(), 
          parseInt(hours), 
          parseInt(minutes)
        );
        
        const formattedDate = selectedDateTime.toISOString().split('T')[0];
        
        setReturnDate(formattedDate);
        setReturnTime(timeSlot);
        toast.success(`✅ Data/Hora de retorno selecionada: ${formattedDate} às ${timeSlot}`);
      } else {
        throw new Error('Formato de timeSlot não reconhecido');
      }
    } catch (error) {
      console.error('❌ Erro ao processar seleção de horário:', error);
      toast.error('Erro ao processar seleção de horário. Tente novamente.');
    }
  };

  const handleAircraftSelect = (aircraft: any) => {
    setSelectedAircraft(aircraft);
  };

  const handleContinue = async () => {
    // console.log('🔍 handleContinue chamado');
    // console.log('🔍 selectedDestination:', selectedDestination);
    // console.log('🔍 returnDate:', returnDate);
    // console.log('🔍 returnTime:', returnTime);
    // console.log('🔍 returnDate type:', typeof returnDate);
    // console.log('🔍 returnDate length:', returnDate?.length);
    
    if (!selectedDestination) {
      // console.log('❌ Destino não selecionado');
      toast.error('Por favor, selecione um destino');
      return;
    }
    if (!returnDate) {
      // console.log('❌ Data de retorno não informada');
      toast.error('Por favor, informe a data de retorno');
      return;
    }
    if (!returnTime) {
      // console.log('❌ Horário de retorno não informado');
      toast.error('Por favor, informe o horário de retorno');
      return;
    }

    // Buscar coordenadas usando API AISWEB quando possível
    let distance = 0;
    try {
      // console.log('🔍 Buscando coordenadas via API AISWEB...');
      setUsingAISWEB(true);
      
      const originCoords = await getAirportCoordinatesWithFallback(origin);
      const destCoords = await getAirportCoordinatesWithFallback(selectedDestination.icao);
      
      if (originCoords && destCoords) {
        distance = calculateDistance(
          originCoords.lat, originCoords.lon,
          destCoords.lat, destCoords.lon
        );
        // console.log('✅ Coordenadas obtidas via API AISWEB');
      } else {
        // Fallback para base local
        const originAirport = getPopularAirports().find(a => 
          a.icao.toUpperCase() === origin.toUpperCase()
        );
        
        if (originAirport) {
          distance = calculateDistance(
            originAirport.latitude, originAirport.longitude,
            selectedDestination.latitude, selectedDestination.longitude
          );
          // console.log('ℹ️ Usando coordenadas da base local');
        }
      }
    } catch (error) {
      // console.log('ℹ️ Erro ao buscar coordenadas, usando base local');
      const originAirport = getPopularAirports().find(a => 
        a.icao.toUpperCase() === origin.toUpperCase()
      );
      
      if (originAirport) {
        distance = calculateDistance(
          originAirport.latitude, originAirport.longitude,
          selectedDestination.latitude, selectedDestination.longitude
        );
      }
    } finally {
      setUsingAISWEB(false);
    }
    
    // console.log('🔍 Distância calculada:', distance);
    // console.log('🔍 Chamando onDestinationSelected com:', {
      destination: selectedDestination.icao,
      returnDate,
      returnTime,
      distance
    });
    // console.log('🔍 returnDate antes de chamar onDestinationSelected:', returnDate);
    // console.log('🔍 returnDate type antes de chamar:', typeof returnDate);
    // console.log('🔍 VAI CHAMAR onDestinationSelected AGORA!');

    onDestinationSelected(selectedDestination.icao, returnDate, returnTime, distance);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">Destino da Missão</h2>
          <p className="text-xs md:text-sm text-gray-600">Escolha o destino e horário de retorno</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="flex items-center space-x-1 md:space-x-2 ml-2 flex-shrink-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {/* Origem */}
        <Card className="p-3 md:p-4">
          <div className="space-y-2">
            <Label className="text-sm">Origem</Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-sky-500" />
                <span className="font-medium text-sm">SBAU - Araçatuba</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Aeroporto de Araçatuba, SP</p>
            </div>
          </div>
        </Card>

        {/* Destino */}
        <Card className="p-3 md:p-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="search" className="text-xs md:text-sm">Buscar Aeroporto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Digite o código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 md:pl-10 h-8 md:h-10 text-xs md:text-sm"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 animate-spin text-sky-500" />
                )}
              </div>
            </div>

            {/* Filtros por Região */}
            <div>
              <Label className="text-xs md:text-sm">Filtrar por Região</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {regions.map((region) => (
                  <Badge
                    key={region.id}
                    variant={selectedRegion === region.id ? "default" : "outline"}
                    className={`cursor-pointer text-xs px-1 md:px-2 py-1 ${
                      selectedRegion === region.id 
                        ? 'bg-sky-500 text-white' 
                        : 'hover:bg-sky-50'
                    }`}
                    onClick={() => handleRegionSelect(region.id)}
                  >
                    <Globe className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                    <span className="hidden sm:inline">{region.name}</span>
                    <span className="sm:hidden">{region.name.substring(0, 3)}</span>
                  </Badge>
                ))}
              </div>
            </div>

                         {/* Horário de Retorno à Base */}
             <div className="space-y-3">
               <div>
                 <Label className="text-sm font-medium">Horário de Retorno à Base</Label>
                 <p className="text-xs text-gray-600">Selecione a data e horário que deseja retornar à base (SBAU) usando o calendário inteligente</p>
                 
                 {/* Informação sobre a data de partida */}
                 {departureDate && departureTime && (
                   <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                     <div className="text-xs text-blue-700 font-medium">
                       🛫 Partida: {departureDate.toLocaleDateString('pt-BR')} às {departureTime}
                     </div>
                     <div className="text-xs text-blue-600 mt-1">
                       ⚠️ O retorno deve ser após a partida
                     </div>
                   </div>
                 )}
               </div>
              
                             {/* Calendário Inteligente - Substitui os inputs manuais */}
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <div className="text-xs text-gray-600">
                     {returnDate && returnTime ? (
                       <span className="text-green-600 font-medium">
                         ✅ Data/Hora selecionada: {returnDate} às {returnTime}
                       </span>
                     ) : (
                       <span className="text-orange-600">
                         ⚠️ Selecione data e horário de retorno
                       </span>
                     )}
                   </div>
                 </div>
               </div>
              
                             {selectedAircraft && (
                 <Card className="mt-3 border-2 border-green-200 bg-green-50">
                   <CardContent className="p-3">
                     <div className="text-sm text-green-700 mb-3 font-medium flex items-center">
                       🎯 Calendário Inteligente (30min) - {selectedAircraft.registration}
                       <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded">Disponibilidade em Tempo Real</span>
                     </div>
                     <IntelligentTimeSelectionStep
                       title="Selecione o horário de retorno à base"
                       selectedDate={returnDate ? new Date(returnDate).getDate().toString() : departureDate.getDate().toString()}
                       currentMonth={returnDate ? new Date(returnDate) : departureDate}
                       selectedAircraft={selectedAircraft}
                       onTimeSelect={handleReturnTimeSelect}
                       onAircraftSelect={handleAircraftSelect}
                       onBack={() => {}} // Função vazia para compatibilidade
                       departureDateTime={departureDate && departureTime ? new Date(`${departureDate.toISOString().split('T')[0]}T${departureTime}`) : undefined}
                     />
                   </CardContent>
                 </Card>
               )}
              
                             {!selectedAircraft && (
                 <div className="text-xs text-orange-600 mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                   ⚠️ Carregando aeronaves... O calendário inteligente estará disponível em breve.
                 </div>
               )}
            </div>

            {/* Indicador de uso da API AISWEB */}
            {usingAISWEB && (
              <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-xs text-blue-700">Buscando dados via API AISWEB...</span>
              </div>
            )}

            {/* Lista de Aeroportos */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {airports.length > 0 ? (
                airports.map((airport) => (
                  <div
                    key={airport.icao}
                    className={`p-2 rounded-md border cursor-pointer transition-all text-xs md:text-sm ${
                      selectedDestination?.icao === airport.icao
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleDestinationSelect(airport)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {airport.icao} - {airport.name}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {airport.city}, {airport.state}
                        </div>
                        {airport.iata && (
                          <div className="text-xs text-gray-500">
                            IATA: {airport.iata}
                          </div>
                        )}
                      </div>
                      {selectedDestination?.icao === airport.icao && (
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-sky-500 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Plane className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs md:text-sm">Nenhum aeroporto encontrado</p>
                  <p className="text-xs">Tente buscar por outro termo ou região</p>
                </div>
              )}
            </div>

            {/* Estatísticas */}
            {airports.length > 0 && (
              <div className="text-xs text-gray-500 text-center">
                {airports.length} aeroporto(s) encontrado(s)
                {selectedRegion && (
                  <span className="hidden sm:inline">
                    {` na região ${regions.find(r => r.id === selectedRegion)?.name}`}
                  </span>
                )}
                {selectedRegion && (
                  <span className="sm:hidden">
                    {` - ${regions.find(r => r.id === selectedRegion)?.name}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Botão Continuar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleContinue}
          disabled={!selectedDestination || !returnDate || !returnTime}
          className="bg-sky-500 hover:bg-sky-600 text-white px-4 md:px-6 py-2 text-xs md:text-sm"
        >
          <span>Continuar</span>
          <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default DestinationStep; 
