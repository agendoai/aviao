import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, Clock, MapPin, Users, Star, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;
type PreReservation = Tables<'pre_reservations'>;

const PreReservationSystem: React.FC = () => {
  const { profile } = useAuth();
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [preReservations, setPreReservations] = useState<PreReservation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    aircraft_id: '',
    departure_date: '',
    departure_time: '',
    return_date: '',
    return_time: '',
    origin: '',
    destination: '',
    passengers: 1,
    notes: ''
  });

  useEffect(() => {
    if (profile) {
      fetchAircraft();
      fetchUserPreReservations();
    }
  }, [profile]);

  const fetchAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .eq('status', 'available');

      if (error) throw error;
      if (data) {
        setAircraftList(data);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar aeronaves.",
        variant: "destructive"
      });
    }
  };

  const fetchUserPreReservations = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('pre_reservations')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setPreReservations(data);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar pré-reservas.",
        variant: "destructive"
      });
    }
  };

  const handleAircraftChange = (aircraftId: string) => {
    const selectedAircraftItem = aircraftList.find(a => a.id === aircraftId);
    setSelectedAircraft(selectedAircraftItem || null);
    setFormData({ ...formData, aircraft_id: aircraftId });
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  const validateForm = (): string | null => {
    if (!selectedAircraft) return "Selecione uma aeronave";
    if (!formData.departure_date) return "Data de partida é obrigatória";
    if (!formData.departure_time) return "Horário de partida é obrigatório";
    if (!formData.return_date) return "Data de retorno é obrigatória";
    if (!formData.return_time) return "Horário de retorno é obrigatório";
    if (!sanitizeInput(formData.origin)) return "Origem é obrigatória";
    if (!sanitizeInput(formData.destination)) return "Destino é obrigatório";
    if (formData.passengers <= 0) return "Número de passageiros deve ser maior que 0";
    if (formData.passengers > selectedAircraft.max_passengers) {
      return `Máximo de ${selectedAircraft.max_passengers} passageiros para esta aeronave`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive"
      });
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Erro de Validação",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('pre_reservations')
        .insert({
          user_id: profile.id,
          aircraft_id: formData.aircraft_id,
          departure_date: formData.departure_date,
          departure_time: formData.departure_time,
          return_date: formData.return_date,
          return_time: formData.return_time,
          origin: sanitizeInput(formData.origin),
          destination: sanitizeInput(formData.destination),
          passengers: formData.passengers,
          notes: formData.notes ? sanitizeInput(formData.notes) : null,
          status: 'pending'
        })
        .select('*')
        .single();

      if (error) throw error;

      toast({
        title: "Pré-Reserva Criada!",
        description: "Sua pré-reserva foi criada com sucesso. Aguarde a confirmação.",
      });

      // Reset form
      setFormData({
        aircraft_id: '',
        departure_date: '',
        departure_time: '',
        return_date: '',
        return_time: '',
        origin: '',
        destination: '',
        passengers: 1,
        notes: ''
      });
      setSelectedAircraft(null);

      await fetchUserPreReservations();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar pré-reserva. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'pending': return <Star className="h-4 w-4 mr-1" />;
      case 'rejected': return <XCircle className="h-4 w-4 mr-1" />;
      default: return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Nova Pré-Reserva */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Nova Pré-Reserva</span>
          </CardTitle>
          <CardDescription>
            Crie uma pré-reserva para garantir sua aeronave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aircraft">Aeronave</Label>
                <Select value={formData.aircraft_id} onValueChange={handleAircraftChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aeronave" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraftList.map((plane) => (
                      <SelectItem key={plane.id} value={plane.id}>
                        {plane.name} - {plane.model} (até {plane.max_passengers} passageiros)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengers">Passageiros</Label>
                <Input
                  id="passengers"
                  type="number"
                  min="1"
                  max={selectedAircraft?.max_passengers || 8}
                  value={formData.passengers}
                  onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin">Origem</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Cidade/Aeroporto de origem"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destino</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Cidade/Aeroporto de destino"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure_date">Data de Partida</Label>
                <Input
                  id="departure_date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure_time">Horário de Partida</Label>
                <Input
                  id="departure_time"
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_date">Data de Retorno</Label>
                <Input
                  id="return_date"
                  type="date"
                  min={formData.departure_date || new Date().toISOString().split('T')[0]}
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_time">Horário de Retorno</Label>
                <Input
                  id="return_time"
                  type="time"
                  value={formData.return_time}
                  onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais sobre o voo"
                maxLength={500}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-aviation-gradient hover:opacity-90 text-white"
              disabled={!selectedAircraft || isSubmitting}
            >
              <Plane className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Criando Pré-Reserva...' : 'Criar Pré-Reserva'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Minhas Pré-Reservas */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Minhas Pré-Reservas</CardTitle>
          <CardDescription>Solicitações de reserva pendentes</CardDescription>
        </CardHeader>
        <CardContent>
          {preReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não tem pré-reservas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {preReservations.map((reservation) => (
                <div key={reservation.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {reservation.origin} → {reservation.destination}
                      </h4>
                      <p className="text-gray-600">
                        {new Date(reservation.departure_date).toLocaleDateString('pt-BR')} às {reservation.departure_time}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      {reservation.status === 'pending' ? 'Pendente' :
                        reservation.status === 'approved' ? 'Aprovado' :
                          'Rejeitado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Passageiros:</span>
                      <p className="font-medium">{reservation.passengers}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Criado em:</span>
                      <p className="font-medium">{new Date(reservation.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {reservation.notes && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Observações:</span>
                      <p className="text-sm">{reservation.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PreReservationSystem;
