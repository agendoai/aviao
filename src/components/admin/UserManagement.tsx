import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, UserX, Plane, DollarSign, Calendar, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  bookings: Booking[];
  sharedMissions: SharedMission[];
  membershipPayments: MembershipPayment[];
}

interface Booking {
  id: number;
  value: number;
  status: string;
  createdAt: string;
  aircraft: {
    name: string;
    registration: string;
  };
}

interface SharedMission {
  id: number;
  route: string;
  seatsAvailable: number;
  status: string;
  createdAt: string;
}

interface MembershipPayment {
  id: number;
  value: number;
  dueDate: string;
  status: string;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
      
      const response = await fetch(`${backendUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        console.error('Erro ao buscar usuários:', errorData);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: number, status: 'active' | 'blocked') => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
      const response = await fetch(`${backendUrl}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchUsers(); // Recarregar lista
      } else {
        console.error('Erro ao atualizar status do usuário');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
      const response = await fetch(`${backendUrl}/users/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchUsers(); // Recarregar lista
      } else {
        console.error('Erro ao atualizar status da reserva');
      }
    } catch (error) {
      console.error('Erro ao atualizar status da reserva:', error);
    }
  };

  const updateMissionStatus = async (missionId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
      const response = await fetch(`${backendUrl}/users/missions/${missionId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchUsers(); // Recarregar lista
      } else {
        console.error('Erro ao atualizar status da missão');
      }
    } catch (error) {
      console.error('Erro ao atualizar status da missão:', error);
    }
  };

  const updatePaymentStatus = async (paymentId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
      const response = await fetch(`${backendUrl}/users/membership/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchUsers(); // Recarregar lista
      } else {
        console.error('Erro ao atualizar status do pagamento');
      }
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paga':
      case 'confirmada':
        return 'default';
      case 'blocked':
      case 'cancelada':
        return 'destructive';
      case 'pendente':
        return 'secondary';
      case 'atrasada':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'blocked': return 'Bloqueado';
      case 'pendente': return 'Pendente';
      case 'confirmada': return 'Confirmada';
      case 'paga': return 'Paga';
      case 'cancelada': return 'Cancelada';
      case 'atrasada': return 'Atrasada';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="rounded-xl shadow-md border border-sky-500/20 bg-white/90">
          <CardHeader>
            <CardTitle className="text-lg text-sky-500 font-bold">Carregando usuários...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl shadow-md border border-sky-500/20 bg-white/90">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-sky-500 font-bold">Gestão de Usuários</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Visualize e gerencie todos os usuários do sistema
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs border-sky-500 text-sky-500 bg-sky-500/10 font-semibold px-3 py-1 rounded-full shadow-sm">
                {users.length} usuários
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-sky-500/20">
              <TableHeader className="bg-sky-500/10">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-sky-500">Usuário</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Reservas</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Missões</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Pagamentos</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-sky-500/5'}>
                    <TableCell className="text-xs font-medium">{user.name}</TableCell>
                    <TableCell className="text-xs">{user.email}</TableCell>
                    <TableCell className="text-xs">{user.bookings?.length || 0}</TableCell>
                    <TableCell className="text-xs">{user.sharedMissions?.length || 0}</TableCell>
                    <TableCell className="text-xs">{user.membershipPayments?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeColor(user.role)} className="text-xs px-2 py-1 rounded-full">
                        {getStatusLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Dialog open={isUserDetailOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          if (open) {
                            setSelectedUser(user);
                            setIsUserDetailOpen(true);
                          } else {
                            setIsUserDetailOpen(false);
                            setSelectedUser(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-6 px-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Usuário</DialogTitle>
                              <DialogDescription>
                                Informações completas de {user.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedUser && (
                              <div className="space-y-4">
                                {/* Informações do Usuário */}
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Informações Gerais</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">Nome:</span> {selectedUser.name}
                                      </div>
                                      <div>
                                        <span className="font-medium">Email:</span> {selectedUser.email}
                                      </div>
                                      <div>
                                        <span className="font-medium">Status:</span>
                                        <Select
                                          value={selectedUser.role}
                                          onValueChange={(value: 'active' | 'blocked') => {
                                            updateUserStatus(selectedUser.id, value);
                                            setIsUserDetailOpen(false);
                                          }}
                                        >
                                          <SelectTrigger className="w-32 h-6 ml-2">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="active">Ativo</SelectItem>
                                            <SelectItem value="blocked">Bloqueado</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Reservas */}
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center">
                                      <Plane className="h-4 w-4 mr-2" />
                                      Reservas ({selectedUser.bookings?.length || 0})
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      {selectedUser.bookings?.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-2 border rounded">
                                          <div className="text-sm">
                                            <div className="font-medium">{booking.aircraft.name} ({booking.aircraft.registration})</div>
                                            <div className="text-xs text-gray-600">
                                              {formatDate(booking.createdAt)} - {formatCurrency(booking.value)}
                                            </div>
                                          </div>
                                          <Select
                                            value={booking.status}
                                            onValueChange={(status) => updateBookingStatus(booking.id, status)}
                                          >
                                            <SelectTrigger className="w-24 h-6">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pendente">Pendente</SelectItem>
                                              <SelectItem value="confirmada">Confirmada</SelectItem>
                                              <SelectItem value="paga">Paga</SelectItem>
                                              <SelectItem value="cancelada">Cancelada</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      ))}
                                      {(!selectedUser.bookings || selectedUser.bookings.length === 0) && (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                          Nenhuma reserva encontrada
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Missões */}
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center">
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Missões ({selectedUser.sharedMissions?.length || 0})
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      {selectedUser.sharedMissions?.map((mission) => (
                                        <div key={mission.id} className="flex items-center justify-between p-2 border rounded">
                                          <div className="text-sm">
                                            <div className="font-medium">{mission.route}</div>
                                            <div className="text-xs text-gray-600">
                                              {formatDate(mission.createdAt)} - {mission.seatsAvailable} assentos
                                            </div>
                                          </div>
                                          <Select
                                            value={mission.status || 'pendente'}
                                            onValueChange={(status) => updateMissionStatus(mission.id, status)}
                                          >
                                            <SelectTrigger className="w-24 h-6">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pendente">Pendente</SelectItem>
                                              <SelectItem value="confirmada">Confirmada</SelectItem>
                                              <SelectItem value="paga">Paga</SelectItem>
                                              <SelectItem value="cancelada">Cancelada</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      ))}
                                      {(!selectedUser.sharedMissions || selectedUser.sharedMissions.length === 0) && (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                          Nenhuma missão encontrada
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Pagamentos */}
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center">
                                      <DollarSign className="h-4 w-4 mr-2" />
                                      Pagamentos ({selectedUser.membershipPayments?.length || 0})
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      {selectedUser.membershipPayments?.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                                          <div className="text-sm">
                                            <div className="font-medium">{formatCurrency(payment.value)}</div>
                                            <div className="text-xs text-gray-600">
                                              Vencimento: {formatDate(payment.dueDate)}
                                            </div>
                                          </div>
                                          <Select
                                            value={payment.status}
                                            onValueChange={(status) => updatePaymentStatus(payment.id, status)}
                                          >
                                            <SelectTrigger className="w-24 h-6">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pendente">Pendente</SelectItem>
                                              <SelectItem value="paga">Paga</SelectItem>
                                              <SelectItem value="atrasada">Atrasada</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      ))}
                                      {(!selectedUser.membershipPayments || selectedUser.membershipPayments.length === 0) && (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                          Nenhum pagamento encontrado
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
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
}
