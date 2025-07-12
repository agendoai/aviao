import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Wallet, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface FinancialVerificationProps {
  totalCost: number;
  userBalance: number;
  userPriority: number;
  onConfirm: () => void;
  onPaymentOption: (method: 'pix' | 'transfer') => void;
}

const FinancialVerification: React.FC<FinancialVerificationProps> = ({
  totalCost,
  userBalance,
  userPriority,
  onConfirm,
  onPaymentOption
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const hasSufficientBalance = userBalance >= totalCost;
  const isPriorityOne = userPriority === 1;

  const handleConfirm = async () => {
    if (!hasSufficientBalance) return;
    
    setIsProcessing(true);
    
    // Simular processamento
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-aviation-blue" />
            <span>Verificação Financeira</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Saldo Disponível</div>
              <div className="text-2xl font-bold text-gray-900">
                R$ {userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Custo Total da Missão</div>
              <div className="text-2xl font-bold text-aviation-blue">
                R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {!hasSufficientBalance && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Saldo insuficiente. Necessário recarregar R$ {(totalCost - userBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </AlertDescription>
            </Alert>
          )}

          {hasSufficientBalance && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Saldo suficiente para realizar a missão
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Badge variant="outline" className="text-aviation-blue border-aviation-blue">
              Posição #{userPriority}
            </Badge>
            <span>Sistema de Prioridade (100 Cotas)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPriorityOne ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Confirmação Imediata!</strong> Como membro #1, sua reserva será confirmada instantaneamente.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-200 bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Período de Espera:</strong> Sua pré-reserva entrará em período de 12h. 
                Membros com prioridade superior (posições 1-{userPriority - 1}) serão notificados.
                Se nenhum deles reservar, sua missão será confirmada automaticamente.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Total de membros: 100 cotas</p>
            <p>• Sua posição atual: #{userPriority}</p>
            <p>• Membros com prioridade superior: {userPriority - 1}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        {!hasSufficientBalance ? (
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onPaymentOption('pix')}
              className="flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Recarregar via PIX</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onPaymentOption('transfer')}
              className="flex items-center space-x-2"
            >
              <Wallet className="h-4 w-4" />
              <span>Transferência</span>
            </Button>
          </div>
        ) : (
          <Button 
            className="bg-aviation-gradient hover:opacity-90 flex items-center space-x-2"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>{isPriorityOne ? 'Confirmar Missão' : 'Criar Pré-Reserva'}</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FinancialVerification;