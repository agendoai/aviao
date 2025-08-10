
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone as PhoneIcon } from 'lucide-react';

const SettingsSection: React.FC = () => {
  const whatsappPhone = (import.meta.env.VITE_WHATSAPP_SUPPORT as string) || '5599999999999';
  const defaultText = encodeURIComponent('Olá! Preciso de suporte.');

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Suporte</CardTitle>
          <CardDescription>
            Fale com a nossa equipe pelo WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => window.open(`https://wa.me/${whatsappPhone}?text=${defaultText}`, '_blank')}
          >
            <PhoneIcon className="h-4 w-4 mr-2" /> Abrir WhatsApp
          </Button>
          <div className="text-xs text-gray-500 mt-2">
            Número configurável via variável: VITE_WHATSAPP_SUPPORT
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSection;
