
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, DollarSign, Moon, Plane, Home } from 'lucide-react';

interface CostSegment {
  from: string;
  to: string;
  flightTime: number;
  flightCost: number;
  airportFees: number;
  distance: number;
  overnightCost: number;
  hasOvernight: boolean;
  total: number;
  estimatedArrival?: string;
  estimatedArrivalDate?: string;
  isReturnToBase?: boolean;
}

interface CostBreakdownProps {
  segments: CostSegment[];
  totalCost: number;
  totalFlightTime: number;
  overnightFee: number;
  overnightCount: number;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({
  segments,
  totalCost,
  totalFlightTime,
  overnightFee,
  overnightCount
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  };

  const baseCost = totalCost - overnightFee;

  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Detalhamento de Custos</span>
        </CardTitle>
        <CardDescription>
          Breakdown completo dos custos da missão com retorno obrigatório à base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Tempo Total de Voo</p>
            <p className="text-xl font-bold text-blue-600">{formatTime(totalFlightTime)}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <MapPin className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-gray-600">Segmentos de Voo</p>
            <p className="text-xl font-bold text-green-600">{segments.length}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">Custo Total</p>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(totalCost)}</p>
          </div>
        </div>

        {/* Detalhamento por Segmento */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Detalhamento por Trecho:</h4>
          
          {segments.map((segment, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${
              segment.isReturnToBase 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {segment.isReturnToBase ? (
                    <Home className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Plane className="h-5 w-5 text-blue-600" />
                  )}
                  <h5 className="font-medium">
                    {segment.from} → {segment.to}
                    {segment.isReturnToBase && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                        RETORNO OBRIGATÓRIO
                      </Badge>
                    )}
                  </h5>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(segment.total)}</p>
                  {segment.estimatedArrival && (
                    <p className="text-sm text-gray-600">
                      Chegada: {segment.estimatedArrivalDate && new Date(segment.estimatedArrivalDate).toLocaleDateString('pt-BR')} {segment.estimatedArrival}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Distância:</span>
                  <div className="font-medium">{segment.distance.toFixed(1)} NM</div>
                </div>
                <div>
                  <span className="text-gray-600">Tempo de Voo:</span>
                  <div className="font-medium">{formatTime(segment.flightTime)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Custo de Voo:</span>
                  <div className="font-medium">{formatCurrency(segment.flightCost)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Taxa Aeroportuária:</span>
                  <div className="font-medium">{formatCurrency(segment.airportFees)}</div>
                </div>
              </div>
              
              {segment.hasOvernight && (
                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <Moon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Pernoite incluída: {formatCurrency(segment.overnightCost)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Resumo Financeiro */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Resumo Financeiro:</h4>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Custo base dos voos:</span>
              <span className="font-medium">{formatCurrency(baseCost)}</span>
            </div>
            
            {overnightFee > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Taxa de pernoite ({overnightCount} dia{overnightCount > 1 ? 's' : ''}):</span>
                <span className="font-medium">{formatCurrency(overnightFee)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL GERAL:</span>
              <span className="text-green-600">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium mb-2 text-blue-800">Informações Importantes:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Taxa horária de voo: R$ 5.000,00/hora</li>
            <li>• Taxas aeroportuárias incluídas em cada trecho</li>
            <li>• Retorno à base é obrigatório e está incluído no cálculo</li>
            {overnightCount > 0 && (
              <li>• Taxa de pernoite: R$ 1.500,00 por dia</li>
            )}
            <li>• Custos de combustível e manutenção incluídos na taxa horária</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdown;
