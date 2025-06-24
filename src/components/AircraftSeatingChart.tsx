
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Users, User, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface AircraftSeatingChartProps {
  aircraft: Aircraft;
  onSeatSelect: (seatNumber: number) => void;
  selectedSeats: number[];
  onTravelModeChange?: (mode: 'solo' | 'shared') => void;
  selectedTravelMode?: 'solo' | 'shared';
}

const AircraftSeatingChart: React.FC<AircraftSeatingChartProps> = ({
  aircraft,
  onSeatSelect,
  selectedSeats,
  onTravelModeChange,
  selectedTravelMode = 'solo'
}) => {
  const { toast } = useToast();

  const handleTravelModeChange = (mode: 'solo' | 'shared') => {
    if (onTravelModeChange) {
      onTravelModeChange(mode);
    }
    
    if (mode === 'shared') {
      toast({
        title: "Modo Compartilhado Ativado",
        description: "Notificações serão enviadas para todos os filiados sobre esta oportunidade de compartilhamento.",
      });
    }
  };

  const renderSeat = (seatNumber: number) => {
    const isSelected = selectedSeats.includes(seatNumber);
    const isOccupied = false; // Aqui você implementaria a lógica para verificar se o assento está ocupado
    
    return (
      <Button
        key={seatNumber}
        variant={isSelected ? "default" : isOccupied ? "destructive" : "outline"}
        size="sm"
        className={`w-12 h-12 ${isSelected ? 'bg-aviation-blue' : ''}`}
        onClick={() => !isOccupied && onSeatSelect(seatNumber)}
        disabled={isOccupied}
      >
        {seatNumber}
      </Button>
    );
  };

  const generateSeatLayout = () => {
    const seats = [];
    const maxPassengers = aircraft.max_passengers || 8;
    
    // Layout padrão 2-2 para aeronaves menores
    const seatsPerRow = 4;
    const rows = Math.ceil(maxPassengers / seatsPerRow);
    
    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let seat = 1; seat <= seatsPerRow && (row * seatsPerRow + seat) <= maxPassengers; seat++) {
        const seatNumber = row * seatsPerRow + seat;
        rowSeats.push(renderSeat(seatNumber));
        
        // Adicionar corredor no meio
        if (seat === 2) {
          rowSeats.push(<div key={`aisle-${row}`} className="w-4" />);
        }
      }
      seats.push(
        <div key={row} className="flex items-center justify-center space-x-2 mb-2">
          {rowSeats}
        </div>
      );
    }
    
    return seats;
  };

  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Mapa de Assentos - {aircraft.name}</span>
        </CardTitle>
        <CardDescription>
          {aircraft.model} - Capacidade: {aircraft.max_passengers} passageiros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Opções de Viagem */}
        <div className="space-y-4">
          <h4 className="font-medium">Modo de Viagem:</h4>
          <RadioGroup 
            value={selectedTravelMode} 
            onValueChange={(value: 'solo' | 'shared') => handleTravelModeChange(value)}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="solo" id="solo" />
              <Label htmlFor="solo" className="flex items-center space-x-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Viajar Sozinho</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shared" id="shared" />
              <Label htmlFor="shared" className="flex items-center space-x-2 cursor-pointer">
                <Share2 className="h-4 w-4" />
                <span>Compartilhar Aeronave</span>
              </Label>
            </div>
          </RadioGroup>
          
          {selectedTravelMode === 'shared' && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-800">
                <Share2 className="h-4 w-4" />
                <span className="font-medium">Modo Compartilhado Ativo</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Todos os filiados receberão notificação sobre esta oportunidade de compartilhamento. 
                Você poderá dividir os custos proporcionalmente com outros passageiros.
              </p>
            </div>
          )}
        </div>

        {/* Mapa de Assentos */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-gray-200 p-2 rounded-t-lg mb-4">
              <span className="text-sm text-gray-600">COCKPIT</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {generateSeatLayout()}
          </div>
          
          {/* Legenda */}
          <div className="flex justify-center space-x-4 mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border border-gray-300 rounded"></div>
              <span className="text-sm">Disponível</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-aviation-blue rounded"></div>
              <span className="text-sm">Selecionado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Ocupado</span>
            </div>
          </div>
        </div>

        {/* Resumo da Seleção */}
        {selectedSeats.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Seleção Atual:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map(seat => (
                <Badge key={seat} variant="default">
                  Assento {seat}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedSeats.length} assento(s) selecionado(s) • Modo: {selectedTravelMode === 'solo' ? 'Individual' : 'Compartilhado'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AircraftSeatingChart;
