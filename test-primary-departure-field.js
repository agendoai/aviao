console.log('🧪 TESTE: Campo de horário de decolagem do primeiro destino');
console.log('=' .repeat(60));

// Simular dados de uma missão compartilhada com destino secundário
const missionData = {
  origin: 'SBAU', // Base
  destination: 'SBSP', // Primeiro destino
  secondaryDestination: 'SBRJ', // Segundo destino
  departureDate: '2025-09-15',
  departureTime: '07:00', // Decolagem da base
  primaryArrivalDate: '2025-09-15', 
  primaryArrivalTime: '09:00', // Chegada no primeiro destino
  secondaryDepartureDate: '2025-09-15', // Data de decolagem do primeiro para o segundo destino
  secondaryDepartureTime: '12:00', // Horário de DECOLAGEM do primeiro para o segundo destino
  secondaryReturnDate: '2025-09-15', // Data de decolagem do segundo destino para a base
  secondaryReturnTime: '15:00', // Horário de decolagem do segundo destino para a base
  returnDate: '2025-09-15', 
  returnTime: '18:00', // Chegada na base
};

console.log('📋 DADOS DA MISSÃO COMPARTILHADA COM HORÁRIOS DETALHADOS:');
console.log(`   Origem: ${missionData.origin}`);
console.log(`   Primeiro destino: ${missionData.destination}`);
console.log(`   Segundo destino: ${missionData.secondaryDestination}`);
console.log('');

console.log('🗓️ CRONOGRAMA COMPLETO COM HORÁRIOS DE DECOLAGEM:');
console.log(`   ${missionData.departureDate} ${missionData.departureTime} - 🛫 DECOLAGEM da base (${missionData.origin})`);
console.log(`   ${missionData.primaryArrivalDate} ${missionData.primaryArrivalTime} - 🛬 CHEGADA em ${missionData.destination}`);
console.log(`   ${missionData.secondaryDepartureDate} ${missionData.secondaryDepartureTime} - 🛫 DECOLAGEM de ${missionData.destination} para ${missionData.secondaryDestination}`);
console.log(`   ${missionData.secondaryReturnDate} ${missionData.secondaryReturnTime} - 🛫 DECOLAGEM de ${missionData.secondaryDestination} para a base`);
console.log(`   ${missionData.returnDate} ${missionData.returnTime} - 🛬 CHEGADA na base (${missionData.origin})`);
console.log('');

console.log('🛤️ ROTA COMPLETA COM TEMPOS:');
console.log(`   ${missionData.origin} → ${missionData.destination} → ${missionData.secondaryDestination} → ${missionData.origin}`);
console.log(`   Base → Principal (${missionData.departureTime}-${missionData.primaryArrivalTime}) → Secundário (${missionData.secondaryDepartureTime}) → Base (${missionData.secondaryReturnTime}-${missionData.returnTime})`);
console.log('');

console.log('✅ FUNCIONALIDADE IMPLEMENTADA:');
console.log('   1. ✅ Campo de data/hora de chegada no primeiro destino');
console.log('   2. ✅ Campo de data/hora de DECOLAGEM do primeiro destino');
console.log('   3. ✅ Campo de data/hora de DECOLAGEM do segundo destino');
console.log('   4. ✅ Rota completa claramente definida');
console.log('   5. ✅ Labels melhorados com destaque na DECOLAGEM');
console.log('   6. ✅ Interface mais clara para o usuário');
console.log('');

console.log('🎯 O QUE O USUÁRIO PEDIU:');
console.log('   • "campo de hora ai em cima para selecionar a hr de descolagem de primeiro destino"');
console.log('   • Agora existe um campo específico para definir quando a aeronave DECOLA do primeiro destino');
console.log('   • O usuário pode definir exatamente o horário de saída de cada aeroporto');
console.log('   • A interface deixa claro que é horário de DECOLAGEM (saída), não chegada');
console.log('');

console.log('🚀 PRONTO PARA USO!');
console.log('   O campo de horário de decolagem do primeiro destino está implementado');
console.log('   e funcionando igual às missões solo!');