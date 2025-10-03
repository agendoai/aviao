// Script de inspeção de janelas e slots para 04/11/2025
// Usa diretamente as funções TypeScript via ts-node/register

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('ts-node/register');

const { prisma } = require('../src/db');
const { janelaBloqueada, proximaDecolagemPossivel } = require('../src/services/missionValidator');
const { generateTimeSlots } = require('../src/services/intelligentValidation');

function fmtBR(d) {
  return d.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function run() {
  console.log('🔎 Inspeção: 04/11/2025 (Brasil) — aircraftId=2');

  // Missão fornecida (UTC)
  const departureUTC = new Date('2025-11-04T02:00:00.000Z');
  const returnUTC = new Date('2025-11-04T20:25:31.198Z');

  // Montar Missao (partida/retorno já incluem pré/pós-voo)
  const missao = {
    partida: departureUTC,
    retorno: returnUTC,
    flightHoursTotal: 2,
    origin: 'TEST',
    destination: 'TEST'
  };

  // Calcular janelas da missão enviada
  const janelas = janelaBloqueada(missao);
  console.log('\n🧱 Janelas calculadas a partir de departure/return:');
  for (const j of janelas) {
    console.log(` - ${j.tipo}: ${fmtBR(j.inicio)} → ${fmtBR(j.fim)}`);
  }

  const next = proximaDecolagemPossivel(missao);
  console.log(`\n✅ Próxima disponibilidade (alinhada à meia hora): ${fmtBR(next)}`);

  // Gerar slots do dia via serviço inteligente
  const weekStart = new Date(2025, 10, 4, 0, 0, 0, 0); // 04/11/2025
  const aircraftId = 2;

  console.log('\n📅 Gerando slots (singleDay=true)...');
  const slots = await generateTimeSlots(aircraftId, weekStart, undefined, undefined, undefined, true);

  // Focar janela 16:00 → 19:30
  const focus = slots.filter(s => {
    const h = s.start.getHours();
    const m = s.start.getMinutes();
    const hm = h * 60 + m;
    return hm >= (16 * 60) && hm <= (19 * 60 + 30);
  });

  console.log('\n🗂️ Resumo de slots 16:00 → 19:30:');
  for (const s of focus) {
    const time = s.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    console.log(` - ${time}: ${s.status}${s.blockType ? ` (${s.blockType})` : ''}${s.reason ? ` — ${s.reason}` : ''}`);
  }

  // Checar especificamente 17:00, 17:30, 18:00
  const pick = t => focus.find(s => s.start.getHours() === t[0] && s.start.getMinutes() === t[1]);
  const s1700 = pick([17, 0]);
  const s1730 = pick([17, 30]);
  const s1800 = pick([18, 0]);

  console.log('\n🔎 Checagem específica:');
  console.log(`  17:00 → ${s1700 ? `${s1700.status} ${s1700.blockType || ''}` : 'n/a'}`);
  console.log(`  17:30 → ${s1730 ? `${s1730.status} ${s1730.blockType || ''}` : 'n/a'}`);
  console.log(`  18:00 → ${s1800 ? `${s1800.status} ${s1800.blockType || ''}` : 'n/a'}`);

  console.log('\nℹ️ API para visualizar no frontend:');
  console.log('   GET http://localhost:4000/api/bookings/time-slots/2?weekStart=2025-11-04T00:00:00&singleDay=true');
  console.log('   (rota requer auth; use seu token de sessão no navegador)');
}

run()
  .catch(err => { console.error('❌ Erro na inspeção:', err); })
  .finally(async () => { await prisma.$disconnect(); });