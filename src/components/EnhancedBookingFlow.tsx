
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle } from 'lucide-react';
import AircraftSelector from './AircraftSelector';
import AircraftSeatingChart from './AircraftSeatingChart';
import RouteBuilder from './RouteBuilder';
import CostBreakdown from './CostBreakdown';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface RouteStop {
  id: string;
  destination: string;
  arrivalTime: string;
  departureTime: string;
  stayDuration: number;
}

const EnhancedBookingFlow: React.FC = () => {
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [costCalculation, setCostCalculation] = useState<any>(null);

  const steps = [
    { id: 'aircraft', title: 'Aeronave', description: 'Selecione a aeronave' },
    { id: 'seats', title: 'Assentos', description: 'Escolha os assentos' },
    { id: 'route', title: 'Rota', description: 'Defina o itinerário' },
    { id: 'costs', title: 'Custos', description: 'Revisar valores' },
    { id: 'confirm', title: 'Confirmar', description: 'Finalizar reserva' }
  ];

  const handleAircraftSelect = (aircraft: Aircraft) => {
    setSelectedAircraft(aircraft);
    if (currentStep === 0) {
      setCurrentStep(1);
    }
  };

  const handleSeatSelect = (seatNumber: number) => {
    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatNumber);
      if (isSelected) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleRouteChange = (newRoute: RouteStop[]) => {
    setRoute(newRoute);
  };

  const handleCostCalculation = (costs: any) => {
    setCostCalculation(costs);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: return selectedAircraft !== null;
      case 1: return selectedSeats.length > 0;
      case 2: return route.length > 0;
      case 3: return costCalculation !== null;
      default: return true;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmBooking = () => {
    toast({
      title: "Reserva Criada!",
      description: "Sua reserva foi criada com sucesso. Aguarde a confirmação.",
    });
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-aviation-blue">
            Sistema de Reserva Aprimorado
          </CardTitle>
          <CardDescription className="text-lg">
            Fluxo completo com seleção de aeronave, assentos e cálculo automático
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-sm">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center space-y-1 ${
                    index <= currentStep ? 'text-aviation-blue' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < currentStep 
                      ? 'bg-green-500 text-white' 
                      : index === currentStep 
                        ? 'bg-aviation-blue text-white' 
                        : 'bg-gray-200'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="font-medium">{step.title}</span>
                  <span className="text-xs">{step.description}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo da etapa atual */}
      <div className="space-y-6">
        {currentStep === 0 && (
          <AircraftSelector
            onAircraftSelect={handleAircraftSelect}
            selectedAircraftId={selectedAircraft?.id}
          />
        )}

        {currentStep === 1 && selectedAircraft && (
          <AircraftSeatingChart
            aircraft={selectedAircraft}
            onSeatSelect={handleSeatSelect}
            selectedSeats={selectedSeats}
          />
        )}

        {currentStep === 2 && (
          <RouteBuilder
            baseLocation="Araçatuba (ABC)"
            onRouteChange={handleRouteChange}
            onCostCalculation={handleCostCalculation}
          />
        )}

        {currentStep === 3 && costCalculation && (
          <CostBreakdown
            segments={costCalculation.segments}
            totalCost={costCalculation.totalCost}
            totalFlightTime={costCalculation.totalFlightTime}
          />
        )}

        {currentStep === 4 && (
          <Card className="aviation-card">
            <CardHeader>
              <CardTitle>Confirmar Reserva</CardTitle>
              <CardDescription>
                Revise todos os detalhes antes de confirmar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resumo da reserva */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Aeronave Selecionada:</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium">{selectedAircraft?.name}</p>
                    <p className="text-sm text-gray-600">{selectedAircraft?.model} - {selectedAircraft?.registration}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Assentos Selecionados:</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium">{selectedSeats.join(', ')}</p>
                    <p className="text-sm text-gray-600">{selectedSeats.length} passageiro(s)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Rota:</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium">
                      Araçatuba → {route.map(r => r.destination).join(' → ')} → Araçatuba
                    </p>
                    <p className="text-sm text-gray-600">{route.length + 1} trecho(s)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Custo Total:</h4>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      R$ {costCalculation?.totalCost.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {costCalculation?.totalFlightTime}h de voo
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConfirmBooking}
                className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
              >
                Confirmar Reserva
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navegação */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Anterior
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className="bg-aviation-gradient hover:opacity-90"
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default EnhancedBookingFlow;
