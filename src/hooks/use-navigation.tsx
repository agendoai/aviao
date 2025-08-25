import React, { createContext, useContext, useState } from 'react';

interface NavigationContextType {
  navigateToTab: (tab: string) => void;
  openChatForMission: (missionId: number, requestId: number) => void;
  pendingNavigation: {
    tab?: string;
    missionId?: number;
    requestId?: number;
  } | null;
  clearPendingNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingNavigation, setPendingNavigation] = useState<{
    tab?: string;
    missionId?: number;
    requestId?: number;
  } | null>(null);

  const navigateToTab = (tab: string) => {
    setPendingNavigation({ tab });
  };

  const openChatForMission = (missionId: number, requestId: number) => {
    setPendingNavigation({ tab: 'missions', missionId, requestId });
  };

  const clearPendingNavigation = () => {
    setPendingNavigation(null);
  };

  return (
    <NavigationContext.Provider value={{
      navigateToTab,
      openChatForMission,
      pendingNavigation,
      clearPendingNavigation
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

