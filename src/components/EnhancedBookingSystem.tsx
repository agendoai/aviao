
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Users, MessageCircle, Plane } from 'lucide-react';
import FlightCalendar from './FlightCalendar';
import PreReservationSystem from './PreReservationSystem';
import FlightSharingChat from './FlightSharingChat';
import PriorityQueue from './PriorityQueue';
import EnhancedBookingFlow from './EnhancedBookingFlow';

const EnhancedBookingSystem: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('enhanced');

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
            Sistema de Reservas Completo
          </CardTitle>
          <CardDescription className="text-lg">
            Sistema integrado com seleção de aeronave, assentos, rotas e cálculo automático de custos
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="enhanced" className="flex items-center space-x-2">
            <Plane className="h-4 w-4" />
            <span>Reserva Completa</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4" />
            <span>Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="reservation" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pré-Reserva</span>
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

        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedBookingFlow />
        </TabsContent>

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
                <p>Faça uma reserva para acessar o chat de compartilhamento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Informações do Sistema Aprimorado */}
      <Card className="aviation-card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">🚁 Sistema Aprimorado - Principais Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800">
          <div>
            <h4 className="font-semibold">✈️ Seleção Inteligente de Aeronave</h4>
            <p className="text-sm">Visualização completa com capacidade, autonomia e custos por hora</p>
          </div>
          <div>
            <h4 className="font-semibold">🪑 Mapa de Assentos Interativo</h4>
            <p className="text-sm">Seleção visual de assentos com status em tempo real</p>
          </div>
          <div>
            <h4 className="font-semibold">🗺️ Construtor de Rotas</h4>
            <p className="text-sm">Defina escalas com retorno automático à base</p>
          </div>
          <div>
            <h4 className="font-semibold">💰 Cálculo Automático de Custos</h4>
            <p className="text-sm">Horas de voo, taxas aeroportuárias e pernoites automáticos</p>
          </div>
          <div>
            <h4 className="font-semibold">🌙 Detecção de Pernoite</h4>
            <p className="text-sm">Cobrança automática quando há passagem de meia-noite</p>
          </div>
          <div>
            <h4 className="font-semibold">📊 Resumo Financeiro Detalhado</h4>
            <p className="text-sm">Breakdown completo de custos por trecho e categoria</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBookingSystem;
