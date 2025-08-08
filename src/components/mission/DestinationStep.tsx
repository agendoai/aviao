import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Plane, ArrowLeft, ArrowRight, Loader2, Globe, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { searchAirports, getPopularAirports, calculateDistance, getAirportsByRegion, Airport, getAirportCoordinatesWithFallback } from '@/utils/airport-search';

interface DestinationStepProps {
  origin: string;
  onDestinationSelected: (destination: string, returnDate: string, returnTime: string, distance: number) => void;
  onBack: () => void;
}

const DestinationStep: React.FC<DestinationStepProps> = ({
  origin,
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

  const regions = [
    { id: 'sudeste', name: 'Sudeste', states: ['SP', 'RJ', 'MG', 'ES'] },
    { id: 'sul', name: 'Sul', states: ['PR', 'RS', 'SC'] },
    { id: 'centro-oeste', name: 'Centro-Oeste', states: ['DF', 'GO', 'MT', 'MS'] },
    { id: 'nordeste', name: 'Nordeste', states: ['BA', 'PE', 'CE', 'MA', 'PB', 'PI', 'RN', 'SE', 'AL'] },
    { id: 'norte', name: 'Norte', states: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'] }
  ];

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

  const handleContinue = async () => {
    console.log('🔍 handleContinue chamado');
    console.log('🔍 selectedDestination:', selectedDestination);
    console.log('🔍 returnDate:', returnDate);
    console.log('🔍 returnTime:', returnTime);
    console.log('🔍 returnDate type:', typeof returnDate);
    console.log('🔍 returnDate length:', returnDate?.length);
    
    if (!selectedDestination) {
      console.log('❌ Destino não selecionado');
      toast.error('Por favor, selecione um destino');
      return;
    }
    if (!returnDate) {
      console.log('❌ Data de retorno não informada');
      toast.error('Por favor, informe a data de retorno');
      return;
    }
    if (!returnTime) {
      console.log('❌ Horário de retorno não informado');
      toast.error('Por favor, informe o horário de retorno');
      return;
    }

    // Buscar coordenadas usando API AISWEB quando possível
    let distance = 0;
    try {
      console.log('🔍 Buscando coordenadas via API AISWEB...');
      setUsingAISWEB(true);
      
      const originCoords = await getAirportCoordinatesWithFallback(origin);
      const destCoords = await getAirportCoordinatesWithFallback(selectedDestination.icao);
      
      if (originCoords && destCoords) {
        distance = calculateDistance(
          originCoords.lat, originCoords.lon,
          destCoords.lat, destCoords.lon
        );
        console.log('✅ Coordenadas obtidas via API AISWEB');
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
          console.log('ℹ️ Usando coordenadas da base local');
        }
      }
    } catch (error) {
      console.log('ℹ️ Erro ao buscar coordenadas, usando base local');
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
    
    console.log('🔍 Distância calculada:', distance);
    console.log('🔍 Chamando onDestinationSelected com:', {
      destination: selectedDestination.icao,
      returnDate,
      returnTime,
      distance
    });
    console.log('🔍 returnDate antes de chamar onDestinationSelected:', returnDate);
    console.log('🔍 returnDate type antes de chamar:', typeof returnDate);
    console.log('🔍 VAI CHAMAR onDestinationSelected AGORA!');

    onDestinationSelected(selectedDestination.icao, returnDate, returnTime, distance);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Destino da Missão</h2>
          <p className="text-sm text-gray-600">Escolha o destino e horário de retorno</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Origem */}
        <Card className="p-4">
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
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="search" className="text-sm">Buscar Aeroporto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Digite o código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 text-sm"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-sky-500" />
                )}
              </div>
            </div>

            {/* Filtros por Região */}
            <div>
              <Label className="text-sm">Filtrar por Região</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {regions.map((region) => (
                  <Badge
                    key={region.id}
                    variant={selectedRegion === region.id ? "default" : "outline"}
                    className={`cursor-pointer text-xs px-2 py-1 ${
                      selectedRegion === region.id 
                        ? 'bg-sky-500 text-white' 
                        : 'hover:bg-sky-50'
                    }`}
                    onClick={() => handleRegionSelect(region.id)}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    {region.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">Data de Retorno</Label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => {
                  console.log('🔍 Data de retorno alterada:', e.target.value);
                  setReturnDate(e.target.value);
                }}
                className="h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-sm">Horário de Retorno</Label>
              <Input
                type="time"
                value={returnTime}
                onChange={(e) => {
                  console.log('🔍 Horário de retorno alterado:', e.target.value);
                  setReturnTime(e.target.value);
                }}
                className="h-10 text-sm"
              />
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
                    className={`p-2 rounded-md border cursor-pointer transition-all text-sm ${
                      selectedDestination?.icao === airport.icao
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleDestinationSelect(airport)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {airport.icao} - {airport.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {airport.city}, {airport.state}
                        </div>
                        {airport.iata && (
                          <div className="text-xs text-gray-500">
                            IATA: {airport.iata}
                          </div>
                        )}
                      </div>
                      {selectedDestination?.icao === airport.icao && (
                        <div className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Plane className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nenhum aeroporto encontrado</p>
                  <p className="text-xs">Tente buscar por outro termo ou região</p>
                </div>
              )}
            </div>

            {/* Estatísticas */}
            {airports.length > 0 && (
              <div className="text-xs text-gray-500 text-center">
                {airports.length} aeroporto(s) encontrado(s)
                {selectedRegion && ` na região ${regions.find(r => r.id === selectedRegion)?.name}`}
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
          className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 text-sm"
        >
          <span>Continuar</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default DestinationStep; 