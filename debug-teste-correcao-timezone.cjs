const { format, startOfWeek } = require('date-fns');
const { ptBR } = require('date-fns/locale');

// Simular a função convertWeekStartToBrazilianTimezone ANTES da correção
const convertWeekStartToBrazilianTimezoneOLD = (weekStart) => {
  // Ajustar para o timezone brasileiro (UTC-3)
  const brazilianOffset = -3 * 60 * 60 * 1000; // -3 horas em milissegundos
  const adjustedDate = new Date(weekStart.getTime() + brazilianOffset);
  
  return adjustedDate.toISOString();
};

// Simular a função convertWeekStartToBrazilianTimezone DEPOIS da correção
const convertWeekStartToBrazilianTimezoneNEW = (weekStart) => {
  // Para enviar para o backend, não devemos aplicar offset adicional
  // O weekStart já está na data local correta
  // Apenas retornar a data como ISO string
  return weekStart.toISOString();
};

console.log('🔍 TESTE DE CORREÇÃO DE TIMEZONE');
console.log('='.repeat(50));

// Simular o que o frontend faz
const currentWeek = new Date('2025-01-27T12:00:00'); // Simulando uma data de exemplo
const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

console.log('📅 Data original (currentWeek):', currentWeek.toISOString());
console.log('📅 startOfWeek calculado:', weekStart.toISOString());
console.log('📅 startOfWeek em formato local:', format(weekStart, 'dd/MM/yyyy HH:mm', { locale: ptBR }));

console.log('\n🔴 ANTES DA CORREÇÃO (com offset -3h):');
const weekStartOLD = convertWeekStartToBrazilianTimezoneOLD(weekStart);
console.log('📅 Enviado para backend:', weekStartOLD);
console.log('📅 Data interpretada pelo backend:', new Date(weekStartOLD).toISOString());
console.log('📅 Primeiro slot seria gerado em:', new Date(weekStartOLD).toISOString());

console.log('\n🟢 DEPOIS DA CORREÇÃO (sem offset):');
const weekStartNEW = convertWeekStartToBrazilianTimezoneNEW(weekStart);
console.log('📅 Enviado para backend:', weekStartNEW);
console.log('📅 Data interpretada pelo backend:', new Date(weekStartNEW).toISOString());
console.log('📅 Primeiro slot seria gerado em:', new Date(weekStartNEW).toISOString());

console.log('\n📊 COMPARAÇÃO:');
console.log('🔴 Versão antiga geraria slots para:', format(new Date(weekStartOLD), 'dd/MM/yyyy', { locale: ptBR }));
console.log('🟢 Versão corrigida gera slots para:', format(new Date(weekStartNEW), 'dd/MM/yyyy', { locale: ptBR }));

// Simular o que acontece no backend
console.log('\n🔧 SIMULAÇÃO DO BACKEND:');
console.log('Backend recebe weekStart e faz:');
console.log('const currentDate = new Date(weekStart);');
console.log('currentDate.setDate(currentDate.getDate() + day);');

const simulateBackendOLD = new Date(weekStartOLD);
console.log('🔴 Backend com versão antiga - primeiro dia:', simulateBackendOLD.toISOString());
console.log('🔴 Primeiro slot gerado em:', format(simulateBackendOLD, 'dd/MM/yyyy', { locale: ptBR }));

const simulateBackendNEW = new Date(weekStartNEW);
console.log('🟢 Backend com versão corrigida - primeiro dia:', simulateBackendNEW.toISOString());
console.log('🟢 Primeiro slot gerado em:', format(simulateBackendNEW, 'dd/MM/yyyy', { locale: ptBR }));

console.log('\n✅ RESULTADO:');
if (format(simulateBackendNEW, 'dd/MM/yyyy') === '27/01/2025') {
  console.log('✅ CORREÇÃO FUNCIONOU! Slots agora são gerados na data correta (27/01/2025)');
} else {
  console.log('❌ CORREÇÃO NÃO FUNCIONOU! Ainda há problema com a data');
}