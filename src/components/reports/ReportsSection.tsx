import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsers, getBookings, getTransactions, getMyTransactions } from '@/utils/api';

const ReportsSection: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, bookingsData, transactionsData] = await Promise.all([
          getUsers(),
          getBookings(),
          getMyTransactions()
        ]);
        setUsers(usersData);
        setBookings(bookingsData);
        setTransactions(transactionsData);
      } catch {
        // erro
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingBookings = bookings.filter(b => b.status === 'pendente');
  const paidBookings = bookings.filter(b => b.status === 'paga');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{users.length}</div>
                <div className="text-gray-600">Usuários</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{bookings.length}</div>
                <div className="text-gray-600">Reservas</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{pendingBookings.length}</div>
                <div className="text-gray-600">Reservas Pendentes</div>
              </div>
              <div className="bg-green-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{paidBookings.length}</div>
                <div className="text-gray-600">Reservas Pagas</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Adicione mais cards ou gráficos conforme desejar */}
    </div>
  );
};

export default ReportsSection;
