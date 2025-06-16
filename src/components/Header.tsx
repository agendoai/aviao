
import React from 'react';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-aviation-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">EA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">E-Club A</h1>
                <p className="text-xs text-gray-500">Elite Aero Soluções</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                Prioridade #{user.priorityPosition} | {user.membershipTier.toUpperCase()}
              </p>
            </div>
            
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
