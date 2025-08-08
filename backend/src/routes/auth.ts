import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken, AuthPayload } from '../auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Registro de usuário
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Campos obrigatórios' });
  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(409).json({ error: 'Email já cadastrado' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hash,
        role: 'user',
      },
      select: { id: true, email: true, name: true, role: true }
    });
    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const token = generateToken(payload);
    res.status(201).json({ success: true, user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login (usuário ou admin)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('🔍 Login tentativa para:', email);
  
  if (!email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    
    console.log('👤 Usuário encontrado:', user.name);
    console.log('👑 Role:', user.role);
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    
    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    console.log('🔐 Payload para token:', payload);
    
    console.log('🔐 JWT_SECRET usado no login:', process.env.JWT_SECRET || 'default_secret');
    console.log('🔐 JWT_SECRET valor no login:', process.env.JWT_SECRET || 'default_secret');
    const token = generateToken(payload);
    console.log('🔑 Token gerado:', token ? 'Sim' : 'Não');
    console.log('🔑 Token completo:', token);
    
    const response = { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    console.log('📤 Response completo:', response);
    
    res.json(response);
  } catch (err: any) {
    console.error('❌ Erro no login:', err);
    res.status(400).json({ error: err.message });
  }
});

// Rota para obter usuário autenticado
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token não enviado' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({ where: { id: (payload as any).userId } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// Endpoint para criar admin (apenas para desenvolvimento)
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar se já existe um usuário com este email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin'
      }
    });
    
    res.json({ 
      message: 'Admin criado com sucesso',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 