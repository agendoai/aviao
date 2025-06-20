
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plane, Plus, Edit, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

const AircraftManagement: React.FC = () => {
  const { toast } = useToast();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAircraft, setNewAircraft] = useState({
    name: '',
    model: '',
    registration: '',
    max_passengers: 8,
    hourly_rate: 2800,
    status: 'available' as const
  });

  useEffect(() => {
    fetchAircraft();
  }, []);

  const fetchAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAircraft(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar aeronaves",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addAircraft = async () => {
    try {
      const { error } = await supabase
        .from('aircraft')
        .insert([newAircraft]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Aeronave adicionada com sucesso"
      });

      setIsAddDialogOpen(false);
      setNewAircraft({
        name: '',
        model: '',
        registration: '',
        max_passengers: 8,
        hourly_rate: 2800,
        status: 'available'
      });
      fetchAircraft();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar aeronave",
        variant: "destructive"
      });
    }
  };

  const updateAircraftStatus = async (id: string, status: 'available' | 'maintenance') => {
    try {
      const { error } = await supabase
        .from('aircraft')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status da aeronave atualizado"
      });

      fetchAircraft();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
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
    return <div className="text-center py-8">Carregando aeronaves...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Aeronaves</CardTitle>
              <CardDescription>
                Gerencie a frota de aeronaves do clube
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-aviation-gradient hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aeronave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Aeronave</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da nova aeronave
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newAircraft.name}
                      onChange={(e) => setNewAircraft({...newAircraft, name: e.target.value})}
                      placeholder="Ex: Jato Executivo 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={newAircraft.model}
                      onChange={(e) => setNewAircraft({...newAircraft, model: e.target.value})}
                      placeholder="Ex: Citation CJ3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registration">Matrícula</Label>
                    <Input
                      id="registration"
                      value={newAircraft.registration}
                      onChange={(e) => setNewAircraft({...newAircraft, registration: e.target.value})}
                      placeholder="Ex: PR-ABC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passengers">Máximo de Passageiros</Label>
                    <Input
                      id="passengers"
                      type="number"
                      value={newAircraft.max_passengers}
                      onChange={(e) => setNewAircraft({...newAircraft, max_passengers: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Taxa Horária (R$)</Label>
                    <Input
                      id="rate"
                      type="number"
                      value={newAircraft.hourly_rate}
                      onChange={(e) => setNewAircraft({...newAircraft, hourly_rate: parseFloat(e.target.value)})}
                    />
                  </div>
                  <Button onClick={addAircraft} className="w-full">
                    Adicionar Aeronave
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Passageiros</TableHead>
                  <TableHead>Taxa/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aircraft.map((plane) => (
                  <TableRow key={plane.id}>
                    <TableCell className="font-medium">{plane.name}</TableCell>
                    <TableCell>{plane.model}</TableCell>
                    <TableCell>{plane.registration}</TableCell>
                    <TableCell>{plane.max_passengers}</TableCell>
                    <TableCell>R$ {plane.hourly_rate.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeColor(plane.status)}>
                        {getStatusLabel(plane.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={plane.status}
                          onValueChange={(newStatus: 'available' | 'maintenance') => updateAircraftStatus(plane.id, newStatus)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Disponível</SelectItem>
                            <SelectItem value="maintenance">Manutenção</SelectItem>
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
    </div>
  );
};

export default AircraftManagement;
