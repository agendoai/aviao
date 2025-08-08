import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Plane, CreditCard, Users, TrendingUp, Clock, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { getBookings, getUsers, getTransactions, getMyTransactions } from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Booking {
  id: number;
  userId: number;
  aircraftId: number;
  value: number;
  status: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  total_cost?: number;
  createdAt?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  balance?: number;
  monthly_fee_status?: string;
  membership_tier?: string;
}

interface Transaction {
  id: number;
  userId: number;
  bookingId?: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  const [membership, setMembership] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiaCola, setCopiaCola] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'missions'>('overview');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'paid'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
      fetchMembership();
    }
  }, [user]);

  // Carregar todas as reservas quando a aba de reservas for ativada
  useEffect(() => {
    if (activeTab === 'bookings' && user) {
      fetchAllBookings();
    }
  }, [activeTab, user]);

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchRecentActivity = async () => {
    if (!user) return;
    try {
      const bookings = await getBookings();
      const userBookings = bookings.filter(b => b.userId === user.id);
      
      // Ordenar por data de partida (mais próximo primeiro)
      const sortedBookings = userBookings.sort((a, b) => {
        const dateA = new Date(a.departure_date || '').getTime();
        const dateB = new Date(b.departure_date || '').getTime();
        return dateA - dateB;
      });
      
      // Pegar apenas reservas confirmadas
      const confirmedBookings = sortedBookings.filter(booking => {
        const isConfirmed = booking.status === 'confirmado' || booking.status === 'confirmada' || booking.status === 'paga';
        

        
        return isConfirmed;
      });
      

      

      
      setRecentBookings(confirmedBookings); // Todas as reservas confirmadas para a seção
      
      setAllBookings(sortedBookings); // Todas as reservas para a aba de reservas
      
      const transactions = await getMyTransactions();
      setRecentTransactions(transactions.filter(t => t.userId === user.id).slice(0, 5));
    } catch (error) {
      toast.error("Erro ao carregar atividades recentes.");
    }
  };

  const fetchAllBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const bookings = await getBookings();
      const userBookings = bookings.filter(b => b.userId === user.id);
      
      // Ordenar por data de criação (mais recente primeiro)
      const sortedBookings = userBookings.sort((a, b) => {
        const dateA = new Date(a.createdAt || '').getTime();
        const dateB = new Date(b.createdAt || '').getTime();
        return dateB - dateA;
      });
      
      setAllBookings(sortedBookings);
    } catch (error) {
      toast.error("Erro ao carregar reservas.");
    } finally {
      setLoadingBookings(false);
    }
  };



  const fetchMembership = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/payments/membership/${user.id}`);
      const data = await res.json();
      // Pegar a mensalidade mais recente (última criada)
      setMembership(data[0]);
    } catch (error) {
      // Erro silencioso para mensalidade
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/payments/membership/${user.id}`, { method: 'POST' });
      const data = await res.json();
      setQrCode(data.pixQrCodeImage);
      setCopiaCola(data.pixCopiaCola);
      setPaymentId(data.paymentId);
      setStatus(data.status);
    } catch {
      // erro
    } finally {
      setPaying(false);
    }
  };

  // Polling para status do pagamento
  React.useEffect(() => {
    if (!paymentId) return;
    const interval = setInterval(async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/payments/membership/status/${paymentId}`);
      const data = await res.json();
      setStatus(data.status);
      if (data.status === 'RECEIVED') {
        clearInterval(interval);
        fetchMembership();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId]);

  if (!user) return null;

  


  const balance = user.balance || 0;
  const balanceStatus = balance >= 10000 ? 'high' : balance >= 5000 ? 'medium' : 'low';

  return (
    <div className="space-y-6">
      {/* Header com nome do usuário e botão de logout */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bem-vindo, {user.name}</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/';
          }}
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Status Mensalidade */}
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Mensalidade</CardTitle>
            {membership?.status === 'paga' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : membership?.status === 'atrasada' ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              membership?.status === 'paga' ? 'text-green-600' : 
              membership?.status === 'atrasada' ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {membership?.status ? membership.status.toUpperCase() : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Vencimento: {membership?.dueDate ? new Date(membership.dueDate).toLocaleDateString('pt-BR') : '--'}
            </p>
            {membership?.value && (
              <p className="text-xs text-muted-foreground">
                Valor: R$ {membership.value.toFixed(2)}
              </p>
            )}
            {membership?.createdAt && (
              <p className="text-xs text-muted-foreground">
                Criada em: {new Date(membership.createdAt).toLocaleDateString('pt-BR')}
              </p>
            )}
            {(membership?.status === 'atrasada' || membership?.status === 'pendente') && (
              <div className="mt-2">
                <Button onClick={handlePay} disabled={paying} className="bg-blue-600 text-white">
                  {paying ? 'Gerando Pix...' : 'Pagar Mensalidade via Pix'}
                </Button>
                {qrCode && (
                  <div className="mt-4 text-center">
                    <img src={`data:image/png;base64,${qrCode}`} alt="QR Code Pix" className="mx-auto" />
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => navigator.clipboard.writeText(copiaCola || '')}
                    >
                      Copiar código Pix
                    </Button>
                    <div className="mt-2 text-xs break-all">{copiaCola}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Removido: Card de Saldo Disponível */}
        {/*
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {balance.toLocaleString('pt-BR')}
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
        */}

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Voos</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {recentBookings.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {recentBookings.length === 1 ? 'Reserva ativa' : 'Reservas ativas'}
                </p>
                <div className="mt-2">
                  <div className="text-xs text-gray-600">
                    Próximo: {recentBookings[0].origin} → {recentBookings[0].destination}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(recentBookings[0].departure_date || '').toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={recentBookings[0].status === 'paga' ? 'default' : 'secondary'} className="text-xs">
                    {recentBookings[0].status === 'paga' ? 'Confirmado' :
                     recentBookings[0].status === 'confirmado' ? 'Confirmado' :
                     recentBookings[0].status === 'pendente' ? 'Pendente' :
                     recentBookings[0].status}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">0</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Nenhuma reserva ativa
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setActiveTab('missions')}>
                    Fazer Reserva
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Removido: Status Mensalidade */}
        {/*
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Mensalidade</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              user.monthly_fee_status === 'paid' ? 'text-green-600' : 
              user.monthly_fee_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {user.monthly_fee_status === 'paid' ? 'PAGO' : 
               user.monthly_fee_status === 'pending' ? 'PENDENTE' : 'EM ATRASO'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tier: {user.membership_tier?.toUpperCase() || '--'}
              {user.role && user.role !== 'client' && ` • ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`}
            </p>
          </CardContent>
        </Card>
        */}
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
            <div className="flex space-x-2">
              <Button 
                onClick={() => setActiveTab('overview')} 
                variant={activeTab === 'overview' ? 'default' : 'outline'}
                className="flex-1"
              >
                <Plane className="h-4 w-4 mr-2" />
                Visão Geral
              </Button>
              <Button 
                onClick={() => setActiveTab('bookings')} 
                variant={activeTab === 'bookings' ? 'default' : 'outline'}
                className="flex-1"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Reservas
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Removido: Card de Lista de Prioridades */}
        {/*
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
              {topUsers.map((member) => (
                <div 
                  key={member.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    member.id === user.id ? 'bg-aviation-gold/20 border border-aviation-gold' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">#{member.priority_position}</span>
                    {member.role === 'admin' && (
                      <span className="text-xs bg-red-100 text-red-600 px-1 rounded">Admin</span>
                    )}
                  </div>
                  <span className="text-sm">
                    {member.id === user.id ? 'Você' : member.name}
                  </span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground text-center pt-2">
                Rotação automática diária
              </div>
            </div>
          </CardContent>
        </Card>
        */}
      </div>



      {/* Próximos Voos */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5" />
            <span>Próximos Voos</span>
          </CardTitle>
          <CardDescription>
            Suas reservas com status confirmado
          </CardDescription>
        </CardHeader>
        <CardContent>
                      <div className="space-y-4">
                            <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm sm:text-base">Próximos Voos</h4>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs h-8 px-3"
                  >
                    Ver Todos
                  </Button>
                </div>
                                {recentBookings && recentBookings.length > 0 ? (
                  <div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {recentBookings.map((booking) => {
                        const flightDate = new Date(booking.departure_date || '');
                        const now = new Date();
                        const daysUntilFlight = Math.ceil((flightDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div key={booking.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="text-center flex-shrink-0">
                                <div className="text-lg font-bold text-blue-600">
                                  {flightDate.toLocaleDateString('pt-BR', { day: '2-digit' })}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {flightDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="font-semibold text-gray-900 text-sm truncate">
                                    {booking.origin} → {booking.destination}
                                  </p>
                                  <Badge 
                                    variant={booking.status === 'paga' ? 'default' : 'secondary'}
                                    className={
                                      booking.status === 'paga' ? 'bg-green-100 text-green-800 text-xs flex-shrink-0' :
                                      booking.status === 'confirmado' ? 'bg-blue-100 text-blue-800 text-xs flex-shrink-0' :
                                      'bg-yellow-100 text-yellow-800 text-xs flex-shrink-0'
                                    }
                                  >
                                    {booking.status === 'paga' ? 'Confirmada' :
                                     booking.status === 'confirmado' ? 'Confirmada' :
                                     booking.status === 'pendente' ? 'Pendente' :
                                     booking.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span>
                                      {daysUntilFlight === 0 ? 'Hoje' :
                                       daysUntilFlight === 1 ? 'Amanhã' :
                                       `Em ${daysUntilFlight} dias`}
                                    </span>
                                  </div>
                                  <div className="font-medium text-green-600">
                                    R$ {booking.value?.toFixed(2) || '0,00'}
                                  </div>
                                  <div className="text-blue-600 font-medium">
                                    Reserva #{booking.id}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <Button size="sm" variant="outline" className="text-xs flex-1">
                                Detalhes
                              </Button>
                              {booking.status === 'pendente' && (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs flex-1">
                                  Pagar
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {recentBookings.length >= 3 && (
                      <div className="text-center pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setActiveTab('bookings')}
                          className="text-xs"
                        >
                          Ver todos os voos ({recentBookings.length})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Plane className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum voo programado</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setActiveTab('missions')}
                      className="mt-2 text-xs"
                    >
                      Agendar Voo
                    </Button>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Transações Recentes</h4>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'credit' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhuma transação recente</p>
                )}
              </div>
            </div>

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-lg">Minhas Reservas</h4>
                  <p className="text-sm text-gray-600">Gerencie suas reservas de voo</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={fetchAllBookings}
                    disabled={loadingBookings}
                    className="text-xs"
                  >
                    {loadingBookings ? 'Atualizando...' : 'Atualizar'}
                  </Button>
                  <Button size="sm" onClick={() => setActiveTab('missions')} className="bg-blue-600 hover:bg-blue-700">
                    <Plane className="h-4 w-4 mr-2" />
                    Nova Reserva
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  size="sm"
                  variant={bookingFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setBookingFilter('all')}
                  className="text-xs"
                >
                  Todas ({allBookings.length})
                </Button>
                <Button
                  size="sm"
                  variant={bookingFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setBookingFilter('pending')}
                  className="text-xs"
                >
                  Pendentes ({allBookings.filter(b => b.status === 'pendente').length})
                </Button>
                <Button
                  size="sm"
                  variant={bookingFilter === 'confirmed' ? 'default' : 'outline'}
                  onClick={() => setBookingFilter('confirmed')}
                  className="text-xs"
                >
                  Confirmadas ({allBookings.filter(b => b.status === 'confirmado').length})
                </Button>
                <Button
                  size="sm"
                  variant={bookingFilter === 'paid' ? 'default' : 'outline'}
                  onClick={() => setBookingFilter('paid')}
                  className="text-xs"
                >
                  Pagas ({allBookings.filter(b => b.status === 'paga').length})
                </Button>
              </div>
              
              {loadingBookings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando reservas...</p>
                </div>
                              ) : allBookings.length > 0 ? (
                <div className="space-y-4">
                  {allBookings
                    .filter(booking => {
                      switch (bookingFilter) {
                        case 'pending':
                          return booking.status === 'pendente';
                        case 'confirmed':
                          return booking.status === 'confirmado';
                        case 'paid':
                          return booking.status === 'paga';
                        default:
                          return true;
                      }
                    })
                    .map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-lg">Voo #{booking.id}</h5>
                          <Badge 
                            variant={
                              booking.status === 'paga' ? 'default' : 
                              booking.status === 'confirmado' ? 'secondary' : 
                              'outline'
                            }
                            className={
                              booking.status === 'paga' ? 'bg-green-100 text-green-800' :
                              booking.status === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {booking.status === 'paga' ? 'Paga' :
                             booking.status === 'confirmado' ? 'Confirmada' :
                             booking.status === 'pendente' ? 'Pendente' :
                             booking.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Valor Total</p>
                          <p className="font-bold text-lg text-green-600">
                            R$ {booking.value?.toFixed(2) || '0,00'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 uppercase font-medium">Origem</p>
                          <p className="font-medium text-sm">{booking.origin || '--'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 uppercase font-medium">Destino</p>
                          <p className="font-medium text-sm">{booking.destination || '--'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 uppercase font-medium">Data de Partida</p>
                          <p className="font-medium text-sm">
                            {booking.departure_date ? new Date(booking.departure_date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }) : '--'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="text-xs text-gray-500">
                          Criada em: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('pt-BR') : '--'}
                        </div>
                        <div className="flex space-x-2">
                          {booking.status === 'pendente' && (
                            <Button size="sm" variant="outline" className="text-xs">
                              Pagar
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-xs">
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  

                                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Plane className="h-8 w-8 text-gray-400" />
                    </div>
                    <h5 className="text-lg font-medium text-gray-900 mb-2">
                      {bookingFilter === 'all' ? 'Nenhuma reserva encontrada' : 'Nenhuma reserva com este status'}
                    </h5>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {bookingFilter === 'all' 
                        ? 'Você ainda não possui reservas de voo. Comece fazendo sua primeira reserva!'
                        : `Não há reservas com status "${bookingFilter === 'pending' ? 'pendente' : bookingFilter === 'confirmed' ? 'confirmada' : 'paga'}"`
                      }
                    </p>
                    {bookingFilter === 'all' && (
                      <Button 
                        onClick={() => setActiveTab('missions')} 
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        <Plane className="h-4 w-4 mr-2" />
                        Fazer Primeira Reserva
                      </Button>
                    )}
                    {bookingFilter !== 'all' && (
                      <Button 
                        onClick={() => setBookingFilter('all')} 
                        variant="outline"
                        size="lg"
                      >
                        Ver Todas as Reservas
                      </Button>
                    )}
                  </div>
                )}
            </div>
          )}

          {activeTab === 'missions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Sistema de Missões</h4>
                <Button size="sm" onClick={() => navigate('/dashboard?tab=missions')}>
                  Acessar Missões
                </Button>
              </div>
              
              <div className="text-center py-8">
                <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Sistema completo de missões disponível</p>
                <p className="text-sm text-gray-400">Crie voos individuais ou compartilhados</p>
                <Button onClick={() => navigate('/dashboard?tab=missions')} className="mt-4">
                  Ir para Missões
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
