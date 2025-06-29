import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Plane, CreditCard, Users, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import type { ProfileWithRole } from '@/types/supabase-extended';

type Transaction = Tables<'transactions'>;
type Booking = Tables<'bookings'>;

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [topProfiles, setTopProfiles] = useState<ProfileWithRole[]>([]);

  useEffect(() => {
    if (profile) {
      fetchRecentActivity();
      fetchTopProfiles();
    }
  }, [profile]);

  const fetchRecentActivity = async () => {
    if (!profile) return;

    try {
      // Fetch recent transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transError) throw transError;
      if (transactions) {
        setRecentTransactions(transactions);
      }

      // Fetch recent bookings
      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (bookError) throw bookError;
      if (bookings) {
        setRecentBookings(bookings);
      }
    } catch (error) {
      toast.error("Erro ao carregar atividades recentes.");
    }
  };

  const fetchTopProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('priority_position', { ascending: true })
        .limit(5);

      if (error) throw error;
      if (data) {
        // Type assertion since we know the data includes the role field
        setTopProfiles(data as ProfileWithRole[]);
      }
    } catch (error) {
      toast.error("Erro ao carregar lista de prioridades.");
    }
  };

  if (!profile) return null;

  const priorityProgress = ((21 - profile.priority_position) / 20) * 100;
  const balanceStatus = profile.balance >= 10000 ? 'high' : profile.balance >= 5000 ? 'medium' : 'low';
  
  // Type assertion for profile with role
  const profileWithRole = profile as ProfileWithRole;

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posição de Prioridade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{profile.priority_position}</div>
            <Progress value={priorityProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Rotação diária às 00:00
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {profile.balance.toLocaleString('pt-BR')}
            </div>
            <div className={`text-xs mt-2 ${
              balanceStatus === 'high' ? 'text-green-600' : 
              balanceStatus === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {balanceStatus === 'high' ? 'Saldo excelente' : 
               balanceStatus === 'medium' ? 'Saldo moderado' : 'Saldo baixo'}
            </div>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Voo</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentBookings.length > 0 ? 
                new Date(recentBookings[0].departure_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase() : 
                '--'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {recentBookings.length > 0 ? 
                `${recentBookings[0].origin} → ${recentBookings[0].destination}` : 
                'Nenhum voo agendado'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Mensalidade</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              profile.monthly_fee_status === 'paid' ? 'text-green-600' : 
              profile.monthly_fee_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {profile.monthly_fee_status === 'paid' ? 'PAGO' : 
               profile.monthly_fee_status === 'pending' ? 'PENDENTE' : 'EM ATRASO'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tier: {profile.membership_tier.toUpperCase()}
              {profileWithRole.role && profileWithRole.role !== 'client' && ` • ${profileWithRole.role.charAt(0).toUpperCase() + profileWithRole.role.slice(1)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Priority List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="aviation-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5" />
              <span>Ações Rápidas</span>
            </CardTitle>
            <CardDescription>
              Gerencie suas reservas e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-aviation-gradient hover:opacity-90 text-white">
              <Plane className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
            <Button variant="outline" className="w-full">
              <CalendarDays className="h-4 w-4 mr-2" />
              Ver Agenda
            </Button>
            <Button variant="outline" className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Adicionar Créditos
            </Button>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Lista de Prioridades</span>
            </CardTitle>
            <CardDescription>
              Posições atuais dos membros do clube
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProfiles.map((member) => (
                <div 
                  key={member.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    member.id === profile.id ? 'bg-aviation-gold/20 border border-aviation-gold' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">#{member.priority_position}</span>
                    {member.role === 'admin' && (
                      <span className="text-xs bg-red-100 text-red-600 px-1 rounded">Admin</span>
                    )}
                  </div>
                  <span className="text-sm">
                    {member.id === profile.id ? 'Você' : member.name}
                  </span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground text-center pt-2">
                Rotação automática diária
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Suas últimas transações e reservas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length === 0 && recentBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
            ) : (
              <>
                {recentBookings.slice(0, 2).map((booking) => (
                  <div key={booking.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Plane className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {booking.status === 'confirmed' ? 'Voo Confirmado' : 
                         booking.status === 'pending' ? 'Voo Pendente' : 'Voo ' + booking.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.origin} → {booking.destination} | {new Date(booking.departure_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-red-600">
                      -R$ {booking.total_cost.toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
                
                {recentTransactions.slice(0, 2).map((transaction) => (
                  <div key={transaction.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <CreditCard className={`h-5 w-5 ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className={`text-sm font-medium ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
