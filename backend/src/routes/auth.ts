import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken, AuthPayload } from '../auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAsaasCustomer, createSubscription } from '../services/asaas';

const router = Router();
const prisma = new PrismaClient();

// Registro de usuário
router.post('/register', async (req, res) => {
  const { email, password, name, cpfCnpj, phone } = req.body;
  
  // Validar campos obrigatórios
  if (!email || !password || !name || !cpfCnpj || !phone) {
    return res.status(400).json({ 
      error: 'Todos os campos são obrigatórios: email, senha, nome completo, CPF/CNPJ e telefone' 
    });
  }

  // Função para validar CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Função para validar telefone
  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;
    
    const ddd = parseInt(cleanPhone.slice(0, 2));
    if (ddd < 11 || ddd > 99) return false;
    
    return true;
  };

  // Validar formato do CPF
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
  if (!cpfRegex.test(cpfCnpj)) {
    return res.status(400).json({ error: 'CPF deve estar no formato 000.000.000-00' });
  }

  // Validar CPF matematicamente
  if (!validateCPF(cpfCnpj)) {
    return res.status(400).json({ error: 'CPF inválido' });
  }

  // Validar formato do telefone
  const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$|^\d{10,11}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Telefone deve estar no formato (11) 99999-9999' });
  }

  // Validar telefone
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'Telefone inválido' });
  }

  try {
    // Verificar se email já existe
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Verificar se CPF já existe
    const cpfExists = await prisma.user.findFirst({ where: { cpfCnpj } });
    if (cpfExists) {
      return res.status(409).json({ error: 'CPF/CNPJ já cadastrado' });
    }

    // Hash da senha
    const hash = await bcrypt.hash(password, 10);

    // Criar cliente no Asaas primeiro
    let asaasCustomerId: string | null = null;
    try {
      asaasCustomerId = await createAsaasCustomer({
        name,
        email,
        cpfCnpj,
        phone,
      });
    } catch (asaasError) {
      console.error('❌ Erro ao criar cliente no Asaas:', asaasError);
      return res.status(500).json({ 
        error: 'Erro ao configurar pagamentos. Tente novamente ou entre em contato com o suporte.' 
      });
    }

    // Criar usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hash,
        cpfCnpj,
        phone,
        asaasCustomerId,
        role: 'user',
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true,
        cpfCnpj: true,
        phone: true,
        asaasCustomerId: true
      }
    });

    // Nota: Status será definido automaticamente pelo sistema de mensalidade

    // Buscar valor da mensalidade configurado
    const membershipConfig = await prisma.systemConfig.findUnique({
      where: { key: 'membership_value' }
    });
    
    const membershipValue = membershipConfig ? parseFloat(membershipConfig.value) : 200.00; // Valor padrão da mensalidade
    
    // Calcular data de vencimento: 24 horas após a criação da conta (primeira cobrança da assinatura)
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 24); // Vence em 24 horas

    // Criar assinatura recorrente no Asaas
    let subscriptionId = null;
    try {
      const subscription = await createSubscription(
        asaasCustomerId!,
        membershipValue,
        `Mensalidade do Clube - ${user.name}`
      );
      subscriptionId = subscription.id;
      
      // console.log(`✅ Assinatura recorrente criada: ${subscription.id} para usuário ${user.name}`);
    } catch (subscriptionError) {
      console.error('❌ Erro ao criar assinatura recorrente:', subscriptionError);
      // Continuar sem assinatura recorrente
    }

    // Salvar subscriptionId no usuário e criar primeira mensalidade
    if (subscriptionId) {
      // Atualizar usuário com subscriptionId
      await prisma.user.update({
        where: { id: user.id },
        data: { asaasSubscriptionId: subscriptionId }
      });
      
      // Criar primeira mensalidade
      const firstMembership = await prisma.membershipPayment.create({
        data: {
          userId: user.id,
          value: membershipValue,
          dueDate: dueDate,
          status: 'pendente',
          subscriptionId: subscriptionId,
          paymentId: null // Será preenchido quando Asaas gerar a cobrança
        }
      });
      
      // console.log(`✅ SubscriptionId ${subscriptionId} salvo no usuário!`);
      // console.log(`✅ Primeira mensalidade criada: ID ${firstMembership.id}, vencimento ${dueDate.toLocaleDateString('pt-BR')}, valor R$ ${membershipValue}`);
      // console.log(`🎯 Usuário ${user.name} já tem mensalidade pendente pronta para pagamento!`);
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const token = generateToken(payload);
    
    res.status(201).json({ 
      success: true, 
      user, 
      token,
      message: 'Conta criada com sucesso! Sua primeira cobrança vence em 24 horas.'
    });
  } catch (err: any) {
    console.error('❌ Erro no registro:', err);
    res.status(400).json({ error: err.message });
  }
});

// Login (usuário ou admin)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    
    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const token = generateToken(payload);
    
    const response = { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    
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
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } });
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
