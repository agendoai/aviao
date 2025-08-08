import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Users, Plane, DollarSign, Settings, Calendar, MapPin } from 'lucide-react';

const AdminBottomNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    return tabParam === path || (path === 'dashboard' && !tabParam);
  };

  const navItems = [
    { icon: Shield, label: 'Dashboard', path: 'dashboard' },
    { icon: Users, label: 'Usuários', path: 'users' },
    { icon: Calendar, label: 'Reservas', path: 'bookings' },
    { icon: MapPin, label: 'Missões', path: 'missions' },
    { icon: Plane, label: 'Aeronaves', path: 'aircraft' },
    { icon: DollarSign, label: 'Financeiro', path: 'financial' },
    { icon: Settings, label: 'Config', path: 'settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-sky-500/30 shadow-2xl md:hidden z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const url = `/admin?tab=${item.path}`;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={url}
              className={`flex flex-col items-center py-2 px-1 min-w-0 flex-1 transition-all duration-150
                ${active ? 'text-sky-500 font-bold bg-sky-500/10 shadow-inner' : 'text-gray-500 hover:text-sky-500'}
              `}
              style={{
                borderTop: active ? '2.5px solid #0ea5e9' : '2.5px solid transparent',
                fontWeight: active ? 700 : 500
              }}
            >
              <Icon className={`mb-1 transition-all duration-150 ${active ? 'h-6 w-6' : 'h-5 w-5'}`} />
              <span className={`text-[11px] truncate ${active ? 'tracking-wide' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminBottomNav; 