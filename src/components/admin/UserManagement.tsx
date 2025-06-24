import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Edit, Ban, Shield, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProfileWithRole } from '@/types/supabase-extended';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as ProfileWithRole[]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Papel do usuário atualizado com sucesso"
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar papel do usuário",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminUsers = users.filter(user => user.role === 'admin');

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'owner': return 'default';
      case 'pilot': return 'secondary';
      case 'concierge': return 'outline';
      case 'support': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      owner: 'Proprietário',
      pilot: 'Piloto',
      concierge: 'Concierge',
      support: 'Suporte',
      client: 'Cliente'
    };
    return labels[role] || role;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Card destacando administradores */}
      <Card className="aviation-card border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <Shield className="h-5 w-5" />
            <span>Usuários Administradores</span>
          </CardTitle>
          <CardDescription className="text-red-600">
            {adminUsers.length === 0 
              ? "Nenhum administrador encontrado no sistema"
              : `${adminUsers.length} administrador(es) ativo(s) no sistema`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminUsers.length > 0 ? (
            <div className="space-y-2">
              {adminUsers.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Crown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{admin.name}</div>
                      <div className="text-sm text-gray-600">{admin.email}</div>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    Administrador
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-red-600">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum usuário com privilégios de administrador encontrado.</p>
              <p className="text-sm mt-1">Considere promover um usuário para administrador.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
          <CardDescription>
            Gerencie usuários, papéis e permissões do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="owner">Proprietário</SelectItem>
                <SelectItem value="pilot">Piloto</SelectItem>
                <SelectItem value="concierge">Concierge</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeColor(user.role || 'client')}>
                        {getRoleLabel(user.role || 'client')}
                      </Badge>
                    </TableCell>
                    <TableCell>#{user.priority_position}</TableCell>
                    <TableCell>R$ {user.balance.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={user.monthly_fee_status === 'paid' ? 'default' : 'destructive'}>
                        {user.monthly_fee_status === 'paid' ? 'Ativo' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={user.role || 'client'}
                          onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Cliente</SelectItem>
                            <SelectItem value="pilot">Piloto</SelectItem>
                            <SelectItem value="concierge">Concierge</SelectItem>
                            <SelectItem value="support">Suporte</SelectItem>
                            <SelectItem value="owner">Proprietário</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
