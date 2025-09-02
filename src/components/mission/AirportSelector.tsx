import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Plane, Globe, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  searchAirportsByRegion, 
  searchAirportsByName, 
  getBrazilianAirports, 
  getRegions,
  type AirportData 
} from '../../utils/airport-data-api';

interface AirportSelectorProps {
  onAirportSelect: (airport: AirportData) => void;
  selectedAirport?: AirportData | null;
  placeholder?: string;
}

const AirportSelector: React.FC<AirportSelectorProps> = ({
  onAirportSelect,
  selectedAirport,
  placeholder = "Selecionar aeroporto..."
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AirportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [regionAirports, setRegionAirports] = useState<AirportData[]>([]);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const { toast } = useToast();

  const popularAirports = getBrazilianAirports();
  const regions = getRegions();

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchAirportsByName(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro ao buscar aeroportos:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar aeroportos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionChange = async (regionCode: string) => {
    if (!regionCode) {
      setRegionAirports([]);
      return;
    }

    setIsLoadingRegion(true);
    try {
      const airports = await searchAirportsByRegion(regionCode);
      setRegionAirports(airports);
    } catch (error) {
      console.error('Erro ao buscar aeroportos da região:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar aeroportos da região. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRegion(false);
    }
  };

  const handleAirportClick = (airport: AirportData) => {
    onAirportSelect(airport);
    setSearchQuery('');
    setSearchResults([]);
    setRegionAirports([]);
    setSelectedRegion('');
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedRegion) {
      handleRegionChange(selectedRegion);
    }
  }, [selectedRegion]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plane className="h-5 w-5 text-aviation-blue" />
          <span>Selecionar Aeroporto</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Buscar</span>
            </TabsTrigger>
            <TabsTrigger value="region" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Por Região</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Populares</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar aeroporto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome da cidade ou aeroporto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-aviation-blue"></div>
                  </div>
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <Label className="text-sm text-gray-600">
                  Resultados ({searchResults.length})
                </Label>
                {searchResults.map((airport) => (
                  <div
                    key={airport.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleAirportClick(airport)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{airport.name}</div>
                        <div className="text-sm text-gray-600">
                          {airport.city}, {airport.country_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {airport.iata_code}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {airport.icao_code}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="region" className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar região</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma região..." />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.code} value={region.code}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoadingRegion && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-blue"></div>
                <span className="ml-2 text-gray-600">Carregando aeroportos...</span>
              </div>
            )}

            {regionAirports.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <Label className="text-sm text-gray-600">
                  Aeroportos da região ({regionAirports.length})
                </Label>
                {regionAirports.map((airport) => (
                  <div
                    key={airport.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleAirportClick(airport)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{airport.name}</div>
                        <div className="text-sm text-gray-600">
                          {airport.city}, {airport.country_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {airport.iata_code}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {airport.icao_code}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <div className="space-y-2">
              <Label>Aeroportos populares no Brasil</Label>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {popularAirports.map((airport) => (
                <div
                  key={airport.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAirportClick(airport)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{airport.name}</div>
                      <div className="text-sm text-gray-600">
                        {airport.city}, {airport.region_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {airport.iata_code}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {airport.icao_code}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {selectedAirport && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-green-800">{selectedAirport.name}</div>
                <div className="text-sm text-green-600">
                  {selectedAirport.city}, {selectedAirport.country_name}
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-green-600 text-white">
                  {selectedAirport.iata_code}
                </Badge>
                <div className="text-xs text-green-600 mt-1">
                  {selectedAirport.icao_code}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AirportSelector; 
