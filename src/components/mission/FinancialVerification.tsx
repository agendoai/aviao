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
  onConfirm,
  onPaymentOption
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const hasSufficientBalance = userBalance >= totalCost;

  const handleConfirm = async () => {
    if (!hasSufficientBalance) return;
    setIsProcessing(true);
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
        <CardContent>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Total a pagar: R$ {totalCost.toLocaleString('pt-BR')}</p>
            <p>• Seu saldo: R$ {userBalance.toLocaleString('pt-BR')}</p>
          </div>
        </CardContent>
      </Card>
      <div>
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
                <span>Confirmar Missão</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FinancialVerification;
