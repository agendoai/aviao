
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se há token salvo
    const token = localStorage.getItem('token');
    if (token) {
      // Buscar perfil do usuário
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api';
      fetch(`${backendUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando login...');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api';
      console.log('🔧 Backend URL:', backendUrl);
      console.log('🔧 URL completa:', `${backendUrl}/auth/login`);
      const res = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      console.log('📡 Login response:', data);
      
      if (!res.ok) {
        console.log('❌ Login falhou:', data.error);
        return { error: data.error || 'Erro no login' };
      }
      
      console.log('✅ Login bem-sucedido');
      console.log('👤 User:', data.user);
      console.log('🔑 Token recebido:', data.token ? 'Sim' : 'Não');
      console.log('🔑 Token completo:', data.token);
      
      setUser(data.user);
      setIsAuthenticated(true);
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('💾 Token salvo no localStorage');
        console.log('💾 Token verificado:', localStorage.getItem('token'));
      }
      return { error: null };
    } catch (error) {
      console.error('💥 Erro no login:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api';
      const res = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Erro no cadastro' };
      }
      setUser(data.user);
      setIsAuthenticated(true);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api';
      await fetch(`${backendUrl}/auth/logout`, { method: 'POST' });
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
