#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuração
const LOG_DIR = path.join(__dirname, 'logs');
const WEBHOOK_LOG_FILE = path.join(LOG_DIR, 'webhook.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'webhook-errors.log');

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Função para colorir texto
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Função para formatar timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Função para exibir log formatado
function displayLog(log) {
  const timestamp = formatTimestamp(log.timestamp);
  const statusIcon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
  const statusColor = log.status === 'success' ? 'green' : log.status === 'error' ? 'red' : 'yellow';
  
  console.log(`\n${statusIcon} ${colorize(timestamp, 'cyan')} [${colorize(log.webhookType, 'blue')}] ${colorize(log.event, 'magenta')}`);
  console.log(`   ${colorize(log.message, 'white')}`);
  
  if (log.paymentId) {
    console.log(`   💳 Payment ID: ${colorize(log.paymentId, 'yellow')}`);
  }
  
  if (log.subscriptionId) {
    console.log(`   🔄 Subscription ID: ${colorize(log.subscriptionId, 'yellow')}`);
  }
  
  if (log.processingTime) {
    console.log(`   ⏱️  Tempo: ${colorize(log.processingTime + 'ms', 'green')}`);
  }
  
  if (log.error) {
    console.log(`   ${colorize('❌ Erro:', 'red')} ${colorize(log.error, 'red')}`);
  }
  
  if (log.requestBody) {
    console.log(`   📦 Dados: ${colorize(JSON.stringify(log.requestBody, null, 2), 'white')}`);
  }
}

// Função para monitorar logs em tempo real
function monitorLogs() {
  console.log(colorize('🔍 MONITOR DE WEBHOOKS - INICIADO', 'bright'));
  console.log(colorize('📁 Monitorando:', 'cyan'));
  console.log(`   📝 Logs gerais: ${WEBHOOK_LOG_FILE}`);
  console.log(`   ❌ Logs de erro: ${ERROR_LOG_FILE}`);
  console.log(colorize('\n⏳ Aguardando webhooks...\n', 'yellow'));
  
  // Verificar se os arquivos existem
  if (!fs.existsSync(WEBHOOK_LOG_FILE)) {
    console.log(colorize('⚠️  Arquivo de log não encontrado. Aguardando criação...', 'yellow'));
  }
  
  // Monitorar arquivo de logs gerais
  let lastSize = 0;
  
  const checkLogs = () => {
    try {
      if (fs.existsSync(WEBHOOK_LOG_FILE)) {
        const stats = fs.statSync(WEBHOOK_LOG_FILE);
        
        if (stats.size > lastSize) {
          const content = fs.readFileSync(WEBHOOK_LOG_FILE, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.trim());
          
          // Processar apenas linhas novas
          const newLines = lines.slice(lastSize / 20); // Aproximação
          
          newLines.forEach(line => {
            try {
              const log = JSON.parse(line);
              displayLog(log);
            } catch (err) {
              // Linha inválida, ignorar
            }
          });
          
          lastSize = stats.size;
        }
      }
    } catch (err) {
      console.error(colorize('❌ Erro ao ler logs:', 'red'), err.message);
    }
  };
  
  // Verificar logs a cada 1 segundo
  setInterval(checkLogs, 1000);
}

// Função para exibir estatísticas
function showStats() {
  try {
    if (!fs.existsSync(WEBHOOK_LOG_FILE)) {
      console.log(colorize('❌ Arquivo de log não encontrado', 'red'));
      return;
    }
    
    const content = fs.readFileSync(WEBHOOK_LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    const stats = {
      total: logs.length,
      success: logs.filter(log => log.status === 'success').length,
      errors: logs.filter(log => log.status === 'error').length,
      warnings: logs.filter(log => log.status === 'warning').length,
      byWebhookType: {},
      byEvent: {},
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
      .map(log => log.processingTime);
    
    if (processingTimes.length > 0) {
      stats.averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    }
    
    console.log(colorize('\n📊 ESTATÍSTICAS DOS WEBHOOKS', 'bright'));
    console.log(colorize('=' * 50, 'cyan'));
    console.log(`📈 Total de logs: ${colorize(stats.total, 'white')}`);
    console.log(`✅ Sucessos: ${colorize(stats.success, 'green')}`);
    console.log(`❌ Erros: ${colorize(stats.errors, 'red')}`);
    console.log(`⚠️  Warnings: ${colorize(stats.warnings, 'yellow')}`);
    console.log(`⏱️  Tempo médio: ${colorize(stats.averageProcessingTime.toFixed(2) + 'ms', 'cyan')}`);
    
    console.log(colorize('\n🔧 POR TIPO DE WEBHOOK:', 'bright'));
    Object.entries(stats.byWebhookType).forEach(([type, count]) => {
      console.log(`   ${type}: ${colorize(count, 'white')}`);
    });
    
    console.log(colorize('\n📡 POR EVENTO:', 'bright'));
    Object.entries(stats.byEvent).forEach(([event, count]) => {
      console.log(`   ${event}: ${colorize(count, 'white')}`);
    });
    
  } catch (err) {
    console.error(colorize('❌ Erro ao gerar estatísticas:', 'red'), err.message);
  }
}

// Função para exibir logs recentes
function showRecentLogs(limit = 10) {
  try {
    if (!fs.existsSync(WEBHOOK_LOG_FILE)) {
      console.log(colorize('❌ Arquivo de log não encontrado', 'red'));
      return;
    }
    
    const content = fs.readFileSync(WEBHOOK_LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    const recentLines = lines.slice(-limit).reverse();
    
    console.log(colorize(`\n📋 ÚLTIMOS ${limit} LOGS:`, 'bright'));
    console.log(colorize('=' * 50, 'cyan'));
    
    recentLines.forEach(line => {
      try {
        const log = JSON.parse(line);
        displayLog(log);
      } catch (err) {
        console.log(colorize(`❌ Log inválido: ${line}`, 'red'));
      }
    });
    
  } catch (err) {
    console.error(colorize('❌ Erro ao ler logs recentes:', 'red'), err.message);
  }
}

// Função para exibir logs de erro
function showErrorLogs(limit = 10) {
  try {
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      console.log(colorize('❌ Arquivo de erro não encontrado', 'red'));
      return;
    }
    
    const content = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    const recentLines = lines.slice(-limit).reverse();
    
    console.log(colorize(`\n❌ ÚLTIMOS ${limit} ERROS:`, 'bright'));
    console.log(colorize('=' * 50, 'cyan'));
    
    recentLines.forEach(line => {
      try {
        const log = JSON.parse(line);
        displayLog(log);
      } catch (err) {
        console.log(colorize(`❌ Log inválido: ${line}`, 'red'));
      }
    });
    
  } catch (err) {
    console.error(colorize('❌ Erro ao ler logs de erro:', 'red'), err.message);
  }
}

// Função para limpar logs
function clearLogs() {
  try {
    if (fs.existsSync(WEBHOOK_LOG_FILE)) {
      fs.writeFileSync(WEBHOOK_LOG_FILE, '');
      console.log(colorize('✅ Logs gerais limpos', 'green'));
    }
    
    if (fs.existsSync(ERROR_LOG_FILE)) {
      fs.writeFileSync(ERROR_LOG_FILE, '');
      console.log(colorize('✅ Logs de erro limpos', 'green'));
    }
    
  } catch (err) {
    console.error(colorize('❌ Erro ao limpar logs:', 'red'), err.message);
  }
}

// Menu principal
function showMenu() {
  console.log(colorize('\n🔧 COMANDOS DISPONÍVEIS:', 'bright'));
  console.log(colorize('=' * 30, 'cyan'));
  console.log('1. 📊 Estatísticas');
  console.log('2. 📋 Logs recentes');
  console.log('3. ❌ Logs de erro');
  console.log('4. 🧹 Limpar logs');
  console.log('5. 🔍 Monitorar em tempo real');
  console.log('6. ❌ Sair');
  console.log(colorize('\nDigite o número do comando:', 'yellow'));
}

// Função principal
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Modo interativo
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    showMenu();
    
    rl.on('line', (input) => {
      const choice = input.trim();
      
      switch (choice) {
        case '1':
          showStats();
          break;
        case '2':
          showRecentLogs();
          break;
        case '3':
          showErrorLogs();
          break;
        case '4':
          clearLogs();
          break;
        case '5':
          monitorLogs();
          break;
        case '6':
          console.log(colorize('👋 Saindo...', 'green'));
          rl.close();
          process.exit(0);
          break;
        default:
          console.log(colorize('❌ Comando inválido', 'red'));
      }
      
      setTimeout(showMenu, 1000);
    });
    
  } else {
    // Modo comando
    const command = args[0];
    
    switch (command) {
      case 'stats':
        showStats();
        break;
      case 'logs':
        showRecentLogs(parseInt(args[1]) || 10);
        break;
      case 'errors':
        showErrorLogs(parseInt(args[1]) || 10);
        break;
      case 'clear':
        clearLogs();
        break;
      case 'monitor':
        monitorLogs();
        break;
      default:
        console.log(colorize('❌ Comando inválido', 'red'));
        console.log(colorize('Uso: node monitor-webhooks.js [comando]', 'yellow'));
        console.log(colorize('Comandos: stats, logs [limite], errors [limite], clear, monitor', 'yellow'));
    }
  }
}

// Executar
main();



