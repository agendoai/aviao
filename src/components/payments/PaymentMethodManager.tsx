
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  card_number_last_four?: string;
  card_brand?: string;
  card_holder_name?: string;
  pix_key?: string;
  is_default: boolean;
  is_active: boolean;
}

const PaymentMethodManager: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'credit_card' as PaymentMethod['type'],
    cardNumber: '',
    cardBrand: '',
    cardHolderName: '',
    pixKey: '',
    isDefault: false
  });

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar métodos de pagamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const paymentMethodData = {
        user_id: profile?.id,
        type: formData.type,
        ...(formData.type === 'credit_card' || formData.type === 'debit_card' ? {
          card_number_last_four: formData.cardNumber.slice(-4),
          card_brand: formData.cardBrand,
          card_holder_name: formData.cardHolderName
        } : {}),
        ...(formData.type === 'pix' ? {
          pix_key: formData.pixKey
        } : {}),
        is_default: formData.isDefault || paymentMethods.length === 0
      };

      const { error } = await supabase
        .from('payment_methods')
        .insert(paymentMethodData);

      if (error) throw error;

      // Se for definido como padrão, remover padrão dos outros
      if (formData.isDefault) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', profile?.id)
          .neq('id', paymentMethodData);
      }

      toast({
        title: "Sucesso",
        description: "Método de pagamento adicionado com sucesso"
      });

      setIsDialogOpen(false);
      setFormData({
        type: 'credit_card',
        cardNumber: '',
        cardBrand: '',
        cardHolderName: '',
        pixKey: '',
        isDefault: false
      });
      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar método de pagamento",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Método de pagamento removido"
      });

      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover método de pagamento",
        variant: "destructive"
      });
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    return <CreditCard className="h-8 w-8 text-gray-400" />;
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

  const getPaymentMethodType = (type: string) => {
    switch (type) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'debit_card':
        return 'Cartão de Débito';
      case 'pix':
        return 'PIX';
      case 'bank_transfer':
        return 'Transferência Bancária';
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando métodos de pagamento...</div>;
  }

  return (
    <Card className="aviation-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>
              Gerencie seus cartões e formas de pagamento
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Método
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
                <DialogDescription>
                  Adicione um novo método de pagamento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Pagamento</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as PaymentMethod['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.type === 'credit_card' || formData.type === 'debit_card') && (
                  <>
                    <div className="space-y-2">
                      <Label>Número do Cartão</Label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bandeira</Label>
                      <Input
                        placeholder="Visa, Mastercard, etc."
                        value={formData.cardBrand}
                        onChange={(e) => setFormData({ ...formData, cardBrand: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome no Cartão</Label>
                      <Input
                        placeholder="Nome como aparece no cartão"
                        value={formData.cardHolderName}
                        onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                {formData.type === 'pix' && (
                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                      value={formData.pixKey}
                      onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <Label htmlFor="isDefault">Definir como padrão</Label>
                </div>

                <Button type="submit" className="w-full bg-aviation-gradient hover:opacity-90">
                  Adicionar Método
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getPaymentMethodIcon(method.type)}
                  <div>
                    <p className="font-medium">{getPaymentMethodLabel(method)}</p>
                    <p className="text-sm text-gray-600">
                      {getPaymentMethodType(method.type)}
                    </p>
                  </div>
                  {method.is_default && (
                    <Badge variant="outline">Padrão</Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhum método de pagamento cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodManager;
