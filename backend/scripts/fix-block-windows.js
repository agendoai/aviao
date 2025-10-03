require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function alignBlockedUntilWithReturn() {
  console.log('🔧 Ajuste de janelas de bloqueio: blocked_until = return_date');

  const targetStatuses = ['pendente', 'confirmada', 'paga', 'blocked'];

  const bookings = await prisma.booking.findMany({
    where: { status: { in: targetStatuses } },
    select: {
      id: true,
      status: true,
      departure_date: true,
      return_date: true,
      blocked_until: true,
      origin: true,
      destination: true,
    },
    orderBy: { departure_date: 'asc' }
  });

  let updatedCount = 0;
  for (const b of bookings) {
    if (!b.return_date) continue;

    const ret = new Date(b.return_date);
    const blocked = b.blocked_until ? new Date(b.blocked_until) : null;

    const needsUpdate = !blocked || blocked.getTime() !== ret.getTime();
    if (needsUpdate) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { blocked_until: ret }
      });
      updatedCount++;
      console.log(
        `✅ Booking ${b.id} (${b.origin} → ${b.destination}): blocked_until atualizado para ${ret.toISOString()}`
      );
    }
  }

  console.log(`🏁 Concluído. Atualizados ${updatedCount}/${bookings.length} registros.`);
}

alignBlockedUntilWithReturn()
  .catch((e) => {
    console.error('❌ Erro no ajuste de bloqueios:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });