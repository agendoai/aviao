const fs = require('fs');
const path = require('path');

// Conteúdo do arquivo .env
const envContent = `# Configurações do Banco de Dados
DATABASE_URL="postgresql://postgres:password@localhost:5432/aviao_db"

# API AISWEB (DECEA) - Dados de Aeroportos Brasileiros
AISWEB_API_KEY="2084251695"
AISWEB_API_PASS="c406b683-631a-11f0-a1fe-0050569ac2e1"

# API Asaas - Sistema de Pagamentos
ASAAS_API_KEY="sua_chave_api_asaas_aqui"
ASAAS_WEBHOOK_TOKEN="seu_webhook_token_aqui"

# JWT Secret para Autenticação
JWT_SECRET="seu_jwt_secret_super_secreto_aqui_2024"

# Configurações do Servidor
PORT=3001
NODE_ENV=development

# Supabase (se estiver usando)
SUPABASE_URL="sua_url_supabase"
SUPABASE_ANON_KEY="sua_chave_anonima_supabase"
`;

// Caminho do arquivo .env
const envPath = path.join(__dirname, '.env');

try {
  // Criar arquivo .env
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log('📁 Localização:', envPath);
  console.log('🔑 Credenciais AISWEB configuradas:');
  console.log('   - API-Key: 2084251695');
  console.log('   - API-Pass: c406b683-631a-11f0-a1fe-0050569ac2e1');
  console.log('\n🚀 Agora você pode iniciar o servidor:');
  console.log('   npm run dev');
} catch (error) {
  console.error('❌ Erro ao criar arquivo .env:', error.message);
}


