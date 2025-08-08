
import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plane, LogOut, User, Wallet, Menu } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-aviation-gradient rounded-full flex items-center justify-center shadow-lg">
                <Plane className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">E-Club A</h1>
                <p className="text-[10px] md:text-xs text-gray-600 hidden sm:block">Elite Aero Soluções</p>
              </div>
            </div>
            {/* Menu sanduíche no mobile */}
            <div className="flex md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
            {/* Menu desktop */}
            {profile && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-4 bg-gray-50 rounded-lg px-3 py-1.5">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-aviation-blue" />
                    <span className="text-xs md:text-sm font-medium text-gray-900">
                      R$ {profile.balance?.toLocaleString('pt-BR') || '0'}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <div className="text-center">
                    <span className="text-[10px] md:text-xs text-gray-600">Prioridade</span>
                    <div className="text-xs md:text-sm font-bold text-aviation-blue">
                      #{profile.priority_position}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs md:text-sm font-medium text-gray-900">{profile.name}</p>
                    <p className="text-[10px] md:text-xs text-gray-600 capitalize">
                      {profile.membership_tier}
                    </p>
                  </div>
                  <Avatar className="border-2 border-aviation-blue/20">
                    <AvatarFallback className="bg-aviation-gradient text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowLogoutDialog(true)}
                  className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Menu lateral mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex">
          <div className="w-64 bg-white h-full shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-xl">×</span>
              </Button>
            </div>
            {profile && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="border-2 border-aviation-blue/20">
                    <AvatarFallback className="bg-aviation-gradient text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{profile.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{profile.membership_tier}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <Wallet className="h-4 w-4 text-aviation-blue" />
                    R$ {profile.balance?.toLocaleString('pt-BR') || '0'}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    Prioridade: <span className="font-bold text-aviation-blue">#{profile.priority_position}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setShowLogoutDialog(true); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 w-full justify-start"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </>
            )}
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

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

export default Header;
