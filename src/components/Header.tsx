
import React from 'react';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plane, LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-aviation-gradient rounded-full flex items-center justify-center">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">E-Club A</h1>
              <p className="text-xs text-gray-600">Elite Aero Soluções</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-600">
                    Prioridade #{profile.priority_position}
                  </p>
                </div>
                <Avatar>
                  <AvatarFallback className="bg-aviation-gradient text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
