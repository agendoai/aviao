# 🤖 Sistema Inteligente de Mensalidades

## 📋 Visão Geral

O sistema de mensalidades é **completamente automatizado** e funciona de forma inteligente para evitar problemas de timing e duplicação.

## ⚡ Como Funciona

### **1. Automação Completa**
- ✅ **Cron Jobs**: Rodam automaticamente quando o servidor inicia
- ✅ **Geração Diária**: Todos os dias às 9h da manhã
- ✅ **Limpeza Semanal**: Todo domingo às 2h da manhã
- ✅ **PIX Inteligente**: Gerado apenas quando usuário solicita

### **2. Lógica Inteligente de Timing**

#### **Cenário 1: Usuário se registra em 30/08**
```
✅ Cria mensalidade agosto (vencimento 15/08)
✅ Usuário paga em 02/09
❌ NÃO cria mensalidade setembro ainda
```

#### **Cenário 2: Script roda em 01/09**
```
✅ Verifica que estamos em setembro
✅ Cria mensalidade setembro (vencimento 15/09)
✅ Usuário vê nova mensalidade pendente
```

#### **Cenário 3: Usuário paga em 10/09**
```
✅ Webhook confirma pagamento
❌ NÃO cria mensalidade outubro ainda
```

#### **Cenário 4: Script roda em 01/10**
```
✅ Verifica que estamos em outubro
✅ Cria mensalidade outubro (vencimento 15/10)
```

## 🛠️ Scripts Disponíveis

### **1. Geração de Mensalidades**
```bash
# Executar manualmente
node generate-monthly-charges.js

# Via API Admin (requer token admin)
POST /api/admin/generate-monthly-charges
```

### **2. Limpeza de Duplicatas**
```bash
# Executar manualmente
node clean-duplicate-memberships.js

# Via API Admin (requer token admin)
POST /api/admin/clean-duplicate-memberships
```

### **3. Setup de Cron Jobs**
```bash
# Executar manualmente
node setup-cron.js

# Automático quando servidor inicia
# (já configurado no index.ts)
```

## 📅 Cronograma Automático

### **Diário (09:00)**
- 🔍 Verifica usuários ativos
- 📅 Cria mensalidades para o mês atual (se necessário)
- ✅ Não gera PIX (apenas registro)

### **Semanal (Domingo 02:00)**
- 🧹 Remove mensalidades duplicadas
- 🔄 Organiza registros
- ✅ Mantém apenas uma mensalidade por mês

## 🎯 Benefícios

1. **Timing Perfeito**: Mensalidades aparecem no mês correto
2. **Sem Confusão**: Usuário não vê mensalidade futura prematuramente
3. **PIX Fresco**: Cobranças geradas apenas quando necessário (24h válido)
4. **Limpeza Automática**: Duplicatas removidas sem intervenção manual
5. **Flexível**: Funciona independente de quando usuário paga

## 🔧 Configuração

### **1. Dependências**
```json
{
  "node-cron": "^3.0.3"
}
```

### **2. Variáveis de Ambiente**
```env
# Timezone para cron jobs
TZ=America/Sao_Paulo
```

### **3. Inicialização Automática**
O sistema inicia automaticamente quando o servidor backend inicia:

```typescript
// backend/src/index.ts
import { setupCronJobs } from '../setup-cron';

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  setupCronJobs(); // ← Inicia automaticamente
});
```

## 🚨 Troubleshooting

### **Problema: Mensalidades não estão sendo geradas**
```bash
# Verificar se cron jobs estão ativos
node setup-cron.js

# Executar manualmente para testar
node generate-monthly-charges.js
```

### **Problema: Mensalidades duplicadas**
```bash
# Limpar duplicatas manualmente
node clean-duplicate-memberships.js
```

### **Problema: PIX não está sendo gerado**
- ✅ Verificar se usuário clicou em "Gerar Cobrança Pix"
- ✅ Verificar se mensalidade está com status "pendente"
- ✅ Verificar logs do backend

## 📊 Monitoramento

### **Logs Importantes**
```
🕐 Configurando cron jobs automáticos...
📅 Mensalidades serão geradas automaticamente todos os dias às 9h
🧹 Limpeza será executada automaticamente todo domingo às 2h
⏰ Executando geração de mensalidades mensais (cron job)...
✅ Cron job de mensalidades mensais executado com sucesso!
```

### **Status do Sistema**
- ✅ **Automação**: Ativa
- ✅ **Próxima Execução**: 09:00 (amanhã)
- ✅ **Limpeza**: Domingos 02:00
- ✅ **PIX**: Gerado sob demanda

## 🎉 Resultado Final

O sistema agora é **100% automatizado** e **inteligente**:

- 🤖 **Ninguém precisa rodar scripts manualmente**
- ⏰ **Timing perfeito** para mensalidades
- 💰 **PIX sempre válido** (24h)
- 🧹 **Limpeza automática** de duplicatas
- 📱 **Interface admin** para controle manual (se necessário)

**O sistema cuida de tudo sozinho!** 🚀




