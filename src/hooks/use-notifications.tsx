import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMessageCounts } from '@/utils/api';
import { useAuth } from './use-auth';

interface MessageCounts {
  totalUnread: number;
  missionCounts: { [missionId: number]: { title: string; unreadCount: number; requestId: number } };
  myMissionsCounts: { [missionId: number]: { title: string; totalRequests: number; pendingRequests: number; unreadCount?: number } };
}

interface NotificationContextType {
  messageCounts: MessageCounts | null;
  loading: boolean;
  refreshMessageCounts: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messageCounts, setMessageCounts] = useState<MessageCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshMessageCounts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const counts = await getMessageCounts();
      setMessageCounts(counts);
    } catch (error) {
      console.error('Erro ao buscar contagem de mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshMessageCounts();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(refreshMessageCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      messageCounts,
      loading,
      refreshMessageCounts
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
