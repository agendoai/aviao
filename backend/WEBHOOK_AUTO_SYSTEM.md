# 📡 Sistema Automático via Webhook

## 📋 Visão Geral

Sistema **100% automático** que detecta e atualiza status de cobranças vencidas através do **webhook do Asaas** + verificação automática.

## 🚀 Como Funciona

### **1. Webhook Automático (Principal)**
- ✅ **Asaas envia webhook** quando cobrança vence
- ✅ **Sistema detecta automaticamente** e marca como atrasada
- ✅ **Usuário fica inativo** automaticamente
- ✅ **Frontend bloqueia acesso** imediatamente

### **2. Sincronização Manual (Quando você muda no Asaas)**
- ✅ **Rota específica** para sincronizar mudanças manuais
- ✅ **Detecta mudanças** que não geraram webhook
- ✅ **Marca automaticamente** como atrasada/confirmada
- ✅ **Atualiza status do usuário**

## 🎯 Fluxo Automático

### **Quando Cobrança Vence no Asaas:**
```
1. Asaas detecta vencimento
2. Envia webhook PAYMENT_OVERDUE
3. Sistema recebe webhook
4. Marca mensalidade como "atrasada"
5. Atualiza usuário para "inactive"
6. Frontend mostra tela de bloqueio
7. Verifica outras cobranças vencidas
```

### **Quando Pagamento é Confirmado:**
```
1. Asaas confirma pagamento
2. Envia webhook PAYMENT_CONFIRMED
3. Sistema recebe webhook
4. Marca mensalidade como "confirmada"
5. Atualiza usuário para "active"
6. Frontend libera acesso
```

## 🛠️ Componentes

### **1. Webhook Principal (`/api/webhooks/asaas`)**
- Recebe eventos do Asaas automaticamente
- Processa `PAYMENT_OVERDUE`
- Processa `PAYMENT_CONFIRMED`
- Atualiza status automaticamente

### **2. Sincronização Manual (`/api/webhooks/sync-payment/:paymentId`)**
- Para quando você muda status manualmente no Asaas
- Sincroniza status específico
- Atualiza usuário automaticamente

### **3. Verificação Geral (`/api/webhooks/check-overdue`)**
- Verifica todas as cobranças vencidas
- Para casos especiais
- Retorna estatísticas

## 📊 Logs Automáticos

O sistema gera logs automáticos:

```
📥 Webhook Asaas recebido: { event: 'PAYMENT_OVERDUE', paymentId: 'pay_123' }
⏰ Pagamento vencido: PAYMENT_OVERDUE - Payment ID: pay_123
✅ Webhook: Mensalidade ID 456 marcada como atrasada
❌ Usuário 789 marcado como inativo devido ao vencimento

🔍 Verificando cobranças vencidas automaticamente...
📊 Encontradas 2 mensalidades vencidas não detectadas
🔄 Marcando mensalidade 789 (João Silva) como atrasada...
✅ Mensalidade 789 marcada como atrasada - Usuário João Silva inativo
🎯 Webhook: 2 cobranças vencidas adicionais foram marcadas como atrasadas
```

## 🧪 Testes

### **1. Testar Sincronização Manual (Quando você muda no Asaas)**
```bash
cd backend
node test-manual-asaas-sync.js
```

### **2. Sincronizar Cobrança Específica**
```bash
# Quando você muda uma cobrança para "vencida" no Asaas
curl -X POST http://localhost:4000/api/webhooks/sync-payment/PAYMENT_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "OVERDUE"}'

# Quando você confirma um pagamento no Asaas
curl -X POST http://localhost:4000/api/webhooks/sync-payment/PAYMENT_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

### **3. Verificação Geral**
```bash
curl -X POST http://localhost:4000/api/webhooks/check-overdue
```

## 🎯 Casos de Uso Automáticos

### **1. Cobrança Vence no Asaas**
```
✅ Asaas detecta automaticamente
✅ Envia webhook PAYMENT_OVERDUE
✅ Sistema marca como atrasada
✅ Usuário fica inativo
✅ Frontend bloqueia acesso
```

### **2. Cobrança Vence mas Não Gera Webhook**
```
✅ Verificação automática detecta
✅ Marca como atrasada
✅ Usuário fica inativo
✅ Frontend bloqueia acesso
```

### **3. Pagamento é Confirmado**
```
✅ Asaas confirma pagamento
✅ Envia webhook PAYMENT_CONFIRMED
✅ Sistema marca como confirmada
✅ Usuário fica ativo
✅ Frontend libera acesso
```

## 🚀 Benefícios

### **1. Detecção em Tempo Real**
- ✅ Webhook instantâneo do Asaas
- ✅ Verificação automática adicional
- ✅ Zero delay na detecção

### **2. Confiabilidade**
- ✅ Dupla verificação (webhook + automática)
- ✅ Logs detalhados
- ✅ Tratamento de erros

### **3. Simplicidade**
- ✅ Sem cron jobs
- ✅ Sem intervalos fixos
- ✅ Baseado em eventos reais

## 🛡️ Segurança

- ✅ Webhook validado
- ✅ Logs de auditoria
- ✅ Tratamento de erros robusto
- ✅ Execução segura

## 🎯 Resultado Final

**Agora o sistema funciona 100% automaticamente via webhook:**

1. **Cobrança vence** → Asaas envia webhook → Sistema detecta automaticamente
2. **Usuário fica inativo** → Acesso bloqueado automaticamente
3. **Pagamento confirmado** → Asaas envia webhook → Usuário reativado automaticamente
4. **Verificação adicional** → Detecta cobranças que não geraram webhook

**Zero intervenção manual necessária!** 🎉

## 📝 Configuração

O sistema é configurado automaticamente:

- **Webhook**: `/api/webhooks/asaas`
- **Verificação**: Automática a cada webhook
- **Logs**: Automáticos no console
- **Erros**: Tratados automaticamente

**Pronto para produção!** 🚀

## 🔧 URLs Importantes

- **Webhook Asaas**: `/api/webhooks/asaas` (automático)
- **Sincronização Manual**: `/api/webhooks/sync-payment/:paymentId` (quando você muda no Asaas)
- **Verificação Geral**: `/api/webhooks/check-overdue` (casos especiais)
- **Status Admin**: `/api/admin/memberships-status`

**Agora quando você mudar uma cobrança para "vencida" no Asaas, use a rota de sincronização manual para atualizar o sistema!** 🎯
