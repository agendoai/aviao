const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔎 Verificando se blocked_until = return_date para todas as reservas...');
    const bookings = await prisma.booking.findMany({
      select: { id: true, status: true, departure_date: true, return_date: true, blocked_until: true, origin: true, destination: true }
    });

    let total = bookings.length;
    let mismatches = [];
    let nullBlocked = [];

    for (const b of bookings) {
      const rd = b.return_date ? new Date(b.return_date).getTime() : null;
      const bu = b.blocked_until ? new Date(b.blocked_until).getTime() : null;
      if (bu === null) {
        nullBlocked.push(b);
      } else if (rd !== bu) {
        mismatches.push(b);
      }
    }

    console.log(`📊 Total de reservas: ${total}`);
    console.log(`✅ Iguais: ${total - mismatches.length - nullBlocked.length}`);
    console.log(`❌ Diferentes: ${mismatches.length}`);
    console.log(`⚠️ blocked_until nulo: ${nullBlocked.length}`);

    if (mismatches.length > 0) {
      console.log('\nDetalhes das diferenças:');
      for (const b of mismatches.slice(0, 10)) {
        console.log(` - ID ${b.id} [${b.status}] ${b.origin}→${b.destination}`);
        console.log(`   return_date: ${new Date(b.return_date).toLocaleString('pt-BR')}`);
        console.log(`   blocked_until: ${new Date(b.blocked_until).toLocaleString('pt-BR')}`);
      }
      if (mismatches.length > 10) console.log(`   ... mais ${mismatches.length - 10} registros`);
    }

    if (nullBlocked.length > 0) {
      console.log('\nRegistros com blocked_until nulo (primeiros 10):');
      for (const b of nullBlocked.slice(0, 10)) {
        console.log(` - ID ${b.id} [${b.status}] ${b.origin}→${b.destination}`);
        console.log(`   return_date: ${new Date(b.return_date).toLocaleString('pt-BR')}`);
      }
    }
  } catch (err) {
    console.error('❌ Erro na verificação:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();