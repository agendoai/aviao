import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plane, User, Calendar, DollarSign, Eye, AlertTriangle, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getAllBookings } from '@/utils/api';
import { buildApiUrl } from '@/config/api';

interface Booking {
  id: number;
  value: number;
  status: string;
  createdAt: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  passengers?: number;
  flight_hours?: number;
  overnight_stays?: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  aircraft: {
    id: number;
    name: string;
    registration: string;
    model: string;
  };
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // // console.log('🎯 BookingManagement - Componente carregado');
    // // console.log('👤 User:', user);
    // // console.log('🔑 Token no localStorage:', localStorage.getItem('token'));
    
    const token = localStorage.getItem('token');
    if (!token) {
      // // console.log('❌ Nenhum token encontrado');
      return;
    }
    
    if (!user) {
      // // console.log('❌ Usuário não autenticado');
      return;
    }
    
    // Pequeno delay para garantir que tudo esteja carregado
    setTimeout(() => {
      fetchBookings();
    }, 100);
  }, [user]);

  const fetchBookings = async () => {
    try {
      // // console.log('🔍 Iniciando busca de reservas...');
      const token = localStorage.getItem('token');
      // // console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
      
      const data = await getAllBookings();
      // // console.log('✅ Reservas carregadas:', data.length);
      setBookings(data);
    } catch (error) {
      console.error('💥 Erro ao buscar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/bookings/${bookingId}/status`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchBookings(); // Recarregar lista
        window.dispatchEvent(new Event('dashboard:refresh'));
      } else {
        console.error('Erro ao atualizar status da reserva');
      }
    } catch (error) {
      console.error('Erro ao atualizar status da reserva:', error);
    }
  };

  const cancelBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(buildApiUrl(`/api/bookings/${bookingId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await fetchBookings(); // Recarregar lista
        window.dispatchEvent(new Event('dashboard:refresh'));
      } else {
        console.error('Erro ao cancelar reserva');
      }
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
    }
  };

  const saveBookingEdit = async (bookingId: number, updatedData: any) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(buildApiUrl(`/api/bookings/${bookingId}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        await fetchBookings(); // Recarregar lista
        setIsEditing(false);
        setEditingBooking(null);
        window.dispatchEvent(new Event('dashboard:refresh'));
      } else {
        console.error('Erro ao salvar edição da reserva');
      }
    } catch (error) {
      console.error('Erro ao salvar edição da reserva:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'secondary';
      case 'confirmada':
        return 'default';

      case 'cancelada':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'confirmada': return 'Confirmada';

      case 'cancelada': return 'Cancelada';
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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl shadow-md border border-sky-500/20 bg-white/90">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="text-lg text-sky-500 font-bold">Gestão de Reservas</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Visualize e gerencie todas as reservas do sistema
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs border-sky-500 text-sky-500 bg-sky-500/10 font-semibold px-3 py-1 rounded-full shadow-sm">
                {bookings.length} reservas
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-full divide-y divide-sky-500/20">
              <TableHeader className="bg-sky-500/10">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-sky-500">Cliente</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Aeronave</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Valor</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Data</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking, idx) => (
                  <TableRow key={booking.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-sky-500/5'}>
                    <TableCell className="text-xs">
                      <div>
                        <div className="font-medium">{booking.user.name}</div>
                        <div className="text-gray-500">{booking.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <div className="font-medium">{booking.aircraft.name}</div>
                        <div className="text-gray-500">{booking.aircraft.registration}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{formatCurrency(booking.value)}</TableCell>
                    <TableCell className="text-xs">{formatDate(booking.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeColor(booking.status)} className="text-xs px-2 py-1 rounded-full">
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Dialog open={isBookingDetailOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                          if (open) {
                            setSelectedBooking(booking);
                            setIsBookingDetailOpen(true);
                          } else {
                            setIsBookingDetailOpen(false);
                            setSelectedBooking(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-6 px-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2"
                            onClick={() => {
                              setEditingBooking(booking);
                              setIsEditing(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Reserva</DialogTitle>
                              <DialogDescription>
                                Informações completas da reserva #{booking.id}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedBooking && (
                              <div className="space-y-4">
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">Nome:</span> {selectedBooking.user.name}
                                      </div>
                                      <div>
                                        <span className="font-medium">Email:</span> {selectedBooking.user.email}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Informações da Aeronave</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">Nome:</span> {selectedBooking.aircraft.name}
                                      </div>
                                      <div>
                                        <span className="font-medium">Modelo:</span> {selectedBooking.aircraft.model}
                                      </div>
                                      <div>
                                        <span className="font-medium">Matrícula:</span> {selectedBooking.aircraft.registration}
                                      </div>
                                      <div>
                                        <span className="font-medium">Valor:</span> {formatCurrency(selectedBooking.value)}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Controle de Status</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                      <Select
                                        value={selectedBooking.status}
                                        onValueChange={(status) => {
                                          updateBookingStatus(selectedBooking.id, status);
                                          setIsBookingDetailOpen(false);
                                        }}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pendente">Pendente</SelectItem>
                                          <SelectItem value="confirmada">Confirmada</SelectItem>
                                          <SelectItem value="cancelada">Cancelada</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          cancelBooking(selectedBooking.id);
                                          setIsBookingDetailOpen(false);
                                        }}
                                      >
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Cancelar
                                      </Button>
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 p-4">
            {bookings.map((booking, idx) => (
              <div key={booking.id} className={`border rounded-lg p-4 ${idx % 2 === 0 ? 'bg-white' : 'bg-sky-500/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-4 w-4 text-sky-500" />
                      <div>
                        <div className="font-medium text-sm">{booking.user.name}</div>
                        <div className="text-xs text-gray-500">{booking.user.email}</div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeColor(booking.status)} className="text-xs px-2 py-1 rounded-full">
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-4 w-4 text-sky-500" />
                    <div>
                      <div className="font-medium text-sm">{booking.aircraft.name}</div>
                      <div className="text-xs text-gray-500">{booking.aircraft.registration}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">{formatCurrency(booking.value)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600">{formatDate(booking.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">ID: #{booking.id}</span>
                  <div className="flex items-center space-x-2">
                    <Dialog open={isBookingDetailOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                      if (open) {
                        setSelectedBooking(booking);
                        setIsBookingDetailOpen(true);
                      } else {
                        setIsBookingDetailOpen(false);
                        setSelectedBooking(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          setEditingBooking(booking);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
            <DialogDescription>
              Edite os detalhes da reserva #{editingBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {editingBooking && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Informações da Reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={editingBooking.status}
                        onValueChange={(status) => setEditingBooking({...editingBooking, status})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="confirmada">Confirmada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Valor</label>
                      <input
                        type="number"
                        value={editingBooking.value}
                        onChange={(e) => setEditingBooking({...editingBooking, value: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Origem</label>
                      <input
                        type="text"
                        value={editingBooking.origin || ''}
                        onChange={(e) => setEditingBooking({...editingBooking, origin: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Ex: SBAU"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Destino</label>
                      <input
                        type="text"
                        value={editingBooking.destination || ''}
                        onChange={(e) => setEditingBooking({...editingBooking, destination: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Ex: SBGR"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Data de Partida</label>
                      <input
                        type="datetime-local"
                        value={editingBooking.departure_date ? editingBooking.departure_date.slice(0, 16) : ''}
                        onChange={(e) => setEditingBooking({...editingBooking, departure_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Data de Retorno</label>
                      <input
                        type="datetime-local"
                        value={editingBooking.return_date ? editingBooking.return_date.slice(0, 16) : ''}
                        onChange={(e) => setEditingBooking({...editingBooking, return_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Passageiros</label>
                      <input
                        type="number"
                        value={editingBooking.passengers || 1}
                        onChange={(e) => setEditingBooking({...editingBooking, passengers: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Horas de Voo</label>
                      <input
                        type="number"
                        value={editingBooking.flight_hours || 2}
                        onChange={(e) => setEditingBooking({...editingBooking, flight_hours: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Pernoites</label>
                      <input
                        type="number"
                        value={editingBooking.overnight_stays || 0}
                        onChange={(e) => setEditingBooking({...editingBooking, overnight_stays: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        min="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingBooking(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (editingBooking) {
                      saveBookingEdit(editingBooking.id, {
                        status: editingBooking.status,
                        value: editingBooking.value,
                        origin: editingBooking.origin,
                        destination: editingBooking.destination,
                        departure_date: editingBooking.departure_date,
                        return_date: editingBooking.return_date,
                        passengers: editingBooking.passengers,
                        flight_hours: editingBooking.flight_hours,
                        overnight_stays: editingBooking.overnight_stays
                      });
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
