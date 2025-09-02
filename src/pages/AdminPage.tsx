import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminBottomNav from '@/components/ui/AdminBottomNav';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plane, LogOut, Shield } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aviation-blue via-aviation-sky to-aviation-gold">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="text-aviation-blue h-8 w-8">⚙️</div>
            </div>
          </div>
          <div className="text-white space-y-2">
            <h2 className="text-2xl font-bold">E-Club A</h2>
            <p className="text-white/80">Carregando painel administrativo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Admin Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">E-Club A - Admin</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Painel Administrativo</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">Administrador</p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowLogoutDialog(true)}
                  className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-20 md:pb-6">
          <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm min-h-[calc(100vh-200px)]">
            <div className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                    Painel Administrativo
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Bem-vindo, {user.name} - Gerencie o sistema completo
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    ADMIN
                  </div>
                </div>
              </div>
              
              <AdminDashboard />
            </div>
          </div>
        </main>
        
        <AdminBottomNav />
      </div>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Confirmar Saída
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja sair da sua conta? Você será desconectado do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              Sim, Sair
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPage; 
