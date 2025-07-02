
import React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeSelectionStepProps {
  title: string;
  selectedDate: string;
  currentMonth: Date;
  onTimeSelect: (time: string) => void;
}

const TimeSelectionStep: React.FC<TimeSelectionStepProps> = ({
  title,
  selectedDate,
  currentMonth,
  onTimeSelect
}) => {
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600">
          Data selecionada: {selectedDate}/{currentMonth.getFullYear()}
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-4 gap-3">
          {timeSlots.map(time => (
            <Button
              key={time}
              variant="outline"
              onClick={() => onTimeSelect(time)}
              className="h-12 text-sm hover:bg-aviation-blue hover:text-white transition-colors"
            >
              {time}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeSelectionStep;
