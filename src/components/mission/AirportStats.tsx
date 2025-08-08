import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, MapPin, Globe } from 'lucide-react';
import { getAirportsByRegion } from '@/utils/airport-search';

interface AirportStatsProps {
  className?: string;
}

const AirportStats: React.FC<AirportStatsProps> = ({ className }) => {
  const regions = [
    { id: 'sudeste', name: 'Sudeste', color: 'bg-blue-500', states: ['SP', 'RJ', 'MG', 'ES'] },
    { id: 'sul', name: 'Sul', color: 'bg-green-500', states: ['PR', 'RS', 'SC'] },
    { id: 'centro-oeste', name: 'Centro-Oeste', color: 'bg-yellow-500', states: ['DF', 'GO', 'MT', 'MS'] },
    { id: 'nordeste', name: 'Nordeste', color: 'bg-red-500', states: ['BA', 'PE', 'CE', 'MA', 'PB', 'PI', 'RN', 'SE', 'AL'] },
    { id: 'norte', name: 'Norte', color: 'bg-purple-500', states: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'] }
  ];

  const getAirportCount = (regionId: string) => {
    return getAirportsByRegion(regionId).length;
  };

  const totalAirports = regions.reduce((total, region) => total + getAirportCount(region.id), 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-sky-600" />
          <span>Aeroportos por Região</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total */}
          <div className="text-center p-4 bg-sky-50 rounded-lg">
            <div className="text-2xl font-bold text-sky-600">{totalAirports}</div>
            <div className="text-sm text-sky-600">Aeroportos Disponíveis</div>
          </div>

          {/* Por Região */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {regions.map((region) => {
              const count = getAirportCount(region.id);
              return (
                <div key={region.id} className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{region.name}</div>
                      <div className="text-sm text-gray-600">{count} aeroportos</div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${region.color.replace('bg-', 'border-')} ${region.color.replace('bg-', 'text-')}`}
                    >
                      <Plane className="h-3 w-3 mr-1" />
                      {count}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Principais Aeroportos */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Principais Aeroportos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { icao: 'SBGR', name: 'Guarulhos', city: 'São Paulo' },
                { icao: 'SBRJ', name: 'Santos Dumont', city: 'Rio de Janeiro' },
                { icao: 'SBBR', name: 'Brasília', city: 'Brasília' },
                { icao: 'SBPA', name: 'Salgado Filho', city: 'Porto Alegre' },
                { icao: 'SBFL', name: 'Hercílio Luz', city: 'Florianópolis' },
                { icao: 'SBSV', name: 'Salvador', city: 'Salvador' }
              ].map((airport) => (
                <div key={airport.icao} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <MapPin className="h-3 w-3 text-sky-500" />
                  <span className="text-sm font-medium">{airport.icao}</span>
                  <span className="text-xs text-gray-600">- {airport.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AirportStats; 