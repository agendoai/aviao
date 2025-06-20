
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Plus, Download, Eye, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  booking_id?: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'pix';
  last_four: string;
  brand: string;
  is_default: boolean;
}

const PaymentManager: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchTransactions();
      fetchPaymentMethods();
    }
  }, [profile?.id]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar transações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    // Simulação de métodos de pagamento
    setPaymentMethods([
      {
        id: '1',
        type: 'credit_card',
        last_four: '4532',
        brand: 'Visa',
        is_default: true
      }
    ]);
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

    try {
      const amount = parseFloat(rechargeAmount);
      
      // Simular processamento de pagamento
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: profile?.id,
          amount: amount,
          type: 'credit',
          description: `Recarga de saldo - ${selectedPaymentMethod || 'Cartão de crédito'}`
        });

      if (error) throw error;

      // Atualizar saldo do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: (profile?.balance || 0) + amount
        })
        .eq('id', profile?.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: `Recarga de R$ ${amount.toLocaleString('pt-BR')} realizada com sucesso`
      });

      setRechargeAmount('');
      fetchTransactions();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar recarga",
        variant: "destructive"
      });
    }
  };

  const getTransactionBadgeColor = (type: string) => {
    return type === 'credit' ? 'default' : 'destructive';
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? '+' : '-';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando dados de pagamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Balance and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {profile?.balance?.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Última atualização: hoje
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status da Mensalidade</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={profile?.monthly_fee_status === 'paid' ? 'default' : 'destructive'}>
              {profile?.monthly_fee_status === 'paid' ? 'Em dia' : 'Pendente'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Próximo vencimento: 15/01/2025
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto do Mês</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {transactions
                .filter(t => t.type === 'debit' && new Date(t.created_at).getMonth() === new Date().getMonth())
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recharge Section */}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de Pagamento</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleRecharge} className="w-full bg-aviation-gradient hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </div>
          </div>
          
          {/* Quick Recharge Buttons */}
          <div className="flex space-x-2">
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
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="aviation-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>
                Gerencie seus cartões e formas de pagamento
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cartão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
                  <DialogDescription>
                    Adicione um novo cartão ou método de pagamento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Número do Cartão</Label>
                    <Input placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Validade</Label>
                      <Input placeholder="MM/AA" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input placeholder="123" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome no Cartão</Label>
                    <Input placeholder="Nome como aparece no cartão" />
                  </div>
                  <Button className="w-full bg-aviation-gradient hover:opacity-90">
                    Adicionar Cartão
                  </Button>
                </div>
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
                    <CreditCard className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">{method.brand} •••• {method.last_four}</p>
                      <p className="text-sm text-gray-600">
                        {method.type === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                      </p>
                    </div>
                    {method.is_default && (
                      <Badge variant="outline">Padrão</Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="outline" size="sm">Remover</Button>
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

      {/* Transaction History */}
      <Card className="aviation-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Suas últimas 20 transações
              </CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant={getTransactionBadgeColor(transaction.type)}>
                        {transaction.type === 'credit' ? 'Crédito' : 'Débito'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {getTransactionIcon(transaction.type)}R$ {transaction.amount.toLocaleString('pt-BR')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManager;
