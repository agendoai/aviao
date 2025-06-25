
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plane, Clock, MapPin, Moon, DollarSign, Building2, Fuel, Users } from 'lucide-react';

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
  // Calcular totais de custos aeroportuários
  const calculateAirportCosts = () => {
    const totalAirportFees = segments.reduce((sum, segment) => sum + segment.airportFees, 0);
    const landingFees = totalAirportFees * 0.4; // 40% das taxas são de pouso
    const handlingFees = totalAirportFees * 0.3; // 30% são de handling
    const fuelFees = totalAirportFees * 0.2; // 20% são de combustível
    const parkingFees = totalAirportFees * 0.1; // 10% são de estacionamento
    
    return {
      total: totalAirportFees,
      landing: landingFees,
      handling: handlingFees,
      fuel: fuelFees,
      parking: parkingFees,
      segmentCount: segments.length
    };
  };

  const airportCosts = calculateAirportCosts();

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

        {/* Dashboard de Custos Aeroportuários */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Building2 className="h-5 w-5" />
              <span>Dashboard de Custos Aeroportuários</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Análise detalhada das taxas aeroportuárias por categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo Total de Custos Aeroportuários */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg text-blue-800">Total de Taxas Aeroportuárias</h4>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {airportCosts.total.toFixed(2)}
                </div>
              </div>
              <p className="text-sm text-blue-600">
                Distribuído entre {airportCosts.segmentCount} segmento{airportCosts.segmentCount > 1 ? 's' : ''} de voo
              </p>
            </div>

            {/* Breakdown por Categoria */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                <Plane className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-orange-600">
                  R$ {airportCosts.landing.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Taxas de Pouso</div>
                <div className="text-xs text-orange-500 font-medium">40% do total</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-600">
                  R$ {airportCosts.handling.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Handling</div>
                <div className="text-xs text-purple-500 font-medium">30% do total</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                <Fuel className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-600">
                  R$ {airportCosts.fuel.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Combustível</div>
                <div className="text-xs text-green-500 font-medium">20% do total</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-red-600">
                  R$ {airportCosts.parking.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Estacionamento</div>
                <div className="text-xs text-red-500 font-medium">10% do total</div>
              </div>
            </div>

            {/* Detalhamento por Aeroporto */}
            <div className="space-y-3">
              <h5 className="font-medium text-blue-800">Custos por Aeroporto:</h5>
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-800">{segment.to}</p>
                        <p className="text-sm text-gray-600">
                          Pouso: R$ {(segment.airportFees * 0.4).toFixed(2)} | 
                          Handling: R$ {(segment.airportFees * 0.3).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">R$ {segment.airportFees.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">taxas totais</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
              <h6 className="font-medium text-blue-800 mb-2">Composição das Taxas Aeroportuárias:</h6>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Taxas de Pouso (40%):</strong> Cobradas pelo uso da pista de pouso</li>
                <li>• <strong>Handling (30%):</strong> Serviços de solo e apoio à aeronave</li>
                <li>• <strong>Combustível (20%):</strong> Taxas sobre abastecimento</li>
                <li>• <strong>Estacionamento (10%):</strong> Taxas de permanência no pátio</li>
              </ul>
            </div>
          </CardContent>
        </Card>

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
            <li>• Taxas aeroportuárias variam conforme o tipo e porte do aeroporto</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdown;
