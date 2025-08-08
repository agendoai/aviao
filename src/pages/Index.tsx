
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import MissionSystem from '../components/mission/MissionSystem';
import PriorityQueue from '../components/PriorityQueue';

import SettingsSection from '../components/settings/SettingsSection';
import AdminDashboard from '../components/admin/AdminDashboard';
import OwnerDashboard from '../components/owner/OwnerDashboard';
import PaymentManager from '../components/payments/PaymentManager';
import BottomNav from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, BarChart3, Settings, Home, Users, Plane, CreditCard } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Detectar parâmetro de URL para definir aba ativa
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('dashboard');
    }
  }, [location.search]); // Adicionar location.search como dependência

  // Atualizar URL quando aba mudar
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aviation-blue via-aviation-sky to-aviation-gold">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Plane className="text-aviation-blue h-8 w-8" />
            </div>
          </div>
          <div className="text-white space-y-2">
            <h2 className="text-2xl font-bold">E-Club A</h2>
            <p className="text-white/80">Carregando sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Definir tabs baseadas no role do usuário
  const getUserTabs = () => {
    const baseTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'missions', label: 'Missões', icon: CalendarDays },
      { id: 'settings', label: 'Configurações', icon: Settings }
    ];

    // Adicionar tabs específicas por role
    if (user.role === 'owner' || user.role === 'admin') {
      baseTabs.splice(-1, 0, { id: 'owner', label: 'Proprietário', icon: Plane });
    }

    return baseTabs;
  };

  const tabs = getUserTabs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 lg:flex lg:w-auto bg-white/80 backdrop-blur border shadow-sm">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className="flex items-center justify-center sm:justify-start space-x-2 data-[state=active]:bg-aviation-gradient data-[state=active]:text-white"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs lg:text-sm">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm min-h-[calc(100vh-200px)]">
            <TabsContent value="dashboard" className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Bem-vindo, {user.name}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {user.role === 'admin' && 'Painel administrativo - Gerencie o sistema completo'}
                    {user.role === 'owner' && 'Dashboard do proprietário - Gerencie suas aeronaves'}
                    {user.role === 'client' && 'Gerencie suas missões e acompanhe sua posição de prioridade'}
                  </p>
                </div>
              </div>
              <Dashboard />
            </TabsContent>

            <TabsContent value="missions" className="space-y-6 p-6">
              <MissionSystem />
            </TabsContent>

            {/* Removido: aba de Prioridades */}
            {/* <TabsContent value="priority" className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Fila de Prioridades
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Acompanhe sua posição e a de todos os membros do clube
                  </p>
                </div>
              </div>
              <PriorityQueue />
            </TabsContent> */}

            {/* Removido: aba de Pagamentos */}
            {/* <TabsContent value="payments" className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gestão de Pagamentos
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Gerencie seu saldo, métodos de pagamento e histórico de transações
                  </p>
                </div>
              </div>
              <PaymentManager />
            </TabsContent> */}



            {(user.role === 'owner' || user.role === 'admin') && (
              <TabsContent value="owner" className="space-y-6 p-6">
                <OwnerDashboard />
              </TabsContent>
            )}

            <TabsContent value="settings" className="space-y-6 p-6">
              <SettingsSection />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
