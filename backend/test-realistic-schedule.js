const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealisticSchedule() {
  console.log('✈️ Testando sistema de agenda para aeronave...\n');
  
  try {
    // 1. Limpar dados antigos
    console.log('1️⃣ Limpando dados antigos...');
    await prisma.booking.deleteMany({
      where: {
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA'
      }
    });
    
    // 2. Configurar agenda
    console.log('\n2️⃣ Configurando agenda...');
    
    const daysConfig = {
      0: { active: true, startHour: 0, endHour: 24 },   // Domingo
      1: { active: true, startHour: 0, endHour: 24 },   // Segunda
      2: { active: true, startHour: 0, endHour: 24 },   // Terça
      3: { active: true, startHour: 0, endHour: 24 },   // Quarta
      4: { active: true, startHour: 0, endHour: 24 },   // Quinta
      5: { active: true, startHour: 0, endHour: 24 },   // Sexta
      6: { active: true, startHour: 0, endHour: 24 }    // Sábado
    };
    
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7); // 7 dias
    
    const slots = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const weekDay = d.getDay();
      const config = daysConfig[weekDay];
      
      if (config && config.active) {
        // Criar slots de 1 hora cada, das 00:00 às 23:00
        for (let hour = 0; hour < 24; hour++) {
          const slotStart = new Date(d);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(d);
          slotEnd.setHours(hour + 1, 0, 0, 0);
          
          slots.push({
            userId: 1,
            aircraftId: 2,
            origin: 'AGENDA',
            destination: 'AGENDA',
            departure_date: slotStart,
            return_date: slotEnd,
            passengers: 0,
            flight_hours: 0,
            overnight_stays: 0,
            value: 0,
            status: 'available',
          });
        }
      }
    }
    
    // Criar slots
    await prisma.booking.createMany({
      data: slots
    });
    
    console.log(`✅ ${slots.length} slots criados (${slots.length / 7} por dia, 24 slots por dia)`);
    
    // 3. Verificar slots criados
    console.log('\n3️⃣ Verificando slots criados...');
    const totalSlots = await prisma.booking.count({
      where: {
        aircraftId: 2,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA'
      }
    });
    
    console.log(`📊 Total de slots disponíveis: ${totalSlots}`);
    
    // 4. Mostrar exemplo de slots para um dia
    console.log('\n4️⃣ Exemplo de slots para hoje:');
    const today = new Date();
    const todaySlots = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        departure_date: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      },
      orderBy: { departure_date: 'asc' }
    });
    
    console.log(`   Slots para ${today.toLocaleDateString('pt-BR')}:`);
    todaySlots.forEach(slot => {
      const start = new Date(slot.departure_date);
      const end = new Date(slot.return_date);
      console.log(`   - ${start.toLocaleTimeString('pt-BR')} às ${end.toLocaleTimeString('pt-BR')}`);
    });
    
    // 5. Simular reserva
    console.log('\n5️⃣ Simulando reserva...');
    const testStart = new Date();
    testStart.setHours(10, 0, 0, 0); // 10h
    const testEnd = new Date();
    testEnd.setHours(11, 0, 0, 0); // 11h (1 hora de duração)
    
    console.log(`   Tentando reservar: ${testStart.toLocaleTimeString('pt-BR')} às ${testEnd.toLocaleTimeString('pt-BR')}`);
    
    // Verificar disponibilidade
    const availableSlots = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        departure_date: { lte: testStart },
        return_date: { gte: testEnd }
      }
    });
    
    if (availableSlots.length > 0) {
      console.log(`   ✅ Disponível! ${availableSlots.length} slots cobrem este período`);
    } else {
      console.log(`   ❌ Indisponível! Nenhum slot cobre este período`);
    }
    
    console.log('\n✅ Sistema de agenda configurado!');
    console.log('🎯 Características:');
    console.log('   - Todos os dias disponíveis 24h');
    console.log('   - Slots de 1 hora cada (00:00 às 23:00)');
    console.log('   - Sistema dinâmico e permanente');
    console.log('   - Bloqueio preciso durante missões');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealisticSchedule();
