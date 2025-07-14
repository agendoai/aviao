
import React from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DestinationStepProps {
  destination: string;
  selectedAircraftName?: string;
  travelMode: 'solo' | 'shared';
  onDestinationChange: (destination: string) => void;
  onContinue: () => void;
}

const DestinationStep: React.FC<DestinationStepProps> = ({
  destination,
  selectedAircraftName,
  travelMode,
  onDestinationChange,
  onContinue
}) => {
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!destination.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite seu destino.",
        variant: "destructive"
      });
      return;
    }
    onContinue();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Qual seu destino?</h2>
        <p className="text-gray-600">Ex: Paris, Nova York, Londres</p>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {selectedAircraftName && (
            <Badge variant="outline">
              Aeronave: {selectedAircraftName}
            </Badge>
          )}
          <Badge variant="outline">
            Modo: {travelMode === 'solo' ? 'Individual' : 'Compartilhado'}
          </Badge>
        </div>
      </div>
      <div className="max-w-md mx-auto space-y-4">
        <Input
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          placeholder="Digite o destino..."
          className="text-lg p-4"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button 
          onClick={handleSubmit}
          className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default DestinationStep;
