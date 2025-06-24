
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plane, Clock, MapPin, Moon, DollarSign } from 'lucide-react';

interface RouteSegment {
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
  segments: RouteSegment[];
  totalCost: number;
  totalFlightTime: number;
  overnightFee?: number;
  overnightCount?: number;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({
  segments,
  totalCost,
  totalFlightTime,
  overnightFee = 0,
  overnightCount = 0
}) => {
  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Breakdown de Custos</span>
        </CardTitle>
        <CardDescription>
          Detalhamento completo dos custos da sua viagem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{totalFlightTime}h</div>
            <div className="text-sm text-blue-700">Tempo Total de Voo</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{segments.length}</div>
            <div className="text-sm text-green-700">Segmentos de Voo</div>
          </div>
          {overnightCount > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <Moon className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-600">{overnightCount}</div>
              <div className="text-sm text-amber-700">Noite(s) de Pernoite</div>
            </div>
          )}
        </div>

        {/* Detalhes por Segmento */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Detalhamento por Segmento:</h4>
          {segments.map((segment, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{segment.from}</span>
                    <Plane className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{segment.to}</span>
                  </div>
                  {segment.hasOvernight && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      <Moon className="h-3 w-3 mr-1" />
                      Pernoite
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold">R$ {segment.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{segment.flightTime}h de voo</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Horas de voo:</span>
                  <div className="font-medium">R$ {segment.flightCost.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Taxas aeroporto:</span>
                  <div className="font-medium">R$ {segment.airportFees.toFixed(2)}</div>
                </div>
                {segment.overnightCost > 0 && (
                  <div>
                    <span className="text-gray-600">Taxa pernoite:</span>
                    <div className="font-medium text-amber-600">R$ {segment.overnightCost.toFixed(2)}</div>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Subtotal:</span>
                  <div className="font-bold">R$ {segment.total.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Resumo Final */}
        <div className="space-y-3">
          <h4 className="font-medium text-lg">Resumo Final:</h4>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Custo base dos voos:</span>
                <span>R$ {(totalCost - overnightFee).toFixed(2)}</span>
              </div>
              {overnightFee > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Taxa de pernoite ({overnightCount} noite{overnightCount > 1 ? 's' : ''}):</span>
                  <span>R$ {overnightFee.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Geral:</span>
                <span className="text-aviation-blue">R$ {totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">Informações Importantes:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• A aeronave ficará bloqueada por 3h adicionais após o retorno para manutenção</li>
            <li>• Pagamento com cartão de crédito tem acréscimo de 2%</li>
            {overnightCount > 0 && (
              <li>• Taxa de pernoite aplicada automaticamente quando o retorno ultrapassa meia-noite</li>
            )}
            <li>• Custos incluem todas as taxas aeroportuárias previstas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdown;
