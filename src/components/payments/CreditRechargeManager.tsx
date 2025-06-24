
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CreditCard } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethod {
  id: string;
  type: string;
  card_number_last_four?: string;
  card_brand?: string;
  pix_key?: string;
  is_default: boolean;
}

const CreditRechargeManager: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchPaymentMethods();
    }
  }, [profile?.id]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
      
      // Selecionar método padrão automaticamente
      const defaultMethod = data?.find(method => method.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      toast({
        title: "Erro",
        description: "Valor inválido para recarga",
        variant: "destructive"
      });
      return;
    }

    if (!selectedPaymentMethod) {
      toast({
        title: "Erro",
        description: "Selecione um método de pagamento",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      const amount = parseFloat(rechargeAmount);
      const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod);
      
      // Chamar função do banco para processar recarga
      const { data, error } = await supabase.rpc('process_credit_recharge', {
        p_amount: amount,
        p_payment_method_id: selectedPaymentMethod,
        p_payment_method_type: selectedMethod?.type || 'unknown',
        p_external_payment_id: `recharge_${Date.now()}`
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Atualizar perfil com novo saldo
      if (profile) {
        await updateProfile({ balance: data.new_balance });
      }

      toast({
        title: "Sucesso",
        description: `Recarga de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} realizada com sucesso`
      });

      setRechargeAmount('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar recarga",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method.type) {
      case 'credit_card':
        return `${method.card_brand} •••• ${method.card_number_last_four}`;
      case 'debit_card':
        return `${method.card_brand} •••• ${method.card_number_last_four}`;
      case 'pix':
        return `PIX: ${method.pix_key}`;
      case 'bank_transfer':
        return 'Transferência Bancária';
      default:
        return 'Método não identificado';
    }
  };

  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle>Recarga de Saldo</CardTitle>
        <CardDescription>
          Adicione saldo à sua conta para realizar reservas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor da Recarga (R$)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0,00"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              min="1"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de Pagamento</Label>
            <Select 
              value={selectedPaymentMethod} 
              onValueChange={setSelectedPaymentMethod}
              disabled={paymentMethods.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  paymentMethods.length === 0 
                    ? "Nenhum método cadastrado" 
                    : "Selecione o método"
                } />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {getPaymentMethodLabel(method)}
                    {method.is_default && " (Padrão)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={handleRecharge} 
              className="w-full bg-aviation-gradient hover:opacity-90"
              disabled={processing || paymentMethods.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              {processing ? 'Processando...' : 'Recarregar'}
            </Button>
          </div>
        </div>
        
        {/* Quick Recharge Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Valores rápidos:</span>
          {[1000, 2500, 5000, 10000].map((value) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              onClick={() => setRechargeAmount(value.toString())}
            >
              R$ {value.toLocaleString('pt-BR')}
            </Button>
          ))}
        </div>

        {paymentMethods.length === 0 && (
          <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
            <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              Adicione um método de pagamento para realizar recargas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditRechargeManager;
