module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'src/index.ts',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      // Configuração de logs
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Configuração de performance
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Configuração de monitoramento
      pmx: true,
      monitoring: true,
      
      // Configuração de cluster (se necessário)
      exec_mode: 'fork',
      
      // Variáveis de ambiente específicas
      env_file: '.env',
      
      // Scripts de pré e pós execução
      pre_start: 'npm run build',
      post_start: 'echo "Backend iniciado com sucesso!"',
      
      // Configuração de health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Configuração de logs específicos para webhooks
      log_rotate_interval: '1d',
      log_rotate_max: 30,
      
      // Configuração de notificações (opcional)
      notify: false,
      
      // Configuração de cron (para reiniciar periodicamente se necessário)
      cron_restart: '0 2 * * *', // Reiniciar às 2h da manhã
      
      // Configuração de variáveis específicas para webhooks
      env_webhook_debug: {
        NODE_ENV: 'development',
        WEBHOOK_DEBUG: 'true',
        LOG_LEVEL: 'debug'
      }
    }
  ],

  // Configuração de deploy (opcional)
  deploy: {
    production: {
      user: 'root',
      host: '72.60.62.143',
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/seu-repo.git',
      path: '/var/www/backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};









