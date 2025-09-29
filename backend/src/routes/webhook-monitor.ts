import { Router } from 'express';
import { webhookLogger } from '../utils/webhookLogger';

const router = Router();

// Middleware para verificar se é admin
const requireAdmin = (req: any, res: any, next: any) => {
  // Aqui você pode adicionar verificação de admin se necessário
  next();
};

// Dashboard de status dos webhooks
router.get('/status', requireAdmin, (req, res) => {
  try {
    const stats = webhookLogger.getStats();
    
    if (!stats) {
      return res.status(500).json({ error: 'Erro ao gerar estatísticas' });
    }

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        stats,
        systemStatus: 'online',
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Logs recentes dos webhooks
router.get('/logs', requireAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = webhookLogger.getRecentLogs(limit);
    
    res.json({
      success: true,
      data: {
        logs,
        total: logs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler logs' });
  }
});

// Logs de erro apenas
router.get('/logs/errors', requireAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const allLogs = webhookLogger.getRecentLogs(limit * 2); // Pegar mais para filtrar
    const errorLogs = allLogs.filter(log => log.status === 'error').slice(0, limit);
    
    res.json({
      success: true,
      data: {
        logs: errorLogs,
        total: errorLogs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler logs de erro' });
  }
});

// Logs por tipo de webhook
router.get('/logs/:webhookType', requireAdmin, (req, res) => {
  try {
    const { webhookType } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const allLogs = webhookLogger.getRecentLogs(limit * 2);
    const filteredLogs = allLogs
      .filter(log => log.webhookType === webhookType)
      .slice(0, limit);
    
    res.json({
      success: true,
      data: {
        webhookType,
        logs: filteredLogs,
        total: filteredLogs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao filtrar logs' });
  }
});

// Logs por evento específico
router.get('/logs/event/:eventType', requireAdmin, (req, res) => {
  try {
    const { eventType } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const allLogs = webhookLogger.getRecentLogs(limit * 2);
    const filteredLogs = allLogs
      .filter(log => log.event === eventType)
      .slice(0, limit);
    
    res.json({
      success: true,
      data: {
        eventType,
        logs: filteredLogs,
        total: filteredLogs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao filtrar logs por evento' });
  }
});

// Logs por status (success, error, warning)
router.get('/logs/status/:status', requireAdmin, (req, res) => {
  try {
    const { status } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const allLogs = webhookLogger.getRecentLogs(limit * 2);
    const filteredLogs = allLogs
      .filter(log => log.status === status)
      .slice(0, limit);
    
    res.json({
      success: true,
      data: {
        status,
        logs: filteredLogs,
        total: filteredLogs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao filtrar logs por status' });
  }
});

// Buscar logs por paymentId
router.get('/logs/payment/:paymentId', requireAdmin, (req, res) => {
  try {
    const { paymentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const allLogs = webhookLogger.getRecentLogs(limit * 2);
    const filteredLogs = allLogs
      .filter(log => log.paymentId === paymentId)
      .slice(0, limit);
    
    res.json({
      success: true,
      data: {
        paymentId,
        logs: filteredLogs,
        total: filteredLogs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar logs por paymentId' });
  }
});

// Limpar logs antigos
router.post('/logs/cleanup', requireAdmin, (req, res) => {
  try {
    webhookLogger.cleanupOldLogs();
    
    res.json({
      success: true,
      message: 'Logs antigos foram limpos com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar logs' });
  }
});

// Teste de webhook (para verificar se está funcionando)
router.post('/test', requireAdmin, (req, res) => {
  try {
    const testData = {
      webhookType: 'TEST',
      event: 'TEST_WEBHOOK',
      paymentId: 'test_payment_123',
      message: 'Teste de webhook realizado com sucesso'
    };
    
    webhookLogger.success(testData);
    
    res.json({
      success: true,
      message: 'Teste de webhook realizado com sucesso',
      data: testData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar teste' });
  }
});

export default router;









