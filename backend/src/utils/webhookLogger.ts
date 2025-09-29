import fs from 'fs';
import path from 'path';

// Configuração de logs para webhooks
const LOG_DIR = path.join(__dirname, '../../logs');
const WEBHOOK_LOG_FILE = path.join(LOG_DIR, 'webhook.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'webhook-errors.log');

// Criar diretório de logs se não existir
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

interface WebhookLogData {
  timestamp: string;
  webhookType: string;
  event: string;
  paymentId?: string;
  subscriptionId?: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  processingTime?: number;
  error?: string;
  requestBody?: any;
}

class WebhookLogger {
  private static instance: WebhookLogger;

  private constructor() {}

  static getInstance(): WebhookLogger {
    if (!WebhookLogger.instance) {
      WebhookLogger.instance = new WebhookLogger();
    }
    return WebhookLogger.instance;
  }

  // Log de sucesso
  success(data: Omit<WebhookLogData, 'status'>) {
    const logEntry: WebhookLogData = {
      ...data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
    
    this.writeLog(WEBHOOK_LOG_FILE, logEntry);
    console.log(`✅ [WEBHOOK] ${data.webhookType} - ${data.message}`);
  }

  // Log de erro
  error(data: Omit<WebhookLogData, 'status'> & { error: string }) {
    const logEntry: WebhookLogData = {
      ...data,
      status: 'error',
      timestamp: new Date().toISOString()
    };
    
    this.writeLog(WEBHOOK_LOG_FILE, logEntry);
    this.writeLog(ERROR_LOG_FILE, logEntry);
    console.error(`❌ [WEBHOOK] ${data.webhookType} - ${data.message}`, data.error);
  }

  // Log de warning
  warning(data: Omit<WebhookLogData, 'status'>) {
    const logEntry: WebhookLogData = {
      ...data,
      status: 'warning',
      timestamp: new Date().toISOString()
    };
    
    this.writeLog(WEBHOOK_LOG_FILE, logEntry);
    console.warn(`⚠️ [WEBHOOK] ${data.webhookType} - ${data.message}`);
  }

  // Log de recebimento de webhook
  received(webhookType: string, event: string, requestBody: any) {
    this.success({
      webhookType,
      event,
      paymentId: requestBody.payment?.id,
      subscriptionId: requestBody.subscription?.id,
      message: `Webhook recebido: ${event}`,
      requestBody
    });
  }

  // Log de processamento
  processing(webhookType: string, event: string, paymentId?: string) {
    this.success({
      webhookType,
      event,
      paymentId,
      message: `Processando webhook: ${event}`
    });
  }

  // Log de conclusão
  completed(webhookType: string, event: string, paymentId?: string, processingTime?: number) {
    this.success({
      webhookType,
      event,
      paymentId,
      message: `Webhook processado com sucesso`,
      processingTime
    });
  }

  // Log de erro de processamento
  processingError(webhookType: string, event: string, error: string, paymentId?: string) {
    this.error({
      webhookType,
      event,
      paymentId,
      message: `Erro ao processar webhook`,
      error
    });
  }

  // Log de fila/performance
  queueStatus(queueLength: number, processingTime: number) {
    this.warning({
      webhookType: 'QUEUE',
      event: 'QUEUE_STATUS',
      message: `Fila de webhooks: ${queueLength} pendentes, tempo médio: ${processingTime}ms`
    });
  }

  // Log de timeout
  timeout(webhookType: string, event: string, paymentId?: string) {
    this.error({
      webhookType,
      event,
      paymentId,
      message: `Timeout ao processar webhook`,
      error: 'Webhook demorou mais de 30 segundos para processar'
    });
  }

  // Escrever no arquivo de log
  private writeLog(filePath: string, data: WebhookLogData) {
    const logLine = JSON.stringify(data) + '\n';
    
    try {
      fs.appendFileSync(filePath, logLine);
    } catch (err) {
      console.error('Erro ao escrever log:', err);
    }
  }

  // Ler logs recentes
  getRecentLogs(limit: number = 100): WebhookLogData[] {
    try {
      if (!fs.existsSync(WEBHOOK_LOG_FILE)) {
        return [];
      }

      const content = fs.readFileSync(WEBHOOK_LOG_FILE, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      const logs = lines.slice(-limit).map(line => JSON.parse(line));
      
      return logs.reverse(); // Mais recentes primeiro
    } catch (err) {
      console.error('Erro ao ler logs:', err);
      return [];
    }
  }

  // Limpar logs antigos (manter apenas últimos 1000)
  cleanupOldLogs() {
    try {
      if (!fs.existsSync(WEBHOOK_LOG_FILE)) {
        return;
      }

      const content = fs.readFileSync(WEBHOOK_LOG_FILE, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      if (lines.length > 1000) {
        const recentLines = lines.slice(-1000);
        fs.writeFileSync(WEBHOOK_LOG_FILE, recentLines.join('\n') + '\n');
        console.log(`🧹 Logs limpos: mantidos últimos 1000 registros`);
      }
    } catch (err) {
      console.error('Erro ao limpar logs:', err);
    }
  }

  // Estatísticas dos logs
  getStats() {
    try {
      const logs = this.getRecentLogs(1000);
      
      const stats = {
        total: logs.length,
        success: logs.filter(log => log.status === 'success').length,
        errors: logs.filter(log => log.status === 'error').length,
        warnings: logs.filter(log => log.status === 'warning').length,
        byWebhookType: {} as Record<string, number>,
        byEvent: {} as Record<string, number>,
        averageProcessingTime: 0
      };

      // Contar por tipo de webhook
      logs.forEach(log => {
        stats.byWebhookType[log.webhookType] = (stats.byWebhookType[log.webhookType] || 0) + 1;
        stats.byEvent[log.event] = (stats.byEvent[log.event] || 0) + 1;
      });

      // Tempo médio de processamento
      const processingTimes = logs
        .filter(log => log.processingTime)
        .map(log => log.processingTime!);
      
      if (processingTimes.length > 0) {
        stats.averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      }

      return stats;
    } catch (err) {
      console.error('Erro ao gerar estatísticas:', err);
      return null;
    }
  }
}

export const webhookLogger = WebhookLogger.getInstance();

// Limpar logs antigos a cada hora
setInterval(() => {
  webhookLogger.cleanupOldLogs();
}, 60 * 60 * 1000);









