
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Users, MessageCircle, Plane, Bot } from 'lucide-react';
import FlightCalendar from './FlightCalendar';
import FlightSharingChat from './FlightSharingChat';
import PriorityQueue from './PriorityQueue';
import EnhancedBookingFlow from './EnhancedBookingFlow';
import ConversationalBookingFlow from './ConversationalBookingFlow';

const EnhancedBookingSystem: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('conversational');

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('enhanced');
  };

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-aviation-blue">
            Sistema de Reservas Completo
          </CardTitle>
          <CardDescription className="text-lg">
            Sistema integrado com assistente conversacional e fluxo completo de reservas
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conversational" className="flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span>Assistente</span>
          </TabsTrigger>
          <TabsTrigger value="enhanced" className="flex items-center space-x-2">
            <Plane className="h-4 w-4" />
            <span>Reserva Avançada</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4" />
            <span>Calendário</span>
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

        <TabsContent value="conversational" className="space-y-6">
          <ConversationalBookingFlow />
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedBookingFlow selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <FlightCalendar onDateSelect={handleDateSelect} />
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
          <CardTitle className="text-blue-900">🤖 Novo Assistente Conversacional</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800">
          <div>
            <h4 className="font-semibold">💬 Fluxo Conversacional</h4>
            <p className="text-sm">Interface amigável que guia o usuário passo a passo</p>
          </div>
          <div>
            <h4 className="font-semibold">📅 Calendário Visual</h4>
            <p className="text-sm">Visualização clara de datas disponíveis com cores intuitivas</p>
          </div>
          <div>
            <h4 className="font-semibold">✅ Disponibilidade em Tempo Real</h4>
            <p className="text-sm">Status de assentos disponíveis, esgotados ou últimas vagas</p>
          </div>
          <div>
            <h4 className="font-semibold">🎯 Experiência Simplificada</h4>
            <p className="text-sm">Processo de reserva intuitivo com confirmação clara</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBookingSystem;
