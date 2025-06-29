import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Users, TrendingUp, Clock, Star, Trophy, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProfileWithRole, PriorityRotationResponse } from '@/types/supabase-extended';

const PriorityQueue: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [allProfiles, setAllProfiles] = useState<ProfileWithRole[]>([]);
  const [nextRotation, setNextRotation] = useState<Date | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    fetchAllProfiles();
    calculateNextRotation();
    
    const interval = setInterval(calculateNextRotation, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('priority_position', { ascending: true });

      if (error) throw error;
      if (data) {
        // Type assertion since we know the data includes the role field
        setAllProfiles(data as ProfileWithRole[]);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de prioridades.",
        variant: "destructive"
      });
    }
  };

  const calculateNextRotation = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setNextRotation(tomorrow);
  };

  const getTimeUntilRotation = () => {
    if (!nextRotation) return '';
    
    const now = new Date();
    const diff = nextRotation.getTime() - now.getTime();
    
    if (diff <= 0) return 'Rotacionando...';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'vip':
        return { 
          label: 'VIP', 
          color: 'bg-gradient-to-r from-purple-500 to-pink-500', 
          icon: Crown,
          benefits: 'Acesso prioritário'
        };
      case 'premium':
        return { 
          label: 'Premium', 
          color: 'bg-gradient-to-r from-yellow-400 to-orange-500', 
          icon: Star,
          benefits: 'Benefícios especiais'
        };
      default:
        return { 
          label: 'Basic', 
          color: 'bg-gradient-to-r from-blue-500 to-cyan-500', 
          icon: Users,
          benefits: 'Acesso padrão'
        };
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return { icon: Trophy, color: 'text-yellow-600 bg-yellow-100' };
    if (position === 2) return { icon: Award, color: 'text-gray-600 bg-gray-100' };
    if (position === 3) return { icon: Award, color: 'text-orange-600 bg-orange-100' };
    return { icon: Users, color: 'text-blue-600 bg-blue-100' };
  };

  const rotatePriorities = async () => {
    if (!profile) return;

    setIsRotating(true);
    try {
      // For now, use the existing function until we update the types
      const { data, error } = await supabase.rpc('rotate_priorities');
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Prioridades rotacionadas com sucesso!",
      });
      
      await fetchAllProfiles();
      calculateNextRotation();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao rotacionar prioridades.",
        variant: "destructive"
      });
    } finally {
      setIsRotating(false);
    }
  };

  if (!profile) return null;

  // Check if user is admin to show rotation button - using type assertion
  const profileWithRole = profile as ProfileWithRole;
  const isAdmin = profileWithRole.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Estatísticas da Fila */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sua Posição</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-3xl font-bold">#{profile.priority_position}</div>
              {(() => {
                const badge = getPositionBadge(profile.priority_position);
                const Icon = badge.icon;
                return <Icon className={`h-6 w-6 ${badge.color.split(' ')[0]}`} />;
              })()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              de {allProfiles.length} membros
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Rotação</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTimeUntilRotation()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Rotação automática às 00:00
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seu Tier</CardTitle>
            {(() => {
              const tierInfo = getTierInfo(profile.membership_tier);
              const Icon = tierInfo.icon;
              return <Icon className="h-4 w-4 text-muted-foreground" />;
            })()}
          </CardHeader>
          <CardContent>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-white text-sm font-medium ${getTierInfo(profile.membership_tier).color}`}>
              {getTierInfo(profile.membership_tier).label}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getTierInfo(profile.membership_tier).benefits}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fila de Prioridades Completa */}
      <Card className="aviation-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Fila de Prioridades Completa</span>
              </CardTitle>
              <CardDescription>
                Lista atualizada de todos os membros e suas posições de prioridade
              </CardDescription>
            </div>
            {isAdmin && (
              <Button 
                onClick={rotatePriorities}
                variant="outline"
                size="sm"
                disabled={isRotating}
                className="hidden md:flex"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {isRotating ? 'Rotacionando...' : 'Rotacionar Agora'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allProfiles.map((member, index) => {
              const tierInfo = getTierInfo(member.membership_tier);
              const positionBadge = getPositionBadge(member.priority_position);
              const TierIcon = tierInfo.icon;
              const PositionIcon = positionBadge.icon;
              const isCurrentUser = member.id === profile.id;
              
              return (
                <div 
                  key={member.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                    isCurrentUser 
                      ? 'bg-aviation-gold/20 border-aviation-gold shadow-md scale-102' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Posição e Ícone */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-12 h-12 rounded-full ${positionBadge.color} flex items-center justify-center`}>
                        <PositionIcon className="h-6 w-6" />
                      </div>
                      <div className="text-lg font-bold">
                        #{member.priority_position}
                      </div>
                    </div>

                    {/* Avatar e Informações */}
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-aviation-gradient text-white">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${isCurrentUser ? 'text-aviation-blue' : 'text-gray-900'}`}>
                            {isCurrentUser ? `${member.name} (Você)` : member.name}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">
                              Você
                            </Badge>
                          )}
                          {member.role === 'admin' && (
                            <Badge variant="destructive" className="text-xs">
                              Admin
                            </Badge>
                          )}
                          {member.role !== 'admin' && member.role !== 'client' && (
                            <Badge variant="outline" className="text-xs">
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>Saldo: R$ {member.balance.toLocaleString('pt-BR')}</span>
                          <span>•</span>
                          <span className={member.monthly_fee_status === 'paid' ? 'text-green-600' : 'text-red-600'}>
                            {member.monthly_fee_status === 'paid' ? 'Em dia' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tier e Status */}
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${tierInfo.color}`}>
                      <TierIcon className="h-4 w-4 mr-1" />
                      {tierInfo.label}
                    </div>
                    
                    {/* Indicador de movimento */}
                    {index < allProfiles.length - 1 && (
                      <div className="text-xs text-gray-400">
                        {member.priority_position === 1 ? '→ Último' : `→ #${member.priority_position - 1}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">Controles de Administrador:</h4>
              <Button 
                onClick={rotatePriorities}
                variant="outline"
                size="sm"
                disabled={isRotating}
                className="md:hidden"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {isRotating ? 'Rotacionando...' : 'Rotacionar Prioridades'}
              </Button>
            </div>
          )}

          {/* Explicação do Sistema */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona a Fila de Prioridades:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• A fila rotaciona automaticamente todos os dias às 00:00</p>
              <p>• O membro em #1 vai para a última posição, todos os outros sobem uma posição</p>
              <p>• O status de pagamento da mensalidade afeta a posição na fila</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriorityQueue;
