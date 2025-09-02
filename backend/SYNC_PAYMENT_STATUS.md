# 🔄 Sincronização de Status de Cobranças

## 📋 Problema Resolvido

Quando você altera o status de uma cobrança no painel do Asaas (ex: marcar como "vencida"), o sistema não detecta automaticamente essa mudança. Isso acontece porque:

- ✅ **Webhooks funcionam** para pagamentos confirmados
- ❌ **Webhooks não funcionam** para mudanças manuais no painel
- ❌ **Asaas não envia** eventos para cobranças vencidas automaticamente

## 🛠️ Solução Implementada

### **1. Rotas de Sincronização**

#### **Sincronizar Cobrança Específica**
```bash
POST /api/payments/sync/:paymentId
```

**Exemplo:**
```bash
curl -X POST http://localhost:4000/api/payments/sync/pay_abc123
```

**Resposta:**
```json
{
  "paymentId": "pay_abc123",
  "asaasStatus": "OVERDUE",
  "localStatus": "atrasada",
  "message": "Status sincronizado com sucesso"
}
```

#### **Sincronizar Usuário Completo**
```bash
POST /api/payments/sync-user/:userId
```

**Exemplo:**
```bash
curl -X POST http://localhost:4000/api/payments/sync-user/14
```

**Resposta:**
```json
{
  "userId": 14,
  "subscriptionId": "sub_xyz789",
  "updated": 1,
  "errors": 0,
  "message": "Sincronização concluída: 1 atualizações, 0 erros"
}
```

### **2. Frontend - Botão de Sincronização**

No componente `UserStatusCheck.tsx`, foi adicionado um botão "Sincronizar Status" que:

- 🔄 Busca status atual no Asaas
- 📊 Atualiza status local
- 👤 Atualiza status do usuário
- ✅ Mostra feedback ao usuário

### **3. Script de Teste**

```bash
cd backend
node test-sync-payment.js
```

**Saída esperada:**
```
🔄 Testando sincronização de cobranças...

👤 Usuário: Rauan Neves (ID: 14)
📊 Status atual: active
💰 Mensalidade: ID 30
📅 Status atual: pendente
🆔 Payment ID: pay_abc123

🔄 Testando sincronização de cobrança específica...
✅ Sincronização bem-sucedida:
  - Payment ID: pay_abc123
  - Status Asaas: OVERDUE
  - Status Local: atrasada
  - Mensagem: Status sincronizado com sucesso

🔄 Testando sincronização de usuário completo...
✅ Sincronização de usuário bem-sucedida:
  - User ID: 14
  - Subscription ID: sub_xyz789
  - Atualizações: 1
  - Erros: 0
  - Mensagem: Sincronização concluída: 1 atualizações, 0 erros

📊 Verificando status final...
👤 Status do usuário: inactive
💰 Status da mensalidade: atrasada

🎯 Teste de sincronização concluído!
```

## 🎯 Como Usar

### **1. Via Frontend (Recomendado)**
1. Acesse o dashboard
2. Se aparecer tela de "Acesso Bloqueado"
3. Clique em "Sincronizar Status"
4. Aguarde a sincronização
5. Status será atualizado automaticamente

### **2. Via API (Desenvolvedor)**
```bash
# Sincronizar cobrança específica
curl -X POST http://localhost:4000/api/payments/sync/pay_abc123

# Sincronizar usuário completo
curl -X POST http://localhost:4000/api/payments/sync-user/14
```

### **3. Via Script (Teste)**
```bash
cd backend
node test-sync-payment.js
```

## 📊 Mapeamento de Status

| Status Asaas | Status Local | Descrição |
|--------------|--------------|-----------|
| `PENDING` | `pendente` | Aguardando pagamento |
| `CONFIRMED` | `confirmada` | Pagamento confirmado |
| `RECEIVED` | `confirmada` | Pagamento recebido |
| `OVERDUE` | `atrasada` | Pagamento vencido |
| `CANCELLED` | `cancelada` | Pagamento cancelado |
| `REFUNDED` | `cancelada` | Pagamento estornado |
| `RECEIVED_IN_CASH` | `paga` | Pagamento em dinheiro |

## 🔄 Fluxo de Sincronização

### **1. Sincronização de Cobrança Específica**
```
1. Recebe paymentId
2. Consulta status no Asaas
3. Busca mensalidade local
4. Compara status
5. Atualiza se diferente
6. Atualiza status do usuário
```

### **2. Sincronização de Usuário Completo**
```
1. Recebe userId
2. Busca assinatura do usuário
3. Lista todas as cobranças no Asaas
4. Compara com mensalidades locais
5. Atualiza status diferentes
6. Atualiza status do usuário
```

## 🚀 Benefícios

### **1. Detecção Manual**
- ✅ Detecta mudanças feitas no painel do Asaas
- ✅ Atualiza status de cobranças vencidas
- ✅ Sincroniza pagamentos em dinheiro

### **2. Flexibilidade**
- ✅ Sincronização individual ou completa
- ✅ Via API ou frontend
- ✅ Logs detalhados

### **3. Confiabilidade**
- ✅ Tratamento de erros
- ✅ Validação de dados
- ✅ Feedback ao usuário

## 🎯 Casos de Uso

### **1. Cobrança Vencida no Asaas**
```
1. Você marca cobrança como "vencida" no Asaas
2. Sistema não detecta automaticamente
3. Usuário clica "Sincronizar Status"
4. Status é atualizado para "atrasada"
5. Usuário fica inativo
```

### **2. Pagamento em Dinheiro**
```
1. Cliente paga em dinheiro
2. Você marca como "recebido" no Asaas
3. Sistema não detecta automaticamente
4. Usuário clica "Sincronizar Status"
5. Status é atualizado para "paga"
6. Usuário fica ativo
```

### **3. Teste de Sistema**
```
1. Execute o script de teste
2. Verifique logs de sincronização
3. Confirme atualização de status
4. Valide comportamento do sistema
```

## 🛡️ Segurança

- ✅ Validação de usuário
- ✅ Verificação de permissões
- ✅ Tratamento de erros
- ✅ Logs de auditoria

**Sistema robusto e confiável!** 🎉





