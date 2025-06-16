
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center aviation-gradient p-4">
      <Card className="w-full max-w-md aviation-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-12 h-12 bg-aviation-gradient rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">EA</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">E-Club A</CardTitle>
          <CardDescription>
            Elite Aero Soluções Aeronáuticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/80"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-aviation-gradient hover:opacity-90 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Demo: use qualquer email e senha para acessar
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
