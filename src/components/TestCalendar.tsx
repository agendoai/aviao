import React from 'react';
import SimpleCalendar from './SimpleCalendar';
import { toast } from 'sonner';

const TestCalendar: React.FC = () => {
  const handleSlotSelect = (start: Date, end: Date) => {
    console.log('🎯 Teste - Slot selecionado:', { start, end });
    toast.success(`Horário selecionado: ${start.toLocaleString()} - ${end.toLocaleString()}`);
  };

  const handleEventClick = (event: any) => {
    console.log('🎯 Teste - Evento clicado:', event);
    toast.info(`Evento: ${event.title}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Teste do Calendário Profissional</h1>
        <p className="text-gray-600">
          Este é um teste do novo calendário profissional com tratamento correto de timezone.
        </p>
      </div>

      <SimpleCalendar
        aircraftId={2} // ID da aeronave PR-FOM
        onSlotSelect={handleSlotSelect}
        onEventClick={handleEventClick}
      />
    </div>
  );
};

export default TestCalendar;
