
import React from 'react';
import { CreditCard, CheckCircle, Clock, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreReservationData {
  pre_reservation_id: string;
  priority_position: number;
  expires_at: string;
  can_confirm_immediately: boolean;
  overnight_stays: number;
  overnight_fee: number;
  final_cost: number;
}

interface PaymentStepProps {
  preReservationData: PreReservationData;
  selectedPaymentMethod: 'balance' | 'card';
  userBalance?: number;
  aircraftHourlyRate?: number;
  isProcessing: boolean;
  onPaymentMethodChange: (method: 'balance' | 'card') => void;
  onConfirmReservation: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  preReservationData,
  selectedPaymentMethod,
  userBalance = 0,
  aircraftHourlyRate = 0,
  isProcessing,
  onPaymentMethodChange,
  onConfirmReservation
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pagamento e Confirmação</h2>
        <p className="text-gray-600">
          Pré-reserva criada com sucesso!
        </p>
      </div>
      
      <div className="max-w-lg mx-auto space-y-6">
        {/* Priority Status */}
        <div className={`p-4 rounded-lg ${
          preReservationData.can_confirm_immediately 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {preReservationData.can_confirm_immediately ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-600" />
            )}
            <span className="font-medium">
              {preReservationData.can_confirm_immediately 
                ? 'Confirmação Imediata Disponível' 
                : 'Aguardando Confirmação'
              }
            </span>
          </div>
          
          <p className="text-sm text-gray-600">
            {preReservationData.can_confirm_immediately 
              ? 'Como você está em 1º lugar na fila de prioridades, pode confirmar imediatamente após o pagamento.'
              : `Posição #${preReservationData.priority_position} na fila. Sua reserva será confirmada automaticamente em 12 horas se ninguém com prioridade maior solicitar.`
            }
          </p>
          
          {!preReservationData.can_confirm_immediately && (
            <p className="text-xs text-gray-500 mt-2">
              Expira em: {new Date(preReservationData.expires_at).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Detalhes do Custo</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Voo (2.5h × R$ {aircraftHourlyRate})</span>
              <span>R$ {(aircraftHourlyRate * 2.5).toFixed(2)}</span>
            </div>
            {preReservationData.overnight_stays > 0 && (
              <div className="flex justify-between">
                <span>Pernoite ({preReservationData.overnight_stays} noite(s))</span>
                <span>R$ {preReservationData.overnight_fee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span>R$ {preReservationData.final_cost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <h4 className="font-medium">Método de Pagamento</h4>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="balance"
                checked={selectedPaymentMethod === 'balance'}
                onChange={() => onPaymentMethodChange('balance')}
                className="w-4 h-4 text-blue-600"
              />
              <Wallet className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <div className="font-medium">Saldo em Conta</div>
                <div className="text-sm text-gray-600">
                  Disponível: R$ {userBalance.toFixed(2)}
                </div>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={selectedPaymentMethod === 'card'}
                onChange={() => onPaymentMethodChange('card')}
                className="w-4 h-4 text-blue-600"
              />
              <CreditCard className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <div className="font-medium">Cartão de Crédito</div>
                <div className="text-sm text-gray-600">
                  + 2% taxa (R$ {(preReservationData.final_cost * 0.02).toFixed(2)})
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Confirm Button */}
        <Button 
          onClick={onConfirmReservation}
          className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
          disabled={isProcessing || (selectedPaymentMethod === 'balance' && userBalance < preReservationData.final_cost)}
        >
          {isProcessing ? 'Processando...' : 
           preReservationData.can_confirm_immediately ? 
           '🎉 Confirmar Reserva Imediatamente' : 
           '⏰ Aguardar Confirmação (12h)'}
        </Button>

        {selectedPaymentMethod === 'balance' && userBalance < preReservationData.final_cost && (
          <p className="text-red-600 text-sm text-center">
            Saldo insuficiente. Recarregue sua conta ou escolha outro método de pagamento.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentStep;
