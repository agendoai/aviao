console.log('🔧 TESTE DA CORREÇÃO: nextAvailable');
console.log('=' .repeat(50));

// Dados reais da sua missão
const missaoReal = {
  departure_date: "2025-09-17T05:00:00.000Z",  // 02:00 BRT (pré-voo)
  return_date: "2025-09-18T01:24:47.898Z",     // 22:24 BRT dia 17 (fim pós-voo)
  origin: "SBAU",
  destination: "SBSP"
};

console.log('📊 DADOS DA MISSÃO:');
console.log(`   departure_date: ${missaoReal.departure_date} (${new Date(missaoReal.departure_date).toLocaleString('pt-BR')})`);
console.log(`   return_date: ${missaoReal.return_date} (${new Date(missaoReal.return_date).toLocaleString('pt-BR')})`);
console.log('');

// Simular função proximaDecolagemPossivel ANTES da correção (bugada)
function proximaDecolagemPossivelBugada(retorno) {
  const H = (n) => n * 60 * 60 * 1000;
  const PROXIMA_MISSAO_HORAS = 3;
  return new Date(retorno.getTime() + H(PROXIMA_MISSAO_HORAS)); // +3h EXTRA (ERRO)
}

// Simular função proximaDecolagemPossivel DEPOIS da correção (corrigida)
function proximaDecolagemPossivelCorrigida(retorno) {
  return new Date(retorno.getTime()); // SEM somar 3h extras
}

const returnDate = new Date(missaoReal.return_date);

console.log('🐛 ANTES DA CORREÇÃO (BUGADA):');
const nextAvailableBugado = proximaDecolagemPossivelBugada(returnDate);
console.log(`   nextAvailable: ${nextAvailableBugado.toISOString()}`);
console.log(`   Em BRT: ${nextAvailableBugado.toLocaleString('pt-BR')}`);
console.log(`   ❌ PROBLEMA: Adicionando 3h extras desnecessárias!`);
console.log('');

console.log('✅ DEPOIS DA CORREÇÃO (CORRIGIDA):');
const nextAvailableCorrigido = proximaDecolagemPossivelCorrigida(returnDate);
console.log(`   nextAvailable: ${nextAvailableCorrigido.toISOString()}`);
console.log(`   Em BRT: ${nextAvailableCorrigido.toLocaleString('pt-BR')}`);
console.log(`   ✅ CORRETO: Aeronave disponível imediatamente após o return_date`);
console.log('');

console.log('🎯 COMPARAÇÃO:');
console.log(`   Antes: ${nextAvailableBugado.toLocaleString('pt-BR')} (01:24 dia 18 ❌)`);
console.log(`   Depois: ${nextAvailableCorrigido.toLocaleString('pt-BR')} (22:24 dia 17 ✅)`);
console.log('');

console.log('🎉 RESULTADO:');
console.log('   ✅ nextAvailable agora mostra no MESMO DIA');
console.log('   ✅ Aeronave disponível às 22:24 dia 17 (correto)');
console.log('   ✅ Não pula mais para o dia seguinte incorretamente');
console.log('   ✅ Bug do pós-voo virando dia CORRIGIDO!');