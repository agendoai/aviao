
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Users, Clock, DollarSign } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface AircraftSelectorProps {
  onAircraftSelect: (aircraft: Aircraft) => void;
  selectedAircraftId?: string;
}

const AircraftSelector: React.FC<AircraftSelectorProps> = ({
  onAircraftSelect,
  selectedAircraftId
}) => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAircraft();
  }, []);

  const fetchAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .eq('status', 'available')
        .order('name');
      
      if (error) throw error;
      if (data) {
        setAircraftList(data);
      }
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Selecione a Aeronave</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aircraftList.map((aircraft) => (
          <Card 
            key={aircraft.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedAircraftId === aircraft.id 
                ? 'ring-2 ring-aviation-blue bg-blue-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onAircraftSelect(aircraft)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-aviation-blue" />
                  <span>{aircraft.name}</span>
                </CardTitle>
                <Badge variant="outline" className="text-aviation-blue border-aviation-blue">
                  {aircraft.model}
                </Badge>
              </div>
              <CardDescription>{aircraft.registration}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Miniatura da aeronave */}
              <div className="h-24 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                <Plane className="h-12 w-12 text-aviation-blue opacity-60" />
              </div>
              
              {/* Especificações */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{aircraft.max_passengers} assentos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>R$ {aircraft.hourly_rate.toFixed(0)}/h</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>6h autonomia</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {aircraft.status === 'available' ? 'Disponível' : 'Indisponível'}
                  </Badge>
                </div>
              </div>

              <Button 
                variant={selectedAircraftId === aircraft.id ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onAircraftSelect(aircraft);
                }}
              >
                {selectedAircraftId === aircraft.id ? 'Selecionada' : 'Selecionar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AircraftSelector;
