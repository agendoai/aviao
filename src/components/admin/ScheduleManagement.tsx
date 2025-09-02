import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { addDays, addHours, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ban, Calendar as CalendarIcon, CheckCircle, Lock, Unlock, Plane, Loader2, Clock, Wrench, Settings } from 'lucide-react';
import { getAllAircrafts, getCalendar, blockTimeSlot, unblockTimeSlot } from '@/utils/api';
import { buildApiUrl } from '@/config/api';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
}

interface CalendarEntry {
  id: number;
  aircraftId: number;
  departure_date: string;
  return_date: string;
  origin: string;
  destination: string;
  status: string;
  blocked_until?: string;
}

const ScheduleManagement: React.FC = () => {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState('Bloqueio');
  
  // Novos estados para bloqueio manual
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState<Date>(new Date());
  const [blockStartTime, setBlockStartTime] = useState('06:00');
  const [blockEndDate, setBlockEndDate] = useState<Date>(new Date());
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockReason, setBlockReason] = useState('Manutenção');
  const [includeMaintenance, setIncludeMaintenance] = useState(true);
  const [maintenanceHours, setMaintenanceHours] = useState(3);

  // Estados para configuração da agenda
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [scheduleStartDate, setScheduleStartDate] = useState<Date>(new Date());
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  const weekDayLabels = [
    { d: 0, label: 'Domingo' },
    { d: 1, label: 'Segunda' },
    { d: 2, label: 'Terça' },
    { d: 3, label: 'Quarta' },
    { d: 4, label: 'Quinta' },
    { d: 5, label: 'Sexta' },
    { d: 6, label: 'Sábado' },
  ];

  const [daysConfig, setDaysConfig] = useState<Record<number, { active: boolean; startHour: number; endHour: number }>>({
    1: { active: true, startHour: 6, endHour: 18 }, // Segunda
    2: { active: true, startHour: 6, endHour: 18 }, // Terça
    3: { active: true, startHour: 6, endHour: 18 }, // Quarta
    4: { active: true, startHour: 6, endHour: 18 }, // Quinta
    5: { active: true, startHour: 6, endHour: 18 }, // Sexta
    6: { active: false, startHour: 6, endHour: 18 }, // Sábado
    0: { active: false, startHour: 6, endHour: 18 }, // Domingo
  });
  
  const [recurrenceStart, setRecurrenceStart] = useState(new Date());
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false);

  const weekDays = useMemo(() => {
    return weekDayLabels.map(({ d }) => addDays(weekStart, d));
  }, [weekStart]);

  const hours = useMemo(() => {
    // Pega o menor start e maior end dos dias ativos para montar a tabela
    const activeConfigs = Object.values(daysConfig).filter(c => c.active);
    if (activeConfigs.length === 0) return [];
    
    const minStart = Math.min(...activeConfigs.map(c => c.startHour));
    const maxEnd = Math.max(...activeConfigs.map(c => c.endHour));
    
    return Array.from({ length: maxEnd - minStart }, (_, i) => minStart + i);
  }, [daysConfig]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [aircraftsData, calendarData] = await Promise.all([
          getAllAircrafts(),
          getCalendar()
        ]);
        setAircrafts(aircraftsData);
        setCalendar(calendarData);
        if (aircraftsData.length > 0 && !selectedAircraftId) {
          setSelectedAircraftId(aircraftsData[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEntryForSlot = (day: Date, hour: number): CalendarEntry | undefined => {
    return calendar.find(entry => {
      if (entry.aircraftId !== selectedAircraftId) return false;
      
      const entryStart = new Date(entry.departure_date);
      const entryEnd = new Date(entry.return_date);
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(day);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      return entryStart < slotEnd && entryEnd > slotStart;
    });
  };

  const isAvailable = (entry?: CalendarEntry) => entry && entry.status === 'available';

  const handleBlock = async () => {
    if (!selectedAircraftId) return;
    setBlocking(true);
    try {
      const promises: Promise<any>[] = [];
      weekDays.forEach(day => {
        const weekday = day.getDay();
        if (!daysConfig[weekday]?.active) return;
        const start = new Date(day);
        start.setHours(daysConfig[weekday]?.startHour || 0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(daysConfig[weekday]?.endHour || 0, 0, 0, 0);
        promises.push(blockTimeSlot({ aircraftId: selectedAircraftId, start: start.toISOString(), end: end.toISOString(), reason }));
      });
      await Promise.all(promises);
      const cal = await getCalendar();
      setCalendar(cal);
      toast.success('Horários bloqueados com sucesso!');
    } catch (error) {
      toast.error('Erro ao bloquear horários');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (entry: CalendarEntry) => {
    try {
    await unblockTimeSlot(entry.id);
    const cal = await getCalendar();
    setCalendar(cal);
      toast.success('Bloqueio removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover bloqueio');
    }
  };

  // Nova função para bloquear horário manual com manutenção
  const handleManualBlock = async () => {
    if (!selectedAircraftId) {
      toast.error('Selecione uma aeronave');
      return;
    }

    try {
      setBlocking(true);
      
      // Converter datas para UTC (usuário já inseriu horário brasileiro)
      const startDateTime = new Date(`${format(blockStartDate, 'yyyy-MM-dd')}T${blockStartTime}:00`);
      const endDateTime = new Date(`${format(blockEndDate, 'yyyy-MM-dd')}T${blockEndTime}:00`);
      
      // Como o usuário já inseriu horário brasileiro, só precisamos criar o ISO string
      const startUTC = startDateTime.toISOString();
      let endUTC = endDateTime.toISOString();
      
      // Se incluir manutenção, adicionar as horas extras
      if (includeMaintenance) {
        const maintenanceEnd = new Date(endDateTime.getTime() + (maintenanceHours * 60 * 60 * 1000));
        endUTC = maintenanceEnd.toISOString();
      }
      
      // console.log('🔒 Bloqueando horário:', {
      //   start: startUTC,
      //   end: endUTC,
      //   reason: blockReason,
      //   includeMaintenance
      // });
      
      await blockTimeSlot({
        aircraftId: selectedAircraftId,
        start: startUTC,
        end: endUTC,
        reason: blockReason
      });
      
      const cal = await getCalendar();
      setCalendar(cal);
      
      setShowBlockDialog(false);
      toast.success('Horário bloqueado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao bloquear horário:', error);
      toast.error('Erro ao bloquear horário');
    } finally {
      setBlocking(false);
    }
  };

  // Função para configurar agenda permanente
  const handleGenerateSchedule = async () => {
    if (!selectedAircraftId) {
      toast.error('Selecione uma aeronave');
      return;
    }

    try {
      setGeneratingSchedule(true);
      
      await fetch(buildApiUrl('/api/calendar/config'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          aircraftId: selectedAircraftId,
          daysConfig,
        }),
      });
      
      const cal = await getCalendar();
      setCalendar(cal);
      setShowScheduleConfig(false);
      toast.success('Agenda permanente configurada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar agenda:', error);
      toast.error('Erro ao configurar agenda permanente');
    } finally {
      setGeneratingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="schedule">Configurar Agenda</TabsTrigger>
          <TabsTrigger value="blocks">Bloqueios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Seletor de Aeronave */}
      <Card>
        <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plane className="h-5 w-5 text-sky-600" />
                <span>Gerenciamento de Agenda</span>
          </CardTitle>
        </CardHeader>
            <CardContent>
              <div className="space-y-4">
            <div>
                  <Label htmlFor="aircraft">Aeronave</Label>
                  <Select value={selectedAircraftId?.toString() || ''} onValueChange={(value) => setSelectedAircraftId(parseInt(value))}>
                <SelectTrigger>
                      <SelectValue placeholder="Selecione uma aeronave" />
                </SelectTrigger>
                <SelectContent>
                      {aircrafts.map((aircraft) => (
                        <SelectItem key={aircraft.id} value={aircraft.id.toString()}>
                          {aircraft.name} ({aircraft.registration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configurar Agenda Base
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Configure os dias e horários disponíveis para agendamento
                      </p>
                      <Button 
                        onClick={() => setShowScheduleConfig(true)}
                        className="w-full"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Bloqueios Manuais
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Bloqueie horários específicos (manutenção, missões, etc.)
                      </p>
                      <Button 
                        onClick={() => setShowBlockDialog(true)}
                        className="w-full"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Bloquear Horário
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-sky-600" />
                <span>Configurar Agenda Base</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
            <div>
                  <Label className="text-base font-medium">Data de Início da Agenda</Label>
                  <p className="text-sm text-gray-600 mb-2">Escolha a partir de quando a agenda será gerada</p>
              <Popover open={calendarPickerOpen} onOpenChange={setCalendarPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(scheduleStartDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <DatePicker
                    mode="single"
                        selected={scheduleStartDate}
                        onSelect={date => { if (date) setScheduleStartDate(date); setCalendarPickerOpen(false); }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
                  <Label className="text-base font-medium">Configurar Horários por Dia da Semana</Label>
                  <p className="text-sm text-gray-600 mb-4">Ative os dias e configure os horários de funcionamento</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekDayLabels.map(({ d, label }) => (
                      <Card key={d} className={`${daysConfig[d]?.active ? 'border-sky-500 bg-sky-50' : 'border-gray-200'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Checkbox
                    checked={!!daysConfig[d]?.active}
                    onCheckedChange={v => setDaysConfig(prev => ({
                      ...prev,
                      [d]: { ...prev[d], active: Boolean(v) },
                    }))}
                  />
                          </div>
                </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-gray-700">Horário de Início</Label>
                              <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                                  value={daysConfig[d]?.startHour || 6}
                    disabled={!daysConfig[d]?.active}
                    onChange={e => setDaysConfig(prev => ({
                      ...prev,
                                    [d]: { ...prev[d], startHour: parseInt(e.target.value) || 6 },
                                  }))}
                                  className="h-9 text-sm"
                                  placeholder="6"
                                />
                                <span className="text-xs text-gray-500">horas</span>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-gray-700">Horário de Fim</Label>
                              <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                                  value={daysConfig[d]?.endHour || 18}
                    disabled={!daysConfig[d]?.active}
                    onChange={e => setDaysConfig(prev => ({
                      ...prev,
                                    [d]: { ...prev[d], endHour: parseInt(e.target.value) || 18 },
                                  }))}
                                  className="h-9 text-sm"
                                  placeholder="18"
                                />
                                <span className="text-xs text-gray-500">horas</span>
                              </div>
                            </div>
                            
                            {daysConfig[d]?.active && (
                              <div className="pt-2 border-t">
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Período:</span> {daysConfig[d]?.startHour || 6}:00 - {daysConfig[d]?.endHour || 18}:00
                                </div>
                                <div className="text-xs text-gray-500">
                                  ({((daysConfig[d]?.endHour || 18) - (daysConfig[d]?.startHour || 6))} horas disponíveis)
                                </div>
                              </div>
                            )}
                          </div>
                </CardContent>
              </Card>
            ))}
                  </div>
          </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900">Resumo da Configuração</h4>
                      <div className="mt-2 text-sm text-blue-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {weekDayLabels.map(({ d, label }) => {
                            const config = daysConfig[d];
                            if (!config?.active) return null;
                        return (
                              <div key={d} className="flex justify-between">
                                <span>{label}:</span>
                                <span className="font-medium">{config.startHour}:00 - {config.endHour}:00</span>
                          </div>
                        );
                      })}
                        </div>
                        {Object.values(daysConfig).filter(c => c.active).length === 0 && (
                          <p className="text-blue-600 italic">Nenhum dia configurado ainda</p>
                        )}
                      </div>
                </div>
              </div>
            </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleGenerateSchedule}
                    disabled={generatingSchedule || !selectedAircraftId || Object.values(daysConfig).filter(c => c.active).length === 0}
                    className="flex items-center gap-2"
                  >
                    {generatingSchedule ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando Agenda...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4" />
                        Configurar Agenda Permanente
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-sky-600" />
                <span>Bloqueios Manuais</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Bloqueie horários específicos para manutenção, missões ou outros motivos.
                </p>
                
            <Button
                  onClick={() => setShowBlockDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Novo Bloqueio
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Calendário Semanal */}
      {selectedAircraftId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Agenda Semanal</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekStart(addDays(weekStart, -7))}
                >
                  Semana Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  {format(weekStart, 'dd/MM/yyyy', { locale: ptBR })} - {format(addDays(weekStart, 6), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekStart(addDays(weekStart, 7))}
                >
                  Próxima Semana
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-xs">Hora</th>
                    {weekDayLabels.map(({ d, label }) => (
                      <th key={d} className="border p-2 text-xs">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map(hour => (
                    <tr key={hour}>
                      <td className="border p-2 text-xs font-medium">
                        {hour.toString().padStart(2, '0')}:00
                      </td>
                      {weekDays.map((day, dayIndex) => {
                        const entry = getEntryForSlot(day, hour);
                        const isBlocked = entry && entry.status === 'blocked';
                        const isAvailable = entry && entry.status === 'available';
                        const isBooked = entry && ['pendente', 'confirmada', 'paga'].includes(entry.status);
                        
                        return (
                          <td key={dayIndex} className="border p-2 text-xs">
                            {entry ? (
                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${
                                  isBlocked ? 'text-red-600' :
                                  isBooked ? 'text-blue-600' :
                                  'text-green-600'
                                }`}>
                                  {isBlocked ? '🔒' : isBooked ? '✈️' : '✅'}
                                </span>
                                {isBlocked && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUnblock(entry)}
                                    className="h-4 w-4 p-0"
                                  >
                                    <Unlock className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para Bloqueio Manual */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear Horário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={format(blockStartDate, 'yyyy-MM-dd')}
                  onChange={(e) => setBlockStartDate(new Date(e.target.value))}
                />
              </div>
              <div>
                <Label>Hora Início</Label>
                <Input
                  type="time"
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={format(blockEndDate, 'yyyy-MM-dd')}
                  onChange={(e) => setBlockEndDate(new Date(e.target.value))}
                />
              </div>
              <div>
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={blockEndTime}
                  onChange={(e) => setBlockEndTime(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label>Motivo</Label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Manutenção, Missão, etc."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMaintenance"
                checked={includeMaintenance}
                onCheckedChange={(checked) => setIncludeMaintenance(checked as boolean)}
              />
              <Label htmlFor="includeMaintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Incluir tempo de manutenção (+{maintenanceHours}h)
              </Label>
            </div>
            
            {includeMaintenance && (
              <div>
                <Label>Horas de Manutenção</Label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={maintenanceHours}
                  onChange={(e) => setMaintenanceHours(parseInt(e.target.value))}
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleManualBlock} disabled={blocking}>
                {blocking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Bloqueando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Bloquear
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-4 text-xs text-gray-500 italic text-center">
        Configure a agenda base primeiro para definir os horários disponíveis. Depois use bloqueios para reservar horários específicos.
      </div>
    </div>
  );
};

export default ScheduleManagement;


