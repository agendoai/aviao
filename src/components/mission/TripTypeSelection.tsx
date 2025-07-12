import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Plane } from 'lucide-react';

interface TripTypeSelectionProps {
  onSelectType: (type: 'solo' | 'shared') => void;
}

const TripTypeSelection: React.FC<TripTypeSelectionProps> = ({ onSelectType }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tipo de Viagem</h2>
        <p className="text-gray-600">Escolha como deseja realizar sua missão</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Viagem Solo */}
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-aviation-blue">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-aviation-blue/10 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="h-8 w-8 text-aviation-blue" />
            </div>
            <CardTitle className="text-xl">Viagem Solo</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Reserve uma aeronave completa para você e seus acompanhantes
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Aeronave exclusiva</li>
              <li>• Escolha livre de horários</li>
              <li>• Flexibilidade total no roteiro</li>
            </ul>
            <Button 
              className="w-full bg-aviation-gradient hover:opacity-90"
              onClick={() => onSelectType('solo')}
            >
              Selecionar Viagem Solo
            </Button>
          </CardContent>
        </Card>

        {/* Viagem Compartilhada */}
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-aviation-blue">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-aviation-blue/10 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-aviation-blue" />
            </div>
            <CardTitle className="text-xl">Viagem Compartilhada</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Compartilhe voos com outros membros e reduza custos
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Custo reduzido</li>
              <li>• Aproveite voos existentes</li>
              <li>• Conhece outros membros</li>
            </ul>
            <Button 
              variant="outline"
              className="w-full border-aviation-blue text-aviation-blue hover:bg-aviation-blue hover:text-white"
              onClick={() => onSelectType('shared')}
            >
              Ver Voos Compartilhados
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TripTypeSelection;