
import React from 'react';
import { Plane } from 'lucide-react';
import AircraftSelector from '../AircraftSelector';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface AircraftSelectionStepProps {
  selectedAircraft: Aircraft | null;
  onAircraftSelect: (aircraft: Aircraft) => void;
}

const AircraftSelectionStep: React.FC<AircraftSelectionStepProps> = ({
  selectedAircraft,
  onAircraftSelect
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Plane className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Selecione a aeronave</h2>
        <p className="text-gray-600">Escolha a aeronave para sua viagem</p>
      </div>
      
      <AircraftSelector 
        onAircraftSelect={onAircraftSelect}
        selectedAircraftId={selectedAircraft?.id}
      />
    </div>
  );
};

export default AircraftSelectionStep;
