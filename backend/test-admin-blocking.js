// Teste para verificar o bloqueio manual do admin com lógica de manutenção
console.log('🧪 Testando bloqueio manual do admin...');

// Simular dados que o admin inseriria
const adminBlockData = {
  aircraftId: 2, // PR-FOM
  startDate: '2025-08-29',
  startTime: '06:00',
  endDate: '2025-08-30',
  endTime: '10:00',
  reason: 'Missão SBAU → SBKP',
  includeMaintenance: true,
  maintenanceHours: 3
};

console.log('📋 Dados do bloqueio (horário brasileiro):');
console.log(`   Aeronave: ${adminBlockData.aircraftId}`);
console.log(`   Início: ${adminBlockData.startDate} ${adminBlockData.startTime}`);
console.log(`   Fim: ${adminBlockData.endDate} ${adminBlockData.endTime}`);
console.log(`   Motivo: ${adminBlockData.reason}`);
console.log(`   Incluir manutenção: ${adminBlockData.includeMaintenance ? 'SIM' : 'NÃO'}`);
console.log(`   Horas de manutenção: ${adminBlockData.maintenanceHours}h`);

// Simular a conversão que acontece no frontend
// Como o usuário já está inserindo horário brasileiro, não precisamos adicionar 3h
const convertBrazilianDateToUTCString = (brazilianDate) => {
  // O usuário já inseriu horário brasileiro, então só precisamos criar o ISO string
  return brazilianDate.toISOString();
};

// Converter datas para UTC
const startDateTime = new Date(`${adminBlockData.startDate}T${adminBlockData.startTime}:00`);
const endDateTime = new Date(`${adminBlockData.endDate}T${adminBlockData.endTime}:00`);

const startUTC = convertBrazilianDateToUTCString(startDateTime);
let endUTC = convertBrazilianDateToUTCString(endDateTime);

// Se incluir manutenção, adicionar as horas extras
if (adminBlockData.includeMaintenance) {
  const maintenanceEnd = new Date(endDateTime.getTime() + (adminBlockData.maintenanceHours * 60 * 60 * 1000));
  endUTC = convertBrazilianDateToUTCString(maintenanceEnd);
}

console.log('\n🌍 Datas convertidas para UTC:');
console.log(`   Início UTC: ${startUTC}`);
console.log(`   Fim UTC: ${endUTC}`);

// Simular dados que seriam enviados para o backend
const blockData = {
  aircraftId: adminBlockData.aircraftId,
  start: startUTC,
  end: endUTC,
  reason: adminBlockData.reason
};

console.log('\n📤 Dados que seriam enviados para o backend:');
console.log(JSON.stringify(blockData, null, 2));

// Verificar se as datas estão corretas
const expectedStartUTC = '2025-08-29T09:00:00.000Z'; // 06:00 BR = 09:00 UTC
const expectedEndUTC = '2025-08-30T16:00:00.000Z'; // 10:00 BR + 3h manutenção = 13:00 BR = 16:00 UTC

console.log('\n✅ Verificação:');
console.log(`   Início esperado: ${expectedStartUTC}`);
console.log(`   Início enviado:  ${startUTC}`);
console.log(`   ✅ Correto: ${startUTC === expectedStartUTC ? 'SIM' : 'NÃO'}`);

console.log(`   Fim esperado: ${expectedEndUTC}`);
console.log(`   Fim enviado:  ${endUTC}`);
console.log(`   ✅ Correto: ${endUTC === expectedEndUTC ? 'SIM' : 'NÃO'}`);

// Simular o que seria salvo no banco
console.log('\n💾 Dados que seriam salvos no banco:');
console.log(`   departure_date: ${startUTC}`);
console.log(`   return_date: ${endUTC}`);
console.log(`   blocked_until: ${endUTC}`);
console.log(`   status: 'blocked'`);
console.log(`   origin: '${adminBlockData.reason}'`);
console.log(`   destination: '${adminBlockData.reason}'`);

// Simular como o frontend exibiria
console.log('\n📱 Como o frontend exibiria:');
const displayStart = new Date(startUTC);
const displayEnd = new Date(endUTC);
console.log(`   Início: ${displayStart.toLocaleString('pt-BR')}`);
console.log(`   Fim: ${displayEnd.toLocaleString('pt-BR')}`);

console.log('\n🎯 Resultado esperado:');
console.log('   - Admin bloqueia: 29/08 06:00 → 30/08 10:00 + 3h manutenção');
console.log('   - Backend salva: 29/08 09:00 → 30/08 16:00 (UTC)');
console.log('   - Frontend exibe: 29/08 06:00 → 30/08 13:00 (convertido de volta)');
console.log('   - Calendário mostra: Bloqueado por 31 horas (missão + manutenção)');

console.log('\n🔒 Período total bloqueado:');
const totalBlockedHours = (new Date(endUTC) - new Date(startUTC)) / (1000 * 60 * 60);
console.log(`   ${totalBlockedHours.toFixed(1)} horas (${(totalBlockedHours / 24).toFixed(1)} dias)`);
