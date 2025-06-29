
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreditCard, Plus, Trash2, Edit3, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type PaymentMethod = Tables<'payment_methods'>;

const PaymentMethodManager: React.FC = () => {
  const { profile } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newCard, setNewCard] = useState({
    type: 'credit_card',
    card_holder_name: '',
    card_number_last_four: '',
    card_brand: 'visa',
    is_default: false
  });
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        .eq('user_id', profile?.id);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      toast.error("Erro ao carregar métodos de pagamento");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewCard(prev => ({ ...prev, [id]: value }));
  };

  const addPaymentMethod = async () => {
    try {
      // Basic validation
      if (!newCard.card_holder_name || !newCard.card_number_last_four) {
        toast.error("Preencha todos os campos do cartão.");
        return;
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: profile?.id,
          type: newCard.type,
          card_holder_name: newCard.card_holder_name,
          card_number_last_four: newCard.card_number_last_four,
          card_brand: newCard.card_brand,
          is_default: newCard.is_default
        })
        .select();

      if (error) throw error;

      setNewCard({
        type: 'credit_card',
        card_holder_name: '',
        card_number_last_four: '',
        card_brand: 'visa',
        is_default: false
      });
      await fetchPaymentMethods();

      toast.success("Cartão adicionado com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar método de pagamento");
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPaymentMethods();

      toast.success("Cartão removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover método de pagamento");
    }
  };

  const startEdit = (card: PaymentMethod) => {
    setEditingCardId(card.id);
    setNewCard({
      type: card.type,
      card_holder_name: card.card_holder_name || '',
      card_number_last_four: card.card_number_last_four || '',
      card_brand: card.card_brand || 'visa',
      is_default: card.is_default || false
    });
  };

  const cancelEdit = () => {
    setEditingCardId(null);
    setNewCard({
      type: 'credit_card',
      card_holder_name: '',
      card_number_last_four: '',
      card_brand: 'visa',
      is_default: false
    });
  };

  const updatePaymentMethod = async () => {
    if (!editingCardId) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .update({
          type: newCard.type,
          card_holder_name: newCard.card_holder_name,
          card_number_last_four: newCard.card_number_last_four,
          card_brand: newCard.card_brand,
          is_default: newCard.is_default
        })
        .eq('id', editingCardId)
        .select();

      if (error) throw error;

      await fetchPaymentMethods();
      cancelEdit();

      toast.success("Cartão atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar método de pagamento");
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
              Gerencie seus cartões de crédito
            </CardDescription>
          </div>
          <Badge variant="secondary">
            <Shield className="h-4 w-4 mr-2" />
            Seguro e criptografado
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-6">
            <CreditCard className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Nenhum cartão cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((card) => (
              <div key={card.id} className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <CreditCard className="h-5 w-5 mr-2 inline-block" />
                  <span className="font-medium">Cartão final {card.card_number_last_four}</span>
                  {card.is_default && (
                    <Badge variant="default" className="ml-2">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Padrão
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {editingCardId === card.id ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={updatePaymentMethod}>
                        Salvar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => startEdit(card)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é irreversível. O cartão será permanentemente removido.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePaymentMethod(card.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t py-4">
          <h4 className="text-sm font-medium">Adicionar Novo Cartão</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <Label htmlFor="card_holder_name">Nome do Portador</Label>
              <Input
                type="text"
                id="card_holder_name"
                value={newCard.card_holder_name}
                onChange={handleInputChange}
                placeholder="Nome como no cartão"
              />
            </div>
            <div>
              <Label htmlFor="card_number_last_four">Últimos 4 Dígitos</Label>
              <Input
                type="text"
                id="card_number_last_four"
                value={newCard.card_number_last_four}
                onChange={handleInputChange}
                placeholder="0000"
                maxLength={4}
              />
            </div>
            <div>
              <Label>Bandeira</Label>
              <Select value={newCard.card_brand} onValueChange={(value) => setNewCard(prev => ({ ...prev, card_brand: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Bandeira" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="elo">Elo</SelectItem>
                  <SelectItem value="amex">American Express</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <Label htmlFor="is_default" className="mr-2">
                <Input
                  type="checkbox"
                  id="is_default"
                  checked={newCard.is_default}
                  onChange={() => setNewCard(prev => ({ ...prev, is_default: !prev.is_default }))}
                  className="mr-2"
                />
                Definir como padrão
              </Label>
            </div>
          </div>
          <Button className="mt-4 bg-aviation-gradient hover:opacity-90 text-white" onClick={addPaymentMethod}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cartão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodManager;
