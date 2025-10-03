import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plane, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAircrafts, createSharedMission } from '@/utils/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  seats: number;
  status: string;
}

interface CreateSharedMissionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateSharedMissionForm: React.FC<CreateSharedMissionFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    origin: '',
    destination: '',
    departure_date: null as Date | null,
    return_date: null as Date | null,
    aircraftId: 0,
    totalSeats: 1,
    pricePerSeat: 0,
    overnightFee: 0
  });

  useEffect(() => {
    fetchAircrafts();
  }, []);

  const fetchAircrafts = async () => {
    try {
      const aircraftsData = await getAircrafts();
      setAircrafts(aircraftsData);
    } catch (error) {
      toast.error('Erro ao carregar aeronaves');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.origin || !formData.destination || 
        !formData.departure_date || !formData.return_date || 
        formData.aircraftId === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.departure_date >= formData.return_date) {
      toast.error('A data de retorno deve ser posterior à data de partida');
      return;
    }

    const selectedAircraft = aircrafts.find(a => a.id === formData.aircraftId);
    if (selectedAircraft && formData.totalSeats > selectedAircraft.seats) {
      toast.error('Número de assentos excede a capacidade da aeronave');
      return;
    }

    setLoading(true);
    try {
      // Calcular custo total baseado na aeronave selecionada
      const selectedAircraft = aircrafts.find(a => a.id === formData.aircraftId);
      const totalCost = selectedAircraft ? (selectedAircraft.hourly_rate * 2) + (formData.overnightFee * formData.totalSeats) : 0;
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      const toLocalNoTZ = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

      await createSharedMission({
        title: formData.title,
        description: formData.description,
        origin: formData.origin,
        destination: formData.destination,
        departure_date: toLocalNoTZ(formData.departure_date),
        return_date: toLocalNoTZ(formData.return_date),
        aircraftId: formData.aircraftId,
        totalSeats: formData.totalSeats,
        pricePerSeat: Math.ceil(totalCost / formData.totalSeats),
        totalCost: totalCost,
        overnightFee: formData.overnightFee
      });

      toast.success('Missão compartilhada criada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar missão compartilhada:', error);
      toast.error('Erro ao criar missão compartilhada');
    } finally {
      setLoading(false);
    }
  };

  const handleAircraftChange = (aircraftId: string) => {
    const aircraft = aircrafts.find(a => a.id === parseInt(aircraftId));
    setFormData(prev => ({
      ...prev,
      aircraftId: parseInt(aircraftId),
      totalSeats: aircraft ? Math.min(prev.totalSeats, aircraft.seats) : prev.totalSeats
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plane className="h-5 w-5" />
          <span>Criar Missão Compartilhada</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título e Descrição */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Missão *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Viagem para São Paulo - Fim de Semana"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva os detalhes da missão..."
                rows={3}
              />
            </div>
          </div>

          {/* Origem e Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin">Origem *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                placeholder="Ex: SBAU"
                required
              />
            </div>
            <div>
              <Label htmlFor="destination">Destino *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="Ex: SBSP"
                required
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data de Partida *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.departure_date ? (
                      format(formData.departure_date, 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.departure_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, departure_date: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Data de Retorno *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.return_date ? (
                      format(formData.return_date, 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.return_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, return_date: date }))}
                    disabled={(date) => date <= (formData.departure_date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Aeronave */}
          <div>
            <Label htmlFor="aircraft">Aeronave *</Label>
            <Select value={formData.aircraftId.toString()} onValueChange={handleAircraftChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma aeronave" />
              </SelectTrigger>
              <SelectContent>
                {aircrafts
                  .filter(aircraft => aircraft.status === 'available')
                  .map(aircraft => (
                    <SelectItem key={aircraft.id} value={aircraft.id.toString()}>
                      {aircraft.name} ({aircraft.registration}) - {aircraft.seats} assentos
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

                     {/* Assentos e Preço */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <Label htmlFor="totalSeats">Número de Assentos *</Label>
               <div className="flex items-center space-x-2">
                 <Input
                   id="totalSeats"
                   type="number"
                   min="1"
                   max={aircrafts.find(a => a.id === formData.aircraftId)?.seats || 1}
                   value={formData.totalSeats}
                   onChange={(e) => setFormData(prev => ({ ...prev, totalSeats: parseInt(e.target.value) }))}
                   required
                 />
                 <Users className="h-4 w-4 text-gray-500" />
               </div>
             </div>
            {/* Preço por assento removido: dono paga o total */}
           </div>

           {/* Taxa de Pernoite */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <Label htmlFor="overnightFee">Taxa de Pernoite por Pessoa (R$) *</Label>
               <div className="flex items-center space-x-2">
                 <Input
                   id="overnightFee"
                   type="number"
                   min="0"
                   step="0.01"
                   value={formData.overnightFee}
                   onChange={(e) => setFormData(prev => ({ ...prev, overnightFee: parseFloat(e.target.value) }))}
                   required
                 />
                 <DollarSign className="h-4 w-4 text-gray-500" />
               </div>
               <p className="text-xs text-gray-500 mt-1">
                 Cobrada quando o voo passa de 00h00 e envolve pernoites
               </p>
             </div>
             <div>
               <Label>Número de Pernoites</Label>
               <div className="flex items-center space-x-2">
                 <Input
                   type="number"
                   min="0"
                   value={formData.departure_date && formData.return_date ? 
                     Math.max(0, Math.floor((formData.return_date.getTime() - formData.departure_date.getTime()) / (1000 * 60 * 60 * 24))) : 0}
                   disabled
                   className="bg-gray-100"
                 />
                 <span className="text-sm text-gray-500">Calculado automaticamente</span>
               </div>
             </div>
           </div>

                     {/* Resumo */}
          {formData.aircraftId > 0 && formData.totalSeats > 0 && (
             <div className="p-4 bg-blue-50 rounded-lg">
               <h4 className="font-medium text-blue-900 mb-2">Resumo da Missão</h4>
               <div className="text-sm text-blue-700 space-y-1">
                 <p><strong>Total de assentos:</strong> {formData.totalSeats}</p>
                 <p><strong>Taxa de pernoite:</strong> R$ {formData.overnightFee.toFixed(2)} por pessoa</p>
                 <p><strong>Número de pernoites:</strong> {formData.departure_date && formData.return_date ? 
                   Math.max(0, Math.floor((formData.return_date.getTime() - formData.departure_date.getTime()) / (1000 * 60 * 60 * 24))) : 0}</p>
                {/* Valor total é pago pelo dono; sem per-seat aqui */}
               </div>
             </div>
           )}

          {/* Botões */}
          <div className="flex space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Missão Compartilhada'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSharedMissionForm;
