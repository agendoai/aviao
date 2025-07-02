
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Plane } from 'lucide-react';

interface BookingStep {
  step: number;
  title: string;
  completed: boolean;
}

interface BookingProgressProps {
  steps: BookingStep[];
  currentStep: number;
}

const BookingProgress: React.FC<BookingProgressProps> = ({ steps, currentStep }) => {
  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plane className="h-6 w-6 text-aviation-blue" />
          <span>Reserva de Voo - Assistente Conversacional</span>
        </CardTitle>
        <CardDescription>
          Siga o passo a passo para criar sua reserva
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-center space-x-2 flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step.completed 
                  ? 'bg-green-500 text-white' 
                  : currentStep === step.step 
                    ? 'bg-aviation-blue text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step.completed ? <CheckCircle className="h-4 w-4" /> : step.step}
              </div>
              <span className={`text-xs whitespace-nowrap ${currentStep === step.step ? 'font-medium' : ''}`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingProgress;
