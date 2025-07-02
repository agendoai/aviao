
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AircraftSeatingChart from '../AircraftSeatingChart';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface SeatSelectionStepProps {
  selectedAircraft: Aircraft;
  selectedSeats: number[];
  travelMode: 'solo' | 'shared';
  onSeatSelect: (seatNumber: number) => void;
  onTravelModeChange: (mode: 'solo' | 'shared') => void;
  onContinue: () => void;
}

const SeatSelectionStep: React.FC<SeatSelectionStepProps> = ({
  selectedAircraft,
  selectedSeats,
  travelMode,
  onSeatSelect,
  onTravelModeChange,
  onContinue
}) => {
  const { toast } = useToast();

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Selecione os assentos",
        description: "Por favor, selecione pelo menos um assento.",
        variant: "destructive"
      });
      return;
    }
    onContinue();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Selecione seus assentos</h2>
        <p className="text-gray-600">
          {selectedAircraft.name} - {selectedAircraft.model}
        </p>
        <Badge variant="outline" className="mt-2">
          Aeronave: {selectedAircraft.name}
        </Badge>
      </div>
      
      <AircraftSeatingChart
        aircraft={selectedAircraft}
        onSeatSelect={onSeatSelect}
        selectedSeats={selectedSeats}
        onTravelModeChange={onTravelModeChange}
        selectedTravelMode={travelMode}
      />
      
      <div className="text-center">
        <Button 
          onClick={handleContinue}
          className="bg-aviation-gradient hover:opacity-90 text-white text-lg py-3 px-8"
          disabled={selectedSeats.length === 0}
        >
          Continuar com Assentos Selecionados
        </Button>
      </div>
    </div>
  );
};

export default SeatSelectionStep;
