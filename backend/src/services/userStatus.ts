import { prisma } from '../db';

// Função para verificar e atualizar status do usuário baseado na mensalidade
export async function updateUserStatus(userId: number): Promise<{ status: string; message: string }> {
  try {
    // Buscar a mensalidade mais recente (simplificado)
    let latestMembership = await prisma.membershipPayment.findFirst({
      where: { userId },
      orderBy: { dueDate: 'desc' }
    });

    if (!latestMembership) {
      // Se não tem mensalidade, marcar como inativo
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'inactive' }
      });
      return { status: 'inactive', message: 'Usuário sem mensalidade - marcado como inativo' };
    }

    const now = new Date();
    const dueDate = new Date(latestMembership.dueDate);
    
    let userStatus = 'active';
    let message = '';

    console.log(`🔍 Debug updateUserStatus:`);
    console.log(`  - Status da mensalidade: ${latestMembership.status}`);
    console.log(`  - Data atual: ${now.toISOString()}`);
    console.log(`  - Data de vencimento: ${dueDate.toISOString()}`);
    console.log(`  - Está vencida: ${now > dueDate}`);

    if (latestMembership.status === 'confirmada' || latestMembership.status === 'paga') {
      // Se a mensalidade está confirmada ou paga, usuário sempre ativo
      userStatus = 'active';
      message = 'Mensalidade paga/confirmada - usuário ativo';
    } else if (latestMembership.status === 'pendente') {
      if (now > dueDate) {
        // Mensalidade pendente e vencida
        userStatus = 'inactive';
        message = 'Mensalidade pendente e vencida - usuário marcado como inativo';
      } else {
        userStatus = 'active';
        message = 'Mensalidade pendente mas não vencida - usuário ativo';
      }
    } else if (latestMembership.status === 'atrasada') {
      // Status atrasada - SEMPRE inativo
      userStatus = 'inactive';
      message = 'Mensalidade atrasada - usuário marcado como inativo';
    } else {
      // Outros status (cancelada, etc.)
      userStatus = 'inactive';
      message = `Mensalidade com status ${latestMembership.status} - usuário marcado como inativo`;
    }

    console.log(`  - Status final do usuário: ${userStatus}`);
    console.log(`  - Mensagem: ${message}`);

    console.log(`🔄 updateUserStatus: Atualizando usuário ID ${userId} para status: ${userStatus}`);
    
    // Atualizar status do usuário
    await prisma.user.update({
      where: { id: userId },
      data: { status: userStatus }
    });
    
    console.log(`✅ updateUserStatus: Usuário ID ${userId} atualizado para: ${userStatus}`);

    return { status: userStatus, message };
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    throw error;
  }
}

// Função para verificar status de todos os usuários (cron job)
export async function updateAllUsersStatus(): Promise<{ updated: number; errors: number }> {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'user' } // Apenas usuários normais, não admins
    });

    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        await updateUserStatus(user.id);
        updated++;
      } catch (error) {
        console.error(`Erro ao atualizar status do usuário ${user.id}:`, error);
        errors++;
      }
    }

    return { updated, errors };
  } catch (error) {
    console.error('Erro ao atualizar status de todos os usuários:', error);
    throw error;
  }
}

// Função para verificar se usuário pode fazer reservas
export async function canUserMakeBooking(userId: number): Promise<{ canBook: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { canBook: false, reason: 'Usuário não encontrado' };
    }

    if (user.status === 'inactive') {
      return { canBook: false, reason: 'Usuário inativo - mensalidade em atraso' };
    }

    return { canBook: true };
  } catch (error) {
    console.error('Erro ao verificar permissão de reserva:', error);
    return { canBook: false, reason: 'Erro interno' };
  }
}

