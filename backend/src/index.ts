import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import paymentsRoutes from './routes/payments';
import aircraftRoutes from './routes/aircrafts';
import sharedMissionRoutes from './routes/sharedMissions';
import usersRoutes from './routes/users';
import bookingsRoutes from './routes/bookings';
import transactionsRoutes from './routes/transactions';
import chatRoutes from './routes/chat';
import adminRoutes from './routes/admin';
import calendarRoutes from './routes/calendar';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/aircrafts', aircraftRoutes);
app.use('/api/shared-missions', sharedMissionRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/calendar', calendarRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 