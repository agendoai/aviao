// Script para normalizar datas existentes (String local sem timezone) e regenerar slots disponíveis
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const pad = (n) => String(n).padStart(2, '0');
const formatLocalNoTZ = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// Converte quaisquer strings com Z ou timezone para string local sem timezone
function normalizeIncomingLocalString(s) {
  if (!s) return s;
  if (s instanceof Date) return formatLocalNoTZ(s);
  if (typeof s === 'string') {
    if (/Z|[+-]\d{2}:\d{2}$/.test(s)) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return formatLocalNoTZ(d);
    }
    // Se já está no formato local simples, manter
    const m = s.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/);
    if (m) return s.length === 16 ? `${s}:00` : s; // garantir segundos
    // Tentativa final
    const d = new Date(s);
    if (!isNaN(d.getTime())) return formatLocalNoTZ(d);
    return s;
  }
  // Outros tipos
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return formatLocalNoTZ(d);
  } catch {}
  return s;
}

async function fixMissionDates() {
  console.log('🔧 Normalizando datas de missões existentes...');
  const bookings = await prisma.booking.findMany({
    where: {
      NOT: {
        AND: [{ origin: 'AGENDA' }, { destination: 'AGENDA' }, { status: 'available' }]
      }
    },
    orderBy: { id: 'asc' }
  });

  let updated = 0;
  for (const b of bookings) {
    const data = {};
    const dep = normalizeIncomingLocalString(b.departure_date);
    const ret = normalizeIncomingLocalString(b.return_date);
    const actDep = normalizeIncomingLocalString(b.actual_departure_date);
    const actRet = normalizeIncomingLocalString(b.actual_return_date);
    const secDep = normalizeIncomingLocalString(b.secondary_departure_time);

    if (dep !== b.departure_date) data.departure_date = dep;
    if (ret !== b.return_date) data.return_date = ret;
    if (actDep !== b.actual_departure_date) data.actual_departure_date = actDep;
    if (actRet !== b.actual_return_date) data.actual_return_date = actRet;
    if (secDep !== b.secondary_departure_time) data.secondary_departure_time = secDep;

    if (Object.keys(data).length > 0) {
      await prisma.booking.update({ where: { id: b.id }, data });
      updated++;
    }
  }
  console.log(`✅ Missões normalizadas: ${updated}/${bookings.length}`);
}

async function regenerateAvailableSlots(days = 30) {
  console.log('🔄 Regenerando slots disponíveis (AGENDA)...');
  const aircrafts = await prisma.aircraft.findMany({ select: { id: true } });

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  for (const a of aircrafts) {
    console.log(`✈️ Aeronave ${a.id}: limpando slots antigos...`);
    await prisma.booking.deleteMany({
      where: {
        aircraftId: a.id,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA'
      }
    });

    const data = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      for (let hour = 0; hour < 24; hour++) {
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(d);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        const preFlightStart = new Date(slotStart.getTime() - 3 * 60 * 60 * 1000);
        const postFlightEnd = new Date(slotEnd.getTime() + 3 * 60 * 60 * 1000);

        data.push({
          userId: 1,
          aircraftId: a.id,
          origin: 'AGENDA',
          destination: 'AGENDA',
          departure_date: formatLocalNoTZ(preFlightStart),
          return_date: formatLocalNoTZ(postFlightEnd),
          actual_departure_date: formatLocalNoTZ(slotStart),
          actual_return_date: formatLocalNoTZ(slotEnd),
          passengers: 0,
          flight_hours: 0,
          overnight_stays: 0,
          value: 0,
          status: 'available'
        });
      }
    }

    console.log(`📝 Criando ${data.length} slots para aeronave ${a.id}...`);
    if (data.length > 0) {
      await prisma.booking.createMany({ data, skipDuplicates: true });
      console.log(`✅ Slots criados para aeronave ${a.id}`);
    }
  }
}

async function main() {
  try {
    await fixMissionDates();
    await regenerateAvailableSlots(30);
    console.log('🎉 Correção concluída.');
  } catch (err) {
    console.error('❌ Erro na correção:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();