import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  label: string;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  disabled?: (date: Date) => boolean;
  minDate?: Date;
  className?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  disabled,
  minDate,
  className
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(date ? new Date(date) : new Date());
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(format(selectedDate, 'yyyy-MM-dd'));
      setCurrentMonth(selectedDate);
      setIsOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (!minDate || today >= minDate) {
      onDateChange(format(today, 'yyyy-MM-dd'));
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                format(new Date(date), 'PPP', { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateYear('prev')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateYear('next')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="w-full text-xs"
              >
                Ir para Hoje
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={date ? new Date(date) : undefined}
              onSelect={handleDateSelect}
              disabled={disabled || ((date) => minDate ? date < minDate : date < new Date())}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default DateTimePicker;



