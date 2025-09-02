import { ScheduleService } from './scheduleService';

export class Scheduler {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  // Iniciar o scheduler
  static start(): void {
    if (this.isRunning) {
      // console.log('⚠️ Scheduler já está rodando');
      return;
    }

    // console.log('🚀 Iniciando scheduler de agenda...');
    this.isRunning = true;

    // Limpeza diária às 02:00
    this.scheduleDailyCleanup();
    
    // Verificação a cada 6 horas
    this.cleanupInterval = setInterval(async () => {
      try {
        // console.log('🔄 Executando limpeza automática da agenda...');
        await ScheduleService.cleanupOldSlots();
        // console.log('✅ Limpeza automática concluída');
      } catch (error) {
        console.error('❌ Erro na limpeza automática:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 horas

    // console.log('✅ Scheduler iniciado com sucesso');
  }

  // Parar o scheduler
  static stop(): void {
    if (!this.isRunning) {
      // console.log('⚠️ Scheduler não está rodando');
      return;
    }

    // console.log('🛑 Parando scheduler...');
    this.isRunning = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // console.log('✅ Scheduler parado');
  }

  // Agendar limpeza diária
  private static scheduleDailyCleanup(): void {
    const now = new Date();
    const nextCleanup = new Date();
    nextCleanup.setHours(2, 0, 0, 0); // 02:00

    // Se já passou das 02:00 hoje, agendar para amanhã
    if (now.getHours() >= 2) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    const timeUntilCleanup = nextCleanup.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        // console.log('🧹 Executando limpeza diária da agenda...');
        await ScheduleService.cleanupOldSlots();
        // console.log('✅ Limpeza diária concluída');
        
        // Agendar próxima limpeza (24 horas)
        this.scheduleDailyCleanup();
      } catch (error) {
        console.error('❌ Erro na limpeza diária:', error);
      }
    }, timeUntilCleanup);

    // console.log(`📅 Próxima limpeza diária agendada para: ${nextCleanup.toLocaleString('pt-BR')}`);
  }

  // Executar limpeza manual
  static async runManualCleanup(): Promise<void> {
    try {
      // console.log('🧹 Executando limpeza manual...');
      await ScheduleService.cleanupOldSlots();
      // console.log('✅ Limpeza manual concluída');
    } catch (error) {
      console.error('❌ Erro na limpeza manual:', error);
      throw error;
    }
  }

  // Verificar status do scheduler
  static getStatus(): { isRunning: boolean; nextCleanup?: Date } {
    return {
      isRunning: this.isRunning
    };
  }
}


