import { prisma } from '../db';
import { syncUserPaymentsStatus } from './asaas';
import { updateUserStatus } from './userStatus';

// Função para sincronizar automaticamente todas as cobranças pendentes
export async function autoSyncAllPayments(): Promise<{ updated: number; errors: number }> {
  try {
    console.log('🔄 Iniciando sincronização automática de cobranças...');
    
    // Buscar todos os usuários com mensalidades pendentes
    const usersWithPendingPayments = await prisma.user.findMany({
      where: {
        role: 'user',
        membershipPayments: {
          some: {
            status: {
              in: ['pendente', 'atrasada']
            }
          }
        }
      },
      include: {
        membershipPayments: {
          where: {
            subscriptionId: { not: null }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    console.log(`📊 Encontrados ${usersWithPendingPayments.length} usuários com cobranças pendentes`);

    let updated = 0;
    let errors = 0;

    for (const user of usersWithPendingPayments) {
      try {
        if (user.membershipPayments.length > 0 && user.membershipPayments[0].subscriptionId) {
          console.log(`🔄 Sincronizando usuário ${user.name} (ID: ${user.id})...`);
          
          const result = await syncUserPaymentsStatus(user.id, user.membershipPayments[0].subscriptionId);
          
          if (result.updated > 0) {
            console.log(`✅ Usuário ${user.name} atualizado: ${result.updated} mudanças`);
            updated += result.updated;
          }
          
          errors += result.errors;
        }
      } catch (error) {
        console.error(`❌ Erro ao sincronizar usuário ${user.id}:`, error);
        errors++;
      }
    }

    console.log(`🎯 Sincronização automática concluída: ${updated} atualizações, ${errors} erros`);
    return { updated, errors };
    
  } catch (error) {
    console.error('❌ Erro na sincronização automática:', error);
    throw error;
  }
}

// Função para verificar automaticamente cobranças vencidas
export async function checkOverduePayments(): Promise<{ updated: number; errors: number }> {
  try {
    console.log('⏰ Verificando cobranças vencidas automaticamente...');
    
    const now = new Date();
    
    // Buscar mensalidades pendentes que estão vencidas
    const overdueMemberships = await prisma.membershipPayment.findMany({
      where: {
        status: 'pendente',
        dueDate: {
          lt: now // Vencimento menor que agora = vencida
        }
      },
      include: {
        user: true
      }
    });

    console.log(`📊 Encontradas ${overdueMemberships.length} mensalidades vencidas`);

    let updated = 0;
    let errors = 0;

    for (const membership of overdueMemberships) {
      try {
        console.log(`🔄 Marcando mensalidade ${membership.id} como atrasada...`);
        
        // Marcar como atrasada
        await prisma.membershipPayment.update({
          where: { id: membership.id },
          data: { status: 'atrasada' }
        });

        // Atualizar status do usuário
        await updateUserStatus(membership.userId);
        
        console.log(`✅ Mensalidade ${membership.id} marcada como atrasada`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Erro ao marcar mensalidade ${membership.id} como atrasada:`, error);
        errors++;
      }
    }

    console.log(`🎯 Verificação de vencimentos concluída: ${updated} atualizações, ${errors} erros`);
    return { updated, errors };
    
  } catch (error) {
    console.error('❌ Erro na verificação de vencimentos:', error);
    throw error;
  }
}

// Função principal que executa todas as verificações automáticas
export async function runAutoChecks(): Promise<void> {
  try {
    console.log('🤖 Iniciando verificações automáticas...');
    
    // 1. Verificar cobranças vencidas
    const overdueResult = await checkOverduePayments();
    
    // 2. Sincronizar com Asaas
    const syncResult = await autoSyncAllPayments();
    
    console.log('🎯 Verificações automáticas concluídas:');
    console.log(`  - Vencimentos verificados: ${overdueResult.updated} atualizações`);
    console.log(`  - Sincronizações: ${syncResult.updated} atualizações`);
    console.log(`  - Total de erros: ${overdueResult.errors + syncResult.errors}`);
    
  } catch (error) {
    console.error('❌ Erro nas verificações automáticas:', error);
  }
}





