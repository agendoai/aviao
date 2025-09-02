import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Users, Search } from 'lucide-react';

interface SharedFlightOptionsProps {
  onBack: () => void;
  onViewExisting: () => void;
  onCreateNew: () => void;
}

const SharedFlightOptions: React.FC<SharedFlightOptionsProps> = ({
  onBack,
  onViewExisting,
  onCreateNew
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voos Compartilhados</h2>
          <p className="text-gray-600">Escolha entre criar uma nova viagem ou participar de uma existente</p>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Criar Nova Viagem */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onCreateNew}>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-aviation-blue/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-aviation-blue" />
            </div>
            <CardTitle className="text-xl">Criar Nova Viagem</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Crie uma nova viagem compartilhada e disponibilize poltronas para outros usuários
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Você é o proprietário
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                • Defina rota e horários<br/>
                • Escolha quantas poltronas compartilhar<br/>
                • Gerencie sua missão
              </div>
            </div>
            <Button className="w-full bg-aviation-gradient hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Criar Viagem
            </Button>
          </CardContent>
        </Card>

        {/* Buscar Viagens Existentes */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewExisting}>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-aviation-blue/10 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-aviation-blue" />
            </div>
            <CardTitle className="text-xl">Buscar Viagens</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Encontre viagens compartilhadas criadas por outros usuários
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Você é passageiro
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                • Veja viagens disponíveis<br/>
                • Reserve sua poltrona<br/>
                • Compartilhe custos
              </div>
            </div>
            <Button variant="outline" className="w-full border-aviation-blue text-aviation-blue hover:bg-aviation-blue hover:text-white">
              <Search className="h-4 w-4 mr-2" />
              Buscar Viagens
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Como funciona o compartilhamento?</h3>
            <p className="text-sm text-blue-700 mt-1">
              No compartilhamento, você pode criar uma viagem e disponibilizar poltronas para outros usuários, 
              ou participar de viagens criadas por outros. Os custos são divididos entre todos os participantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedFlightOptions;
