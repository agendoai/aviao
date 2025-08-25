
import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { useNavigation } from '@/hooks/use-navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plane, LogOut, User, Menu, MessageCircle, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { messageCounts, loading } = useNotifications();
  const { openChatForMission } = useNavigation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  const handleNotificationClick = (missionId: number, requestId: number) => {
    openChatForMission(missionId, requestId);
    setNotificationPopoverOpen(false);
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
                {/* Notification Bell */}
                <Popover open={notificationPopoverOpen} onOpenChange={setNotificationPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {messageCounts && messageCounts.totalUnread > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                        >
                          {messageCounts.totalUnread > 99 ? '99+' : messageCounts.totalUnread}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Notificações</h4>
                        {loading && <div className="text-xs text-gray-500">Atualizando...</div>}
                      </div>
                      <Separator />
                      {messageCounts && messageCounts.totalUnread > 0 ? (
                        <div className="space-y-3">
                          {/* Mensagens não lidas como requester */}
                          {Object.entries(messageCounts.missionCounts).map(([missionId, data]) => (
                            <button
                              key={missionId}
                              onClick={() => handleNotificationClick(parseInt(missionId), data.requestId)}
                              className="w-full flex items-center justify-between p-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center space-x-2">
                                <MessageCircle className="h-4 w-4 text-orange-600" />
                                <div>
                                  <p className="text-sm font-medium">{data.title}</p>
                                  <p className="text-xs text-gray-600">{data.unreadCount} nova(s) mensagem(ns)</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                {data.unreadCount}
                              </Badge>
                            </button>
                          ))}
                          {/* Pedidos pendentes e mensagens não lidas como owner */}
                          {Object.entries(messageCounts.myMissionsCounts).map(([missionId, data]) => (
                            (data.pendingRequests > 0 || (data.unreadCount && data.unreadCount > 0)) && (
                              <button
                                key={missionId}
                                onClick={() => handleNotificationClick(parseInt(missionId), 0)} // 0 indicates navigate to mission view
                                className="w-full flex items-center justify-between p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  <MessageCircle className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium">{data.title}</p>
                                    <p className="text-xs text-gray-600">
                                      {data.pendingRequests > 0 && `${data.pendingRequests} pedido(s) pendente(s)`}
                                      {data.pendingRequests > 0 && data.unreadCount && data.unreadCount > 0 && ' • '}
                                      {data.unreadCount && data.unreadCount > 0 && `${data.unreadCount} nova(s) mensagem(ns)`}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  {(data.pendingRequests || 0) + (data.unreadCount || 0)}
                                </Badge>
                              </button>
                            )
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Nenhuma notificação</p>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs md:text-sm font-medium text-gray-900">{profile.name}</p>
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
