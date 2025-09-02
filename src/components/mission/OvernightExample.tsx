import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Moon, Sun } from 'lucide-react';

interface OvernightExampleProps {
  className?: string;
}

const OvernightExample: React.FC<OvernightExampleProps> = ({ className }) => {
  const examples = [
    {
      departure: '18:00',
      return: '02:00',
      hasOvernight: true,
      description: 'Saída 18h, Retorno 02h = Pernoite'
    },
    {
      departure: '08:00',
      return: '16:00',
      hasOvernight: false,
      description: 'Saída 08h, Retorno 16h = Sem pernoite'
    },
    {
      departure: '23:00',
      return: '01:00',
      hasOvernight: true,
      description: 'Saída 23h, Retorno 01h = Pernoite'
    },
    {
      departure: '06:00',
      return: '14:00',
      hasOvernight: false,
      description: 'Saída 06h, Retorno 14h = Sem pernoite'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Moon className="h-4 w-4 text-orange-500" />
          <span>Quando há Pernoite?</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {examples.map((example, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-xs">
                  {example.departure} → {example.return}
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  example.hasOvernight 
                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}
              >
                {example.hasOvernight ? (
                  <>
                    <Moon className="h-3 w-3 mr-1" />
                    Pernoite
                  </>
                ) : (
                  <>
                    <Sun className="h-3 w-3 mr-1" />
                    Sem pernoite
                  </>
                )}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
          <strong>Regra:</strong> Pernoite é cobrado quando o horário de retorno é menor que o de saída (passou da meia-noite)
        </div>
      </CardContent>
    </Card>
  );
};

export default OvernightExample; 
