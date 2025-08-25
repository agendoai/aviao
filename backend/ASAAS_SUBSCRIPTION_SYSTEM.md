# 🔄 Sistema de Assinaturas Recorrentes Asaas

## 📋 Visão Geral

O sistema agora utiliza **assinaturas recorrentes via PIX** do Asaas, que é muito mais robusto e eficiente que o sistema anterior.

## ⚡ Como Funciona

### **1. Registro do Usuário**
- ✅ **Cliente Asaas**: Criado automaticamente no registro
- ✅ **Assinatura Recorrente**: Criada com `cycle: 'MONTHLY'` e `billingType: 'PIX'`
- ✅ **Primeira Mensalidade**: Registrada no banco com `subscriptionId`

### **2. Sistema de Cobranças**
- ✅ **Recorrência Automática**: Asaas gera cobranças mensais automaticamente
- ✅ **PIX Inteligente**: QR Code gerado apenas quando usuário solicita
- ✅ **Sem Duplicação**: Sistema evita pagamentos duplicados no mesmo ciclo

### **3. Webhook Inteligente**
- ✅ **Eventos Suportados**: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED_IN_CASH`
- ✅ **Pagamentos Manuais**: Suporte a pagamentos marcados manualmente no painel Asaas
- ✅ **Status Automático**: Atualização automática do status no banco

## 🛠️ Fluxo Completo

### **Cenário 1: Usuário se Registra**
```
1. Usuário preenche formulário de registro
2. Sistema cria cliente no Asaas
3. Sistema cria assinatura recorrente mensal
4. Primeira mensalidade é registrada no banco
5. Usuário recebe confirmação de conta criada
```

### **Cenário 2: Usuário Solicita Pagamento**
```
1. Usuário clica em "Gerar Cobrança Pix"
2. Sistema busca próxima cobrança pendente da assinatura
3. Sistema gera QR Code PIX para a cobrança
4. Usuário paga via PIX
5. Asaas confirma pagamento via webhook
6. Sistema atualiza status para "confirmada"
```

### **Cenário 3: Próxima Mensalidade**
```
1. Asaas gera automaticamente nova cobrança (dia 15)
2. Usuário vê nova mensalidade pendente
3. Usuário solicita QR Code PIX
4. Sistema gera QR Code para nova cobrança
5. Ciclo se repete automaticamente
```

## 🔧 APIs Disponíveis

### **1. Gerar QR Code PIX**
```http
POST /api/payments/membership/:userId
```
- Busca próxima cobrança pendente da assinatura
- Gera QR Code PIX para pagamento
- Retorna dados do PIX

### **2. Continuar Pagamento**
```http
POST /api/payments/continue/:paymentId
```
- Verifica status do pagamento
- Gera QR Code PIX para cobrança existente
- Evita duplicação de pagamentos

### **3. Webhook Asaas**
```http
POST /api/webhooks/asaas
```
- Recebe eventos de pagamento do Asaas
- Atualiza status automaticamente
- Suporta pagamentos manuais

## 📊 Benefícios do Novo Sistema

### **1. Recorrência Automática**
- ✅ **Asaas Gerencia**: Cobranças mensais automáticas
- ✅ **Sem Intervenção**: Não precisa de scripts manuais
- ✅ **Confiável**: Sistema robusto do Asaas

### **2. PIX Inteligente**
- ✅ **Sob Demanda**: QR Code gerado apenas quando necessário
- ✅ **Sempre Válido**: Não expira prematuramente
- ✅ **Sem Duplicação**: Evita pagamentos duplicados

### **3. Flexibilidade**
- ✅ **Pagamentos Manuais**: Suporte a pagamentos em mãos
- ✅ **Múltiplos Eventos**: Suporta todos os tipos de confirmação
- ✅ **Fallback**: Sistema funciona mesmo com erros

### **4. Monitoramento**
- ✅ **Logs Detalhados**: Rastreamento completo
- ✅ **Status em Tempo Real**: Atualização automática
- ✅ **Dashboard Admin**: Controle total via interface

## 🎯 Comparação: Antes vs Agora

| Aspecto | Sistema Anterior | Sistema Atual |
|---------|------------------|---------------|
| **Recorrência** | Scripts manuais | Asaas automático |
| **PIX** | Gerado automaticamente | Sob demanda |
| **Duplicação** | Possível | Impossível |
| **Manutenção** | Alta | Mínima |
| **Confiabilidade** | Média | Alta |
| **Flexibilidade** | Baixa | Alta |

## 🚀 Implementação

### **1. Schema Atualizado**
```prisma
model MembershipPayment {
  id              Int      @id @default(autoincrement())
  userId          Int
  value           Float
  dueDate         DateTime
  status          String   @default("pendente")
  paymentId       String?  // ID da cobrança atual
  subscriptionId  String?  // ID da assinatura recorrente
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### **2. Serviços Asaas**
```typescript
// Criar assinatura recorrente
createSubscription(customerId, value, description)

// Buscar próxima cobrança pendente
getNextPendingPayment(subscriptionId)

// Gerar QR Code PIX
getPixQrCode(paymentId)

// Verificar status
getPaymentStatus(paymentId)
```

### **3. Webhook Events**
```typescript
// Eventos suportados
'PAYMENT_RECEIVED'        // Pagamento recebido
'PAYMENT_CONFIRMED'       // Pagamento confirmado
'PAYMENT_RECEIVED_IN_CASH' // Pagamento manual
```

## 📱 Frontend Integration

### **1. Dashboard**
- ✅ **Status em Tempo Real**: Mostra status atual da mensalidade
- ✅ **QR Code Dinâmico**: Gerado quando usuário solicita
- ✅ **Histórico**: Mostra todas as mensalidades

### **2. Modal de Confirmação**
- ✅ **Automático**: Aparece quando pagamento é confirmado
- ✅ **WebSocket**: Atualização em tempo real
- ✅ **Feedback**: Confirmação visual para o usuário

## 🔒 Segurança

### **1. Validações**
- ✅ **Customer ID**: Verificação de cliente Asaas
- ✅ **Subscription ID**: Validação de assinatura
- ✅ **Payment ID**: Verificação de cobrança

### **2. Webhook Security**
- ✅ **Assinatura**: Verificação de assinatura do Asaas
- ✅ **Eventos**: Validação de eventos suportados
- ✅ **Idempotência**: Evita processamento duplicado

## 🎉 Resultado Final

O sistema agora é **100% automatizado** e **confiável**:

- 🔄 **Recorrência**: Gerenciada pelo Asaas
- 💰 **PIX**: Inteligente e sob demanda
- 🛡️ **Segurança**: Validações robustas
- 📊 **Monitoramento**: Logs completos
- 🎯 **Flexibilidade**: Suporte a pagamentos manuais

**O sistema é moderno, eficiente e pronto para produção!** 🚀




