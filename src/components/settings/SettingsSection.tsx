
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Settings as SettingsIcon,
  Save,
  Eye,
  EyeOff,
  Crown,
  Star,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SettingsSection: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: '',
    address: '',
    emergency_contact: '',
    bio: ''
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    booking_confirmations: true,
    priority_updates: true,
    maintenance_alerts: false,
    marketing_emails: false
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: '30'
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'vip':
        return { 
          label: 'VIP', 
          color: 'bg-gradient-to-r from-purple-500 to-pink-500', 
          icon: Crown 
        };
      case 'premium':
        return { 
          label: 'Premium', 
          color: 'bg-gradient-to-r from-yellow-400 to-orange-500', 
          icon: Star 
        };
      default:
        return { 
          label: 'Basic', 
          color: 'bg-gradient-to-r from-blue-500 to-cyan-500', 
          icon: Users 
        };
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name
        })
        .eq('id', profile?.id);

      if (error) throw error;

      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) throw error;

      toast({
        title: "Senha Alterada",
        description: "Sua senha foi alterada com sucesso.",
      });

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar senha.",
        variant: "destructive"
      });
    }
  };

  if (!profile) return null;

  const tierInfo = getTierInfo(profile.membership_tier);
  const TierIcon = tierInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-aviation-gradient text-white text-xl">
                  {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                <CardDescription className="text-base">
                  {profile.email}
                </CardDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${tierInfo.color}`}>
                    <TierIcon className="h-4 w-4 mr-1" />
                    {tierInfo.label}
                  </div>
                  <Badge variant="outline">
                    Prioridade #{profile.priority_position}
                  </Badge>
                  <Badge variant={profile.monthly_fee_status === 'paid' ? 'default' : 'destructive'}>
                    {profile.monthly_fee_status === 'paid' ? 'Em dia' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-aviation-blue">
                R$ {profile.balance.toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-gray-600">Saldo disponível</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Gerencie suas informações de perfil e dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">O e-mail não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                  <Input
                    id="emergency_contact"
                    value={profileData.emergency_contact}
                    onChange={(e) => setProfileData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                    placeholder="Nome e telefone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
              <Button onClick={handleProfileUpdate} className="bg-aviation-gradient hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como e quando você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries({
                email_notifications: 'Notificações por E-mail',
                booking_confirmations: 'Confirmações de Reserva',
                priority_updates: 'Atualizações de Prioridade',
                maintenance_alerts: 'Alertas de Manutenção',
                marketing_emails: 'E-mails Promocionais'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={key}>{label}</Label>
                    <p className="text-sm text-gray-600">
                      {key === 'email_notifications' && 'Receber notificações gerais por e-mail'}
                      {key === 'booking_confirmations' && 'Confirmações automáticas de suas reservas'}
                      {key === 'priority_updates' && 'Mudanças na sua posição de prioridade'}
                      {key === 'maintenance_alerts' && 'Avisos sobre manutenção de aeronaves'}
                      {key === 'marketing_emails' && 'Ofertas especiais e novidades do clube'}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={notificationSettings[key as keyof typeof notificationSettings]}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
              <Button className="bg-aviation-gradient hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  />
                </div>
                <Button onClick={handlePasswordChange} className="bg-aviation-gradient hover:opacity-90">
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>

            {/* Security Options */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Configure opções adicionais de segurança para sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticação em Dois Fatores</Label>
                    <p className="text-sm text-gray-600">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.two_factor_enabled}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, two_factor_enabled: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas de Login</Label>
                    <p className="text-sm text-gray-600">
                      Receba notificações sobre acessos à sua conta
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.login_alerts}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, login_alerts: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timeout de Sessão</Label>
                  <Select 
                    value={securitySettings.session_timeout} 
                    onValueChange={(value) => 
                      setSecuritySettings(prev => ({ ...prev, session_timeout: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing/Payment Settings */}
        <TabsContent value="billing">
          <div className="space-y-6">
            {/* Account Balance */}
            <Card>
              <CardHeader>
                <CardTitle>Saldo da Conta</CardTitle>
                <CardDescription>
                  Gerencie o saldo da sua conta e histórico de transações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Saldo Atual</h4>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {profile.balance.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Status Mensalidade</h4>
                    <Badge variant={profile.monthly_fee_status === 'paid' ? 'default' : 'destructive'}>
                      {profile.monthly_fee_status === 'paid' ? 'Em dia' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Plano Atual</h4>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-white text-sm ${tierInfo.color}`}>
                      <TierIcon className="h-4 w-4 mr-1" />
                      {tierInfo.label}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button className="bg-aviation-gradient hover:opacity-90">
                    Adicionar Saldo
                  </Button>
                  <Button variant="outline">
                    Histórico de Transações
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>
                  Gerencie seus cartões e formas de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 p-6 rounded-lg text-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Nenhum cartão cadastrado</p>
                  <Button variant="outline">
                    Adicionar Cartão
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Automatic Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos Automáticos</CardTitle>
                <CardDescription>
                  Configure recargas automáticas e pagamento de mensalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Recarga Automática</Label>
                    <p className="text-sm text-gray-600">
                      Recarregar saldo automaticamente quando ficar abaixo de R$ 1.000
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Débito Automático da Mensalidade</Label>
                    <p className="text-sm text-gray-600">
                      Débito automático da mensalidade no cartão cadastrado
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsSection;
