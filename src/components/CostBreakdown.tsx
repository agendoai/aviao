
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Clock, MapPin, Moon } from 'lucide-react';

interface CostSegment {
  from: string;
  to: string;
  flightTime: number;
  flightCost: number;
  airportFees: number;
  overnightCost: number;
  hasOvernight: boolean;
  total: number;
}

interface CostBreakdownProps {
  segments: CostSegment[];
  totalCost: number;
  totalFlightTime: number;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({
  segments,
  totalCost,
  totalFlightTime
}) => {
  if (!segments || segments.length === 0) {
    return (
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Resumo Financeiro</span>
          </CardTitle>
          <CardDescription>
            Defina uma rota para ver o cálculo de custos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Adicione destinos à rota para calcular os custos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Resumo Financeiro</span>
        </CardTitle>
        <CardDescription>
          Detalhamento de custos por trecho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo geral */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-aviation-blue">
              R$ {totalCost.toLocaleString('pt-BR')}
            </div>
            <p className="text-sm text-gray-600">Custo Total</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-aviation-blue">
              {totalFlightTime}h
            </div>
            <p className="text-sm text-gray-600">Horas de Voo</p>
          </div>
        </div>

        <Separator />

        {/* Detalhamento por trecho */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Custos por Trecho:</h4>
          
          {segments.map((segment, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <h5 className="font-medium">
                    {segment.from} → {segment.to}
                  </h5>
                </div>
                <div className="text-lg font-bold">
                  R$ {segment.total.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Horas de voo:</span>
                  </div>
                  <span className="font-medium">
                    {segment.flightTime}h × R$ 5.000 = R$ {segment.flightCost.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>Taxas aeroporto:</span>
                  </div>
                  <span className="font-medium">
                    R$ {segment.airportFees.toLocaleString('pt-BR')}
                  </span>
                </div>

                {segment.hasOvernight && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4 text-amber-500" />
                      <span>Pernoite:</span>
                    </div>
                    <span className="font-medium text-amber-600">
                      R$ {segment.overnightCost.toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {segment.hasOvernight && (
                <div className="bg-amber-50 p-2 rounded text-sm text-amber-700">
                  <Moon className="h-4 w-4 inline mr-1" />
                  Pernoite detectado - cobrança automática da diária
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Total consolidado */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>CUSTO TOTAL DA MISSÃO:</span>
            <span className="text-aviation-blue">
              R$ {totalCost.toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Incluindo todos os trechos, taxas e pernoites
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdown;
