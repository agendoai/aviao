
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Plane, Loader2, Edit, Trash2 } from 'lucide-react';
import { getAllAircrafts, createAircraft } from '@/utils/api';
import { toast } from 'sonner';

interface Aircraft {
  id: number;
  name: string;
  model: string;
  registration: string;
  max_passengers: number;
  hourly_rate: number;
  overnight_fee: number;
  status: string;
}

const AircraftManagement: React.FC = () => {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
  const [newAircraft, setNewAircraft] = useState({
    name: '',
    model: '',
    registration: '',
    max_passengers: 8,
    hourly_rate: 2800,
    overnight_fee: 1500,
    status: 'available' as const
  });

  useEffect(() => {
    fetchAircraft();
  }, []);

  const fetchAircraft = async () => {
    try {
      console.log('🔍 Iniciando busca de aeronaves...');
      const data = await getAllAircrafts();
      console.log('✅ Aeronaves carregadas:', data.length);
      setAircraft(data);
    } catch (error) {
      console.error('💥 Erro ao carregar aeronaves:', error);
      toast.error("Erro ao carregar aeronaves");
    } finally {
      setLoading(false);
    }
  };

  const addAircraft = async () => {
    try {
      console.log('🚀 Criando aeronave:', newAircraft);
      
      // Validar campos obrigatórios
      if (!newAircraft.name || !newAircraft.model || !newAircraft.registration) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }

      // Chamar API para criar aeronave
      const response = await createAircraft({
        name: newAircraft.name,
        model: newAircraft.model,
        registration: newAircraft.registration,
        max_passengers: newAircraft.max_passengers,
        hourly_rate: newAircraft.hourly_rate,
        overnight_fee: newAircraft.overnight_fee,
        status: newAircraft.status,
      });

      console.log('✅ Resposta da API:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Aeronave adicionada com sucesso");

      setIsAddDialogOpen(false);
      setNewAircraft({
        name: '',
        model: '',
        registration: '',
        max_passengers: 8,
        hourly_rate: 2800,
        overnight_fee: 1500,
        status: 'available'
      });
      
      // Recarregar lista de aeronaves
      fetchAircraft();
    } catch (error) {
      console.error('❌ Erro ao adicionar aeronave:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar aeronave");
    }
  };

  const editAircraft = async () => {
    if (!editingAircraft) return;
    
    try {
      console.log('✏️ Editando aeronave:', editingAircraft);
      
      // Validar campos obrigatórios
      if (!editingAircraft.name || !editingAircraft.model || !editingAircraft.registration) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }

      // Chamar API para atualizar aeronave
      const response = await fetch(`/api/aircrafts/${editingAircraft.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editingAircraft.name,
          model: editingAircraft.model,
          registration: editingAircraft.registration,
          seats: editingAircraft.max_passengers,
          hourly_rate: editingAircraft.hourly_rate,
          overnight_fee: editingAircraft.overnight_fee,
          status: editingAircraft.status,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar aeronave');
      }

      toast.success("Aeronave atualizada com sucesso");

      setIsEditDialogOpen(false);
      setEditingAircraft(null);
      
      // Recarregar lista de aeronaves
      fetchAircraft();
    } catch (error) {
      console.error('❌ Erro ao atualizar aeronave:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar aeronave");
    }
  };

  const openEditDialog = (aircraft: Aircraft) => {
    setEditingAircraft(aircraft);
    setIsEditDialogOpen(true);
  };

  const updateAircraftStatus = async (id: number, status: 'available' | 'maintenance') => {
    try {
      const updatedAircrafts = aircraft.map(plane =>
        plane.id === id ? { ...plane, status } : plane
      );
      setAircraft(updatedAircrafts);
      toast.success("Status da aeronave atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar status da aeronave");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Disponível',
      maintenance: 'Manutenção'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8 text-sky-500 font-bold">Carregando aeronaves...</div>;
  }

  return (
    <div className="space-y-3">
      <Card className="rounded-lg shadow-sm border border-sky-500/20 bg-white/90">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg text-sky-500 font-bold">Gestão de Aeronaves</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500">
                Adicione e gerencie aeronaves do clube
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm text-xs">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base">Adicionar Nova Aeronave</DialogTitle>
                  <DialogDescription className="text-sm">
                    Preencha os dados da nova aeronave
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-xs sm:text-sm">Nome</Label>
                    <Input
                      id="name"
                      value={newAircraft.name}
                      onChange={(e) => setNewAircraft({...newAircraft, name: e.target.value})}
                      placeholder="Ex: Avião de Passageiros"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model" className="text-xs sm:text-sm">Modelo</Label>
                    <Input
                      id="model"
                      value={newAircraft.model}
                      onChange={(e) => setNewAircraft({...newAircraft, model: e.target.value})}
                      placeholder="Ex: Citation CJ3"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registration" className="text-xs sm:text-sm">Matrícula</Label>
                    <Input
                      id="registration"
                      value={newAircraft.registration}
                      onChange={(e) => setNewAircraft({...newAircraft, registration: e.target.value})}
                      placeholder="Ex: PT-ABC-123"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <Label htmlFor="max_passengers" className="text-xs sm:text-sm">Passageiros</Label>
                      <Input
                        id="max_passengers"
                        type="number"
                        value={newAircraft.max_passengers}
                        onChange={(e) => setNewAircraft({...newAircraft, max_passengers: parseInt(e.target.value)})}
                        min="1"
                        max="50"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                      <Select
                        value={newAircraft.status}
                        onValueChange={(value: 'available' | 'maintenance') => setNewAircraft({...newAircraft, status: value})}
                      >
                        <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="maintenance">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <Label htmlFor="hourly_rate" className="text-xs sm:text-sm">Taxa/Hora (R$)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={newAircraft.hourly_rate}
                        onChange={(e) => setNewAircraft({...newAircraft, hourly_rate: parseFloat(e.target.value)})}
                        min="0"
                        step="0.01"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="overnight_fee" className="text-xs sm:text-sm">Pernoite (R$)</Label>
                      <Input
                        id="overnight_fee"
                        type="number"
                        value={newAircraft.overnight_fee}
                        onChange={(e) => setNewAircraft({...newAircraft, overnight_fee: parseFloat(e.target.value)})}
                        min="0"
                        step="0.01"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <Button onClick={addAircraft} className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                    Adicionar Aeronave
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-sky-500/20">
              <TableHeader className="bg-sky-500/10">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-sky-500 px-2">Nome</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500 px-2 hidden sm:table-cell">Modelo</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500 px-2">Matrícula</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500 px-2">Pass.</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500 px-2 hidden sm:table-cell">Taxa/H</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500 px-2 hidden sm:table-cell">Pernoite</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500 px-2">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-sky-500 px-2">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aircraft.map((plane, idx) => (
                  <TableRow key={plane.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-sky-500/5'}>
                    <TableCell className="text-xs font-medium px-2">{plane.name}</TableCell>
                    <TableCell className="text-xs px-2 hidden sm:table-cell">{plane.model}</TableCell>
                    <TableCell className="text-xs px-2">{plane.registration}</TableCell>
                    <TableCell className="text-xs px-2">{plane.max_passengers}</TableCell>
                    <TableCell className="text-xs px-2 hidden sm:table-cell">R$ {plane.hourly_rate?.toLocaleString('pt-BR') || '0'}</TableCell>
                    <TableCell className="text-xs px-2 hidden sm:table-cell">R$ {plane.overnight_fee?.toLocaleString('pt-BR') || '0'}</TableCell>
                    <TableCell className="px-2">
                      <Badge variant={getStatusBadgeColor(plane.status)} className="text-xs px-2 py-1 rounded-full">
                        {getStatusLabel(plane.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(plane)}
                          className="h-6 w-6 p-0 text-sky-500 hover:text-sky-600"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Select
                          value={plane.status}
                          onValueChange={(newStatus: 'available' | 'maintenance') => updateAircraftStatus(plane.id, newStatus)}
                        >
                          <SelectTrigger className="w-16 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Disp.</SelectItem>
                            <SelectItem value="maintenance">Manut.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Editar Aeronave</DialogTitle>
            <DialogDescription className="text-sm">
              Edite os dados da aeronave
            </DialogDescription>
          </DialogHeader>
          {editingAircraft && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-name" className="text-xs sm:text-sm">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingAircraft.name}
                  onChange={(e) => setEditingAircraft({...editingAircraft, name: e.target.value})}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-model" className="text-xs sm:text-sm">Modelo</Label>
                <Input
                  id="edit-model"
                  value={editingAircraft.model}
                  onChange={(e) => setEditingAircraft({...editingAircraft, model: e.target.value})}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-registration" className="text-xs sm:text-sm">Matrícula</Label>
                <Input
                  id="edit-registration"
                  value={editingAircraft.registration}
                  onChange={(e) => setEditingAircraft({...editingAircraft, registration: e.target.value})}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <Label htmlFor="edit-passengers" className="text-xs sm:text-sm">Passageiros</Label>
                  <Input
                    id="edit-passengers"
                    type="number"
                    value={editingAircraft.max_passengers}
                    onChange={(e) => setEditingAircraft({...editingAircraft, max_passengers: parseInt(e.target.value)})}
                    min="1"
                    max="50"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status" className="text-xs sm:text-sm">Status</Label>
                  <Select
                    value={editingAircraft.status}
                    onValueChange={(value: 'available' | 'maintenance') => setEditingAircraft({...editingAircraft, status: value})}
                  >
                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <Label htmlFor="edit-hourly-rate" className="text-xs sm:text-sm">Taxa/Hora (R$)</Label>
                  <Input
                    id="edit-hourly-rate"
                    type="number"
                    value={editingAircraft.hourly_rate}
                    onChange={(e) => setEditingAircraft({...editingAircraft, hourly_rate: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-overnight-fee" className="text-xs sm:text-sm">Pernoite (R$)</Label>
                  <Input
                    id="edit-overnight-fee"
                    type="number"
                    value={editingAircraft.overnight_fee}
                    onChange={(e) => setEditingAircraft({...editingAircraft, overnight_fee: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <Button onClick={editAircraft} className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AircraftManagement;
