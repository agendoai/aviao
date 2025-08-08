import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { addDays, addHours, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ban, Calendar as CalendarIcon, CheckCircle, Lock, Unlock, Plane, Loader2 } from 'lucide-react';
import { getAllAircrafts, getCalendar, blockTimeSlot, unblockTimeSlot } from '@/utils/api';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

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
  status: string;
  origin: string;
  destination: string;
}

const ScheduleManagement: React.FC = () => {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState('Bloqueio');
  const defaultDayConfig = {
    active: false,
    startHour: 6,
    endHour: 18,
  };
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
    1: { active: true, startHour: 6, endHour: 18 },
    2: { active: true, startHour: 6, endHour: 18 },
    3: { active: true, startHour: 6, endHour: 18 },
    4: { active: true, startHour: 6, endHour: 18 },
    5: { active: true, startHour: 6, endHour: 18 },
    6: { active: false, startHour: 6, endHour: 18 },
    0: { active: false, startHour: 6, endHour: 18 },
  });
  const [recurrenceStart, setRecurrenceStart] = useState(new Date());
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false);

  const weekDays = useMemo(() => {
    return weekDayLabels.map(({ d }) => addDays(weekStart, d));
  }, [weekStart]);

  const hours = useMemo(() => {
    // Pega o menor start e maior end dos dias ativos para montar a tabela
    const activeDays = Object.values(daysConfig).filter(d => d.active);
    if (activeDays.length === 0) return [];
    const minStart = Math.min(...activeDays.map(d => d.startHour));
    const maxEnd = Math.max(...activeDays.map(d => d.endHour));
    return Array.from({ length: (maxEnd - minStart) + 1 }, (_, i) => minStart + i);
  }, [daysConfig]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const ac = await getAllAircrafts();
        setAircrafts(ac);
        if (ac.length > 0 && selectedAircraftId == null) setSelectedAircraftId(ac[0].id);
        const cal = await getCalendar();
        setCalendar(cal);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [selectedAircraftId, weekStart]);

  const entriesFor = (aircraftId: number, day: Date, hour: number) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = addHours(slotStart, 1);
    return calendar.find(e => e.aircraftId === aircraftId &&
      new Date(e.departure_date) < slotEnd && new Date(e.return_date) > slotStart);
  };

  const isBlocked = (entry?: CalendarEntry) => entry && entry.status === 'blocked';

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
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (entry: CalendarEntry) => {
    await unblockTimeSlot(entry.id);
    const cal = await getCalendar();
    setCalendar(cal);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Gerenciar Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Aeronave</Label>
              <Select value={selectedAircraftId?.toString()} onValueChange={(v) => setSelectedAircraftId(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {aircrafts.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Plane className="h-3 w-3" />
                        {a.model} • {a.registration}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de início da agenda</Label>
              <Popover open={calendarPickerOpen} onOpenChange={setCalendarPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(recurrenceStart, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <DatePicker
                    mode="single"
                    selected={recurrenceStart}
                    onSelect={date => { if (date) setRecurrenceStart(date); setCalendarPickerOpen(false); }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: Manutenção, Evento, etc." />
            </div>
          </div>

          {/* Ajuste do grid dos cards dos dias da semana */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-2">
            {weekDayLabels.map(({ d, label }) => (
              <Card key={d} className={daysConfig[d]?.active ? 'border-sky-500' : 'border-gray-200 opacity-60'} style={{ minWidth: 0 }}>
                <CardHeader className="pb-1 flex flex-row items-center justify-between px-2 py-1">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    {label}
                  </CardTitle>
                  <Checkbox
                    checked={!!daysConfig[d]?.active}
                    onCheckedChange={v => setDaysConfig(prev => ({
                      ...prev,
                      [d]: { ...prev[d], active: Boolean(v) },
                    }))}
                    className="scale-90"
                  />
                </CardHeader>
                <CardContent className="flex flex-col gap-1 px-2 py-1">
                  <Label className="text-[10px]">Hora inicial</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={daysConfig[d]?.startHour}
                    disabled={!daysConfig[d]?.active}
                    onChange={e => setDaysConfig(prev => ({
                      ...prev,
                      [d]: { ...prev[d], startHour: parseInt(e.target.value) || 0 },
                    }))}
                    className="h-7 text-xs px-2"
                  />
                  <Label className="text-[10px]">Hora final</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={daysConfig[d]?.endHour}
                    disabled={!daysConfig[d]?.active}
                    onChange={e => setDaysConfig(prev => ({
                      ...prev,
                      [d]: { ...prev[d], endHour: parseInt(e.target.value) || 0 },
                    }))}
                    className="h-7 text-xs px-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ajuste do botão */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={async () => {
                if (!selectedAircraftId) return;
                // Chamar API para gerar time slots recorrentes para a aeronave
                await fetch(`/api/calendar/generate`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  },
                  body: JSON.stringify({
                    aircraftId: selectedAircraftId,
                    startDate: recurrenceStart,
                    daysConfig,
                  }),
                });
                // Opcional: mostrar toast de sucesso
              }}
              className="flex items-center gap-2 h-8 text-xs px-3"
            >
              Gerar Agenda Recorrente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ajuste do aviso final */}
      <div className="mt-4 text-xs text-gray-500 italic text-center">A agenda será gerada automaticamente para a aeronave selecionada, a partir da data escolhida, seguindo a configuração dos dias e horários acima. Recomenda-se revisar bloqueios e exceções após a geração.</div>
    </div>
  );
};

export default ScheduleManagement;


