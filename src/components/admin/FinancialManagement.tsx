
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

const FinancialManagement: React.FC = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalDebits: 0,
    totalCredits: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchFinancialStats();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

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

  const fetchFinancialStats = async () => {
    try {
      const { data: transactionData, error } = await supabase
        .from('transactions')
        .select('amount, type');

      if (error) throw error;

      const debits = transactionData?.filter(t => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const credits = transactionData?.filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('monthly_fee_status', 'paid');

      setStats({
        totalRevenue: debits,
        totalDebits: debits,
        totalCredits: credits,
        activeUsers: activeUsers || 0
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas financeiras",
        variant: "destructive"
      });
    }
  };

  const getTransactionBadgeColor = (type: string) => {
    return type === 'debit' ? 'destructive' : 'default';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Débitos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalDebits.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Créditos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalCredits.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas 50 transações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.profiles?.name}</div>
                        <div className="text-sm text-gray-500">{transaction.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant={getTransactionBadgeColor(transaction.type)}>
                        {transaction.type === 'debit' ? 'Débito' : 'Crédito'}
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {Number(transaction.amount).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
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

export default FinancialManagement;
