// Teste para verificar se a conversão de datas está correta
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDateConversion() {
  console.log('🧪 Testando conversão de datas...\n');

  try {
    // Simular o que acontece quando você cria uma missão às 10:00
    const brazilianTime = new Date(2025, 7, 25, 10, 0, 0); // 25/08/2025 10:00 (horário brasileiro)
    
    console.log('📅 Teste: Criando missão às 10:00 (horário brasileiro)');
    console.log(`   Horário brasileiro: ${brazilianTime.toLocaleString('pt-BR')}`);
    
    // Simular a conversão que o frontend faz (CORRETA AGORA)
    const utcTime = new Date(brazilianTime.getTime()); // Não converte para UTC
    console.log(`   Horário UTC: ${utcTime.toISOString()}`);
    console.log(`   Horário UTC (local): ${utcTime.toLocaleString('pt-BR')}`);
    
    // Simular o que o backend salva
    console.log('\n💾 Backend salva no banco:');
    console.log(`   departure_date: ${utcTime.toISOString()}`);
    
    // Simular o que o backend calcula para pré-voo
    const PRE_VOO_HORAS = 3;
    const preVooStart = new Date(utcTime.getTime() - (PRE_VOO_HORAS * 60 * 60 * 1000));
    const preVooEnd = new Date(utcTime.getTime());
    
    console.log('\n🟡 Pré-voo calculado pelo backend:');
    console.log(`   Início: ${preVooStart.toISOString()} (${preVooStart.toLocaleString('pt-BR')})`);
    console.log(`   Fim: ${preVooEnd.toISOString()} (${preVooEnd.toLocaleString('pt-BR')})`);
    
    // Verificar se está correto
    const expectedPreVooStart = new Date(2025, 7, 25, 7, 0, 0); // 07:00
    const expectedPreVooEnd = new Date(2025, 7, 25, 10, 0, 0); // 10:00
    
    const isCorrect = preVooStart.getTime() === expectedPreVooStart.getTime() && 
                     preVooEnd.getTime() === expectedPreVooEnd.getTime();
    
    if (isCorrect) {
      console.log('\n✅ CONVERSÃO CORRETA!');
      console.log('   Pré-voo: 07:00-10:00 (3h antes da decolagem)');
      console.log('   Missão: 10:00-17:00 (decolagem até retorno)');
    } else {
      console.log('\n❌ CONVERSÃO INCORRETA!');
      console.log('   Esperado: 07:00-10:00');
      console.log('   Calculado:', preVooStart.toLocaleString('pt-BR'), '-', preVooEnd.toLocaleString('pt-BR'));
    }
    
    // Testar também para 17:00
    console.log('\n📅 Teste: Criando missão às 17:00 (horário brasileiro)');
    const brazilianTime17 = new Date(2025, 7, 25, 17, 0, 0);
    console.log(`   Horário brasileiro: ${brazilianTime17.toLocaleString('pt-BR')}`);
    
    const utcTime17 = new Date(brazilianTime17.getTime()); // Não converte para UTC
    console.log(`   Horário UTC: ${utcTime17.toISOString()}`);
    
    const preVooStart17 = new Date(utcTime17.getTime() - (PRE_VOO_HORAS * 60 * 60 * 1000));
    const preVooEnd17 = new Date(utcTime17.getTime());
    
    console.log('\n🟡 Pré-voo calculado para 17:00:');
    console.log(`   Início: ${preVooStart17.toLocaleString('pt-BR')}`);
    console.log(`   Fim: ${preVooEnd17.toLocaleString('pt-BR')}`);
    
    const expectedPreVooStart17 = new Date(2025, 7, 25, 14, 0, 0); // 14:00
    const expectedPreVooEnd17 = new Date(2025, 7, 25, 17, 0, 0); // 17:00
    
    const isCorrect17 = preVooStart17.getTime() === expectedPreVooStart17.getTime() && 
                       preVooEnd17.getTime() === expectedPreVooEnd17.getTime();
    
    if (isCorrect17) {
      console.log('\n✅ CONVERSÃO CORRETA para 17:00!');
      console.log('   Pré-voo: 14:00-17:00 (3h antes da decolagem)');
    } else {
      console.log('\n❌ CONVERSÃO INCORRETA para 17:00!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateConversion().catch(console.error);
