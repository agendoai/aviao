
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface Seat {
  number: number;
  row: number;
  position: string;
  type: string;
  isOccupied?: boolean;
  passenger?: string;
}

interface AircraftSeatingChartProps {
  aircraft: Aircraft;
  occupiedSeats?: number[];
  onSeatSelect?: (seatNumber: number) => void;
  selectedSeats?: number[];
}

const AircraftSeatingChart: React.FC<AircraftSeatingChartProps> = ({
  aircraft,
  occupiedSeats = [],
  onSeatSelect,
  selectedSeats = []
}) => {
  const seatConfiguration = aircraft.seat_configuration as any;
  
  if (!seatConfiguration || !seatConfiguration.seats) {
    return (
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Configuração de Assentos</CardTitle>
          <CardDescription>Configuração não disponível para esta aeronave</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">
              Capacidade: {aircraft.max_passengers} passageiros
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const seats: Seat[] = seatConfiguration.seats;
  const layout = seatConfiguration.layout || '2-2';
  const totalRows = Math.max(...seats.map(seat => seat.row));

  const getSeatStatus = (seatNumber: number) => {
    if (occupiedSeats.includes(seatNumber)) return 'occupied';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-red-500 text-white cursor-not-allowed';
      case 'selected':
        return 'bg-aviation-gold text-white cursor-pointer';
      case 'available':
        return 'bg-green-500 text-white cursor-pointer hover:bg-green-600';
      default:
        return 'bg-gray-300 text-gray-600 cursor-not-allowed';
    }
  };

  const handleSeatClick = (seatNumber: number) => {
    const status = getSeatStatus(seatNumber);
    if (status !== 'occupied' && onSeatSelect) {
      onSeatSelect(seatNumber);
    }
  };

  // Agrupar assentos por fileira
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, Seat[]>);

  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>{aircraft.name} - Mapa de Assentos</span>
        </CardTitle>
        <CardDescription>
          Layout {layout} | {aircraft.max_passengers} assentos | {aircraft.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legenda */}
        <div className="flex justify-center space-x-6 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Disponível</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-aviation-gold rounded"></div>
            <span className="text-sm">Selecionado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Ocupado</span>
          </div>
        </div>

        {/* Cockpit */}
        <div className="text-center mb-6">
          <div className="inline-block bg-gray-200 px-6 py-2 rounded-t-full">
            <span className="text-sm font-medium text-gray-600">COCKPIT</span>
          </div>
        </div>

        {/* Mapa de Assentos */}
        <div className="max-w-md mx-auto">
          {Array.from({ length: totalRows }, (_, rowIndex) => {
            const rowNumber = rowIndex + 1;
            const rowSeats = seatsByRow[rowNumber] || [];
            
            // Organizar assentos por posição (A, B, C, D)
            const leftSeats = rowSeats.filter(seat => ['A', 'B'].includes(seat.position));
            const rightSeats = rowSeats.filter(seat => ['C', 'D'].includes(seat.position));

            return (
              <div key={rowNumber} className="flex items-center justify-center mb-3">
                {/* Número da fileira */}
                <div className="w-8 text-center text-sm font-medium text-gray-600">
                  {rowNumber}
                </div>

                {/* Assentos da esquerda */}
                <div className="flex space-x-1">
                  {leftSeats.map((seat) => {
                    const status = getSeatStatus(seat.number);
                    return (
                      <button
                        key={seat.number}
                        onClick={() => handleSeatClick(seat.number)}
                        className={`w-8 h-8 rounded text-xs font-medium transition-colors ${getSeatColor(status)}`}
                        disabled={status === 'occupied'}
                        title={`Assento ${seat.number}${seat.position} - ${status === 'occupied' ? 'Ocupado' : status === 'selected' ? 'Selecionado' : 'Disponível'}`}
                      >
                        {seat.position}
                      </button>
                    );
                  })}
                </div>

                {/* Corredor */}
                <div className="w-6 text-center">
                  <div className="w-full h-px bg-gray-300"></div>
                </div>

                {/* Assentos da direita */}
                <div className="flex space-x-1">
                  {rightSeats.map((seat) => {
                    const status = getSeatStatus(seat.number);
                    return (
                      <button
                        key={seat.number}
                        onClick={() => handleSeatClick(seat.number)}
                        className={`w-8 h-8 rounded text-xs font-medium transition-colors ${getSeatColor(status)}`}
                        disabled={status === 'occupied'}
                        title={`Assento ${seat.number}${seat.position} - ${status === 'occupied' ? 'Ocupado' : status === 'selected' ? 'Selecionado' : 'Disponível'}`}
                      >
                        {seat.position}
                      </button>
                    );
                  })}
                </div>

                {/* Número da fileira (direita) */}
                <div className="w-8 text-center text-sm font-medium text-gray-600">
                  {rowNumber}
                </div>
              </div>
            );
          })}
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Ocupação: {occupiedSeats.length}/{aircraft.max_passengers} assentos</p>
          {selectedSeats.length > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-aviation-blue border-aviation-blue">
                Selecionados: {selectedSeats.join(', ')}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AircraftSeatingChart;
