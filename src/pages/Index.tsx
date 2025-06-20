
import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import EnhancedBookingSystem from '../components/EnhancedBookingSystem';
import PriorityQueue from '../components/PriorityQueue';
import ReportsSection from '../components/reports/ReportsSection';
import SettingsSection from '../components/settings/SettingsSection';
import AdminDashboard from '../components/admin/AdminDashboard';
import OwnerDashboard from '../components/owner/OwnerDashboard';
import PaymentManager from '../components/payments/PaymentManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, BarChart3, Settings, Home, Users, Shield, Plane, CreditCard } from 'lucide-react';

const Index = () => {
  const { profile, isLoading } = useAuth();
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

  if (!profile) {
    return <LoginForm />;
  }

  // Definir tabs baseadas no role do usuário
  const getUserTabs = () => {
    const baseTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'booking', label: 'Reservas', icon: CalendarDays },
      { id: 'priority', label: 'Prioridades', icon: Users },
      { id: 'payments', label: 'Pagamentos', icon: CreditCard },
      { id: 'reports', label: 'Relatórios', icon: BarChart3 },
      { id: 'settings', label: 'Config', icon: Settings }
    ];

    // Adicionar tabs específicas por role
    if (profile.role === 'admin') {
      baseTabs.splice(-1, 0, { id: 'admin', label: 'Admin', icon: Shield });
    }
    
    if (profile.role === 'owner' || profile.role === 'admin') {
      baseTabs.splice(-1, 0, { id: 'owner', label: 'Proprietário', icon: Plane });
    }

    return baseTabs;
  };

  const tabs = getUserTabs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-${tabs.length} lg:w-auto`}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bem-vindo, {profile.name}
                </h1>
                <p className="text-gray-600">
                  {profile.role === 'admin' && 'Painel administrativo - Gerencie o sistema completo'}
                  {profile.role === 'owner' && 'Dashboard do proprietário - Gerencie suas aeronaves'}
                  {profile.role === 'client' && 'Gerencie suas reservas e acompanhe sua posição de prioridade'}
                </p>
              </div>
            </div>
            <Dashboard />
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Sistema de Reservas Aprimorado
                </h1>
                <p className="text-gray-600">
                  Sistema completo com seleção de aeronave, assentos, rotas e cálculo automático de custos
                </p>
              </div>
            </div>
            <EnhancedBookingSystem />
          </TabsContent>

          <TabsContent value="priority" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Fila de Prioridades
                </h1>
                <p className="text-gray-600">
                  Acompanhe sua posição e a de todos os membros do clube
                </p>
              </div>
            </div>
            <PriorityQueue />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestão de Pagamentos
                </h1>
                <p className="text-gray-600">
                  Gerencie seu saldo, métodos de pagamento e histórico de transações
                </p>
              </div>
            </div>
            <PaymentManager />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Relatórios e Analytics
                </h1>
                <p className="text-gray-600">
                  Análise detalhada de uso, custos e estatísticas de voo
                </p>
              </div>
            </div>
            <ReportsSection />
          </TabsContent>

          {profile.role === 'admin' && (
            <TabsContent value="admin" className="space-y-6">
              <AdminDashboard />
            </TabsContent>
          )}

          {(profile.role === 'owner' || profile.role === 'admin') && (
            <TabsContent value="owner" className="space-y-6">
              <OwnerDashboard />
            </TabsContent>
          )}

          <TabsContent value="settings" className="space-y-6">
            <SettingsSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
