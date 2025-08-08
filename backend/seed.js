const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eclub.com' },
    update: {},
    create: {
      email: 'admin@eclub.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'admin'
    }
  });

  // Criar aeronaves de teste
  const aircraft1 = await prisma.aircraft.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Cessna 172',
      registration: 'PT-ABC',
      model: 'C172',
      seats: 4,
      status: 'available',
      hourlyRate: 2800,
      overnightRate: 1500
    }
  });

  const aircraft2 = await prisma.aircraft.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Piper PA-28',
      registration: 'PT-DEF',
      model: 'PA28',
      seats: 4,
      status: 'available',
      hourlyRate: 2800,
      overnightRate: 1500
    }
  });

  const aircraft3 = await prisma.aircraft.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Cessna 152',
      registration: 'PT-GHI',
      model: 'C152',
      seats: 2,
      status: 'available',
      hourlyRate: 2800,
      overnightRate: 1500
    }
  });

  console.log('✅ Seed concluído!');
  console.log('👤 Admin criado:', admin.email);
  console.log('✈️ Aeronaves criadas:');
  console.log('  - Cessna 172 (PT-ABC): R$ 2.800/hora, R$ 1.500/pernoite');
  console.log('  - Piper PA-28 (PT-DEF): R$ 2.800/hora, R$ 1.500/pernoite');
  console.log('  - Cessna 152 (PT-GHI): R$ 2.800/hora, R$ 1.500/pernoite');
  console.log('');
  console.log('🔑 Credenciais do Admin:');
  console.log('  Email: admin@eclub.com');
  console.log('  Senha: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 