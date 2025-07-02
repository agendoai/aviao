
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AvailableDay {
  day: number;
  available: boolean;
  lastSeats?: boolean;
}

interface CalendarStepProps {
  title: string;
  subtitle: string;
  currentMonth: Date;
  availableDays: AvailableDay[];
  aircraftName?: string;
  selectedSeats?: number[];
  onMonthChange: (direction: 'prev' | 'next') => void;
  onDateSelect: (day: number) => void;
}

const CalendarStep: React.FC<CalendarStepProps> = ({
  title,
  subtitle,
  currentMonth,
  availableDays,
  aircraftName,
  selectedSeats,
  onMonthChange,
  onDateSelect
}) => {
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    
    const calendarDays = [];
    
    // Adicionar dias vazios antes do primeiro dia do mês
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Adicionar os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dayInfo = availableDays.find(d => d.day === day);
      if (!dayInfo) continue;
      
      calendarDays.push(
        <Button
          key={day}
          variant={dayInfo.available ? "outline" : "secondary"}
          disabled={!dayInfo.available}
          onClick={() => onDateSelect(day)}
          className={`h-10 text-sm relative ${
            dayInfo.available 
              ? dayInfo.lastSeats 
                ? 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100' 
                : 'border-green-400 bg-green-50 hover:bg-green-100'
              : 'bg-red-50 border-red-200 cursor-not-allowed'
          }`}
        >
          <span className="mr-1">
            {dayInfo.available ? '✅' : '❌'}
          </span>
          {day}
          {dayInfo.lastSeats && (
            <span className="absolute -top-1 -right-1 text-xs">⚠️</span>
          )}
        </Button>
      );
    }
    
    return calendarDays;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600">{subtitle}</p>
        {aircraftName && selectedSeats && (
          <Badge variant="outline" className="mt-2">
            Aeronave: {aircraftName} | Assentos: {selectedSeats.join(', ')}
          </Badge>
        )}
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => onMonthChange('prev')}
          >
            ← Mês Anterior
          </Button>
          <h3 className="text-xl font-semibold capitalize">
            {getMonthName(currentMonth)}
          </h3>
          <Button
            variant="outline"
            onClick={() => onMonthChange('next')}
          >
            Próximo Mês →
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
        
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
          <div className="flex items-center space-x-1">
            <span>✅</span>
            <span>Disponível</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>❌</span>
            <span>Esgotado</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⚠️</span>
            <span>Últimos assentos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarStep;
