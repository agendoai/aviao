const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const name = 'Admin';
    const email = 'admin@eclub.com';
    const password = 'admin123';

    // Verificar se já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ Admin já existe!');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar admin
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('✅ Admin criado com sucesso!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Senha:', password);
    console.log('👤 Nome:', admin.name);
    console.log('🔐 Role:', admin.role);

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 