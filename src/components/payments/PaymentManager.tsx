import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodManager from './PaymentMethodManager';
import CreditRechargeManager from './CreditRechargeManager';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  booking_id?: string;
}

const PaymentManager: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchTransactions();
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
              R$ {profile?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
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
                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Recharge Section */}
      <CreditRechargeManager />

      {/* Payment Methods */}
      <PaymentMethodManager />

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
                        {getTransactionIcon(transaction.type)}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
