
import React from 'react';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plane, LogOut, User, Wallet } from 'lucide-react';

const Header: React.FC = () => {
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-aviation-gradient rounded-full flex items-center justify-center shadow-lg">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">E-Club A</h1>
              <p className="text-xs text-gray-600 hidden sm:block">Elite Aero Soluções</p>
            </div>
          </div>

          {profile && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-aviation-blue" />
                  <span className="text-sm font-medium text-gray-900">
                    R$ {profile.balance?.toLocaleString('pt-BR') || '0'}
                  </span>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="text-center">
                  <span className="text-xs text-gray-600">Prioridade</span>
                  <div className="text-sm font-bold text-aviation-blue">
                    #{profile.priority_position}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-600 capitalize">
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
                onClick={handleLogout}
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
  );
};

export default Header;
