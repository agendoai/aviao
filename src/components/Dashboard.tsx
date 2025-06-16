
import React from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Plane, CreditCard, Users, TrendingUp, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const priorityProgress = ((21 - user.priorityPosition) / 20) * 100;
  const balanceStatus = user.balance >= 10000 ? 'high' : user.balance >= 5000 ? 'medium' : 'low';

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
            <div className="text-2xl font-bold">#{user.priorityPosition}</div>
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
              R$ {user.balance.toLocaleString('pt-BR')}
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
            <div className="text-2xl font-bold">25 JUN</div>
            <p className="text-xs text-muted-foreground mt-2">
              São Paulo → Rio de Janeiro
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
              user.monthlyFeeStatus === 'paid' ? 'text-green-600' : 
              user.monthlyFeeStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {user.monthlyFeeStatus === 'paid' ? 'PAGO' : 
               user.monthlyFeeStatus === 'pending' ? 'PENDENTE' : 'EM ATRASO'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Vencimento: 05/JUL
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
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
              {[1, 2, 3, 4, 5].map((position) => (
                <div 
                  key={position}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    position === user.priorityPosition ? 'bg-aviation-gold/20 border border-aviation-gold' : 'bg-gray-50'
                  }`}
                >
                  <span className="font-medium">#{position}</span>
                  <span className="text-sm">
                    {position === user.priorityPosition ? user.name : `Membro ${position}`}
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
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Plane className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Voo Confirmado</p>
                <p className="text-sm text-gray-600">GRU → SDU | 25 JUN 2024</p>
              </div>
              <div className="text-sm font-medium text-green-600">-R$ 8.500</div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Crédito Adicionado</p>
                <p className="text-sm text-gray-600">Pagamento via PIX</p>
              </div>
              <div className="text-sm font-medium text-green-600">+R$ 15.000</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
