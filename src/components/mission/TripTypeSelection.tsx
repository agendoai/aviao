import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Plane } from 'lucide-react';

interface TripTypeSelectionProps {
  onSelect: (type: 'solo' | 'shared-missions') => void;
}

const TripTypeSelection: React.FC<TripTypeSelectionProps> = ({ onSelect }) => {
  const handleSoloClick = () => {
    // console.log('🎯 Clicou em Viagem Solo');
    onSelect('solo');
  };



  const handleSharedMissionsClick = () => {
    // console.log('🎯 Clicou em Missões Compartilhadas');
    onSelect('shared-missions');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tipo de Viagem</h2>
        <p className="text-gray-600">Escolha como deseja realizar sua missão</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Viagem Solo */}
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-sky-500">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="h-8 w-8 text-sky-500" />
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
              className="w-full bg-sky-500 hover:bg-sky-600 text-white"
              onClick={handleSoloClick}
            >
              Selecionar Viagem Solo
            </Button>
          </CardContent>
        </Card>



        {/* Missões Compartilhadas */}
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-green-500">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <Plane className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-xl">Missões Compartilhadas</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Crie ou participe de missões compartilhadas organizadas
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Crie suas próprias missões</li>
              <li>• Participe de missões existentes</li>
              <li>• Economia e networking</li>
            </ul>
            <Button 
              variant="outline"
              className="w-full border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
              onClick={handleSharedMissionsClick}
            >
              Gerenciar Missões
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TripTypeSelection;
