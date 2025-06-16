
import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import BookingSystem from '../components/BookingSystem';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, BarChart3, Settings, Home } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center aviation-gradient">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-12 h-12 bg-aviation-gradient rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">EA</span>
            </div>
          </div>
          <p className="text-white">Carregando E-Club A...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-400">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Reservas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bem-vindo, {user.name}
                </h1>
                <p className="text-gray-600">
                  Gerencie suas reservas e acompanhe sua posição de prioridade
                </p>
              </div>
            </div>
            <Dashboard />
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Sistema de Reservas
                </h1>
                <p className="text-gray-600">
                  Planeje sua próxima missão com nossa aeronave
                </p>
              </div>
            </div>
            <BookingSystem />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Relatórios em Desenvolvimento
              </h3>
              <p className="text-gray-600">
                Relatórios detalhados de uso, custos e estatísticas estarão disponíveis em breve.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configurações
              </h3>
              <p className="text-gray-600">
                Configurações de perfil e preferências estarão disponíveis em breve.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
