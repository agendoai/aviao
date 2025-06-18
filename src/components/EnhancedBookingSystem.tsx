
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Users, MessageCircle } from 'lucide-react';
import FlightCalendar from './FlightCalendar';
import PreReservationSystem from './PreReservationSystem';
import FlightSharingChat from './FlightSharingChat';
import PriorityQueue from './PriorityQueue';

const EnhancedBookingSystem: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('reservation');
  };

  const handleReservationComplete = () => {
    setActiveTab('calendar');
    setSelectedDate(null);
  };

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-aviation-blue">
            Sistema de Reservas Avançado
          </CardTitle>
          <CardDescription className="text-lg">
            Sistema completo com fila de prioridades, calendário inteligente e chat integrado
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4" />
            <span>Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="reservation" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Reservar</span>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Fila de Prioridades</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <FlightCalendar onDateSelect={handleDateSelect} />
        </TabsContent>

        <TabsContent value="reservation" className="space-y-6">
          <PreReservationSystem 
            selectedDate={selectedDate}
            onReservationComplete={handleReservationComplete}
          />
        </TabsContent>

        <TabsContent value="priority" className="space-y-6">
          <PriorityQueue />
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card className="aviation-card">
            <CardHeader>
              <CardTitle>Chat de Compartilhamento</CardTitle>
              <CardDescription>
                Esta funcionalidade será ativada quando você tiver uma reserva ativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Faça uma pré-reserva para acessar o chat de compartilhamento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Informações Importantes */}
      <Card className="aviation-card bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Como Funciona o Novo Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-800">
          <div>
            <h4 className="font-semibold">🎯 Fila de Prioridades (100 Cotas)</h4>
            <p className="text-sm">Sistema fixo com 100 posições. Posição #1 tem confirmação imediata!</p>
          </div>
          <div>
            <h4 className="font-semibold">⏰ Sistema de 12h</h4>
            <p className="text-sm">Quem não está em #1 aguarda 12h para confirmação automática.</p>
          </div>
          <div>
            <h4 className="font-semibold">🔒 Bloqueio Pós-Voo</h4>
            <p className="text-sm">Aeronave fica indisponível por: duração do voo + 3h de manutenção.</p>
          </div>
          <div>
            <h4 className="font-semibold">💳 Opções de Pagamento</h4>
            <p className="text-sm">Carteira digital (sem taxa) ou cartão (+2% de taxa).</p>
          </div>
          <div>
            <h4 className="font-semibold">💬 Chat Integrado</h4>
            <p className="text-sm">Negocie compartilhamento de assentos em tempo real.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBookingSystem;
