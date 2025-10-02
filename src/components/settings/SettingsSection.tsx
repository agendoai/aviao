
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone as PhoneIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const SettingsSection: React.FC = () => {
  const { signOut } = useAuth();
  const whatsappPhone = (import.meta.env.VITE_WHATSAPP_SUPPORT as string) || '5599999999999';
  const defaultText = encodeURIComponent('Olá! Preciso de suporte.');

  const handleLogout = () => {
    // Limpar token do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Chamar função de logout do hook de auth
    signOut();
    
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Suporte</CardTitle>
          <CardDescription>
            Fale com a nossa equipe pelo WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="bg-green-600 hover:bg-green-700 w-full"
            onClick={() => window.open(`https://wa.me/${whatsappPhone}?text=${defaultText}`, '_blank')}
          >
            <PhoneIcon className="h-4 w-4 mr-2" /> Abrir WhatsApp
          </Button>
          <div className="text-xs text-gray-500">
            Número configurável via variável: VITE_WHATSAPP_SUPPORT
          </div>
        </CardContent>
      </Card>

      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>
            Gerenciar sua conta e sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSection;
