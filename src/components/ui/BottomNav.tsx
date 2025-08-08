import React from 'react';
import { Home, CalendarDays, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Início', icon: Home, path: '/dashboard' },
  { label: 'Missões', icon: CalendarDays, path: '/dashboard?tab=missions' },

  { label: 'Configurações', icon: Settings, path: '/dashboard?tab=settings' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    return tabParam || 'dashboard';
  };

  const isActive = (path: string) => {
    if (path.includes('?tab=')) {
      const expectedTab = path.split('?tab=')[1];
      const currentTab = getActiveTab();
      return expectedTab === currentTab;
    }
    return location.pathname + location.search === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow z-50 flex justify-around items-center h-16 md:hidden">
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center text-xs px-2 py-1 focus:outline-none ${active ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <item.icon className={`h-6 w-6 mb-1 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav; 