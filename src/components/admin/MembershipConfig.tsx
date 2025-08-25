import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, DollarSign } from 'lucide-react';

const MembershipConfig: React.FC = () => {
  const [membershipValue, setMembershipValue] = useState<number>(200);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMembershipConfig();
  }, []);

  const loadMembershipConfig = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
      const response = await fetch(`${backendUrl}/admin/membership-config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembershipValue(data.membershipValue);
      } else {
        toast.error('Erro ao carregar configuração');
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const saveMembershipConfig = async () => {
    setSaving(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
      const response = await fetch(`${backendUrl}/admin/membership-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ membershipValue })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Configuração salva com sucesso!');
        setMembershipValue(data.membershipValue);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setMembershipValue(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configuração...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuração da Mensalidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="membershipValue">Valor da Mensalidade (R$)</Label>
          <Input
            id="membershipValue"
            type="number"
            step="0.01"
            min="0"
            value={membershipValue}
            onChange={handleValueChange}
            placeholder="200.00"
            className="text-lg font-medium"
          />
          <p className="text-sm text-gray-500">
            Este valor será aplicado a todas as novas mensalidades criadas.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Informações Importantes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• O valor será aplicado apenas a novas mensalidades</li>
            <li>• Mensalidades existentes não serão alteradas</li>
            <li>• Usuários já cadastrados continuarão com o valor anterior</li>
            <li>• Novos usuários usarão este valor configurado</li>
          </ul>
        </div>

        <Button 
          onClick={saveMembershipConfig}
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MembershipConfig;
