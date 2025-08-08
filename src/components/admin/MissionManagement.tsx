import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plane, 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { searchAirports, getPopularAirports, calculateDistance, Airport } from '@/utils/airport-search';

interface Mission {
  id: number;
  aircraftId: number;
  aircraft: {
    name: string;
    registration: string;
  };
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  passengers: number;
  flight_hours: number;
  overnight_stays: number;
  value: number;
  status: 'pendente' | 'confirmada' | 'paga' | 'cancelada';
  user: {
    name: string;
    email: string;
  };
}

const MissionManagement: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  
  // Estados para criar/editar missão
  const [aircraftId, setAircraftId] = useState('');
  const [origin, setOrigin] = useState('SBAU');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [flightHours, setFlightHours] = useState(2);
  const [overnightStays, setOvernightStays] = useState(0);
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<'pendente' | 'confirmada' | 'paga' | 'cancelada'>('pendente');

  // Estados para busca de aeroportos
  const [searchTerm, setSearchTerm] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      // Aqui você faria a chamada para a API
      // const response = await fetch('/api/missions');
      // const data = await response.json();
      // setMissions(data);
      
      // Mock data por enquanto
      setMissions([
        {
          id: 1,
          aircraftId: 1,
          aircraft: { name: 'Cessna 172', registration: 'PT-ABC' },
          origin: 'SBAU',
          destination: 'SBSP',
          departure_date: '2024-07-26T08:00:00',
          return_date: '2024-07-26T18:00:00',
          passengers: 2,
          flight_hours: 4,
          overnight_stays: 0,
          value: 12000,
          status: 'confirmada',
          user: { name: 'João Silva', email: 'joao@email.com' }
        }
      ]);
    } catch (error) {
      toast.error('Erro ao carregar missões');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = async () => {
    try {
      // Validar campos obrigatórios
      if (!aircraftId || !destination || !departureDate || !departureTime || !returnDate || !returnTime) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      // Aqui você faria a chamada para criar a missão
      // const response = await fetch('/api/missions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     aircraftId,
      //     origin,
      //     destination,
      //     departure_date: `${departureDate}T${departureTime}:00`,
      //     return_date: `${returnDate}T${returnTime}:00`,
      //     passengers,
      //     flight_hours: flightHours,
      //     overnight_stays: overnightStays,
      //     value,
      //     status
      //   })
      // });

      toast.success('Missão criada com sucesso!');
      setIsCreateDialogOpen(false);
      fetchMissions();
    } catch (error) {
      toast.error('Erro ao criar missão');
    }
  };

  const handleUpdateStatus = async (missionId: number, newStatus: string) => {
    try {
      // Aqui você faria a chamada para atualizar o status
      // await fetch(`/api/missions/${missionId}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });

      toast.success('Status atualizado com sucesso!');
      fetchMissions();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteMission = async (missionId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta missão?')) return;

    try {
      // Aqui você faria a chamada para deletar a missão
      // await fetch(`/api/missions/${missionId}`, { method: 'DELETE' });

      toast.success('Missão excluída com sucesso!');
      fetchMissions();
    } catch (error) {
      toast.error('Erro ao excluir missão');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paga': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'confirmada': return <CheckCircle className="h-4 w-4" />;
      case 'paga': return <DollarSign className="h-4 w-4" />;
      case 'cancelada': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Missões</h2>
          <p className="text-sm sm:text-base text-gray-600">Gerencie todas as missões e voos do sistema</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Missão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Missão</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Aeronave</Label>
                  <Select value={aircraftId} onValueChange={setAircraftId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma aeronave" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Cessna 172 - PT-ABC</SelectItem>
                      <SelectItem value="2">Piper PA-28 - PT-DEF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data de Partida</Label>
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hora de Partida</Label>
                  <Input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data de Retorno</Label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hora de Retorno</Label>
                  <Input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Passageiros</Label>
                  <Input
                    type="number"
                    min="1"
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Horas de Voo</Label>
                  <Input
                    type="number"
                    min="1"
                    value={flightHours}
                    onChange={(e) => setFlightHours(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Pernoites</Label>
                  <Input
                    type="number"
                    min="0"
                    value={overnightStays}
                    onChange={(e) => setOvernightStays(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value))}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleCreateMission} className="bg-sky-500 hover:bg-sky-600 w-full sm:w-auto">
                  Criar Missão
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Missões */}
      <Card>
        <CardHeader>
          <CardTitle>Missões e Voos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Layout */}
          <div className="hidden md:block space-y-4">
            {missions.map((mission) => (
              <div key={mission.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-5 w-5 text-sky-500" />
                      <div>
                        <div className="font-medium">{mission.aircraft.name}</div>
                        <div className="text-sm text-gray-600">{mission.aircraft.registration}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {mission.origin} → {mission.destination}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {format(new Date(mission.departure_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {format(new Date(mission.departure_date), 'HH:mm')} - {format(new Date(mission.return_date), 'HH:mm')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{mission.passengers} passageiro(s)</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">R$ {mission.value.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(mission.status)}`}>
                      {getStatusIcon(mission.status)}
                      <span className="ml-1">{mission.status}</span>
                    </Badge>
                    
                    <Select value={mission.status} onValueChange={(value) => handleUpdateStatus(mission.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmada">Confirmada</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMission(mission.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  Cliente: {mission.user.name} ({mission.user.email})
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            {missions.map((mission) => (
              <div key={mission.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-5 w-5 text-sky-500" />
                    <div>
                      <div className="font-medium text-sm">{mission.aircraft.name}</div>
                      <div className="text-xs text-gray-600">{mission.aircraft.registration}</div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(mission.status)} text-xs`}>
                    {getStatusIcon(mission.status)}
                    <span className="ml-1">{mission.status}</span>
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {mission.origin} → {mission.destination}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {format(new Date(mission.departure_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {format(new Date(mission.departure_date), 'HH:mm')} - {format(new Date(mission.return_date), 'HH:mm')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{mission.passengers} passageiro(s)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">R$ {mission.value.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">
                    Cliente: {mission.user.name} ({mission.user.email})
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ID: #{mission.id}</span>
                    <div className="flex items-center space-x-2">
                      <Select value={mission.status} onValueChange={(value) => handleUpdateStatus(mission.id, value)}>
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="confirmada">Confirmada</SelectItem>
                          <SelectItem value="paga">Paga</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMission(mission.id)}
                        className="text-red-600 hover:text-red-700 h-8 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
            
            {missions.length === 0 && (
              <div className="text-center py-8">
                <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-sm sm:text-base">Nenhuma missão encontrada</p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MissionManagement; 