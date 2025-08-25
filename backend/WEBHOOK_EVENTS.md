# 📡 Webhook Asaas - Eventos Suportados

## 📋 Visão Geral

O webhook `/api/webhooks/asaas` recebe eventos do Asaas e atualiza automaticamente o status dos pagamentos no sistema.

## ✅ Eventos Suportados

### **1. Pagamentos Gerais**
- `PAYMENT_RECEIVED` - Pagamento recebido
- `PAYMENT_CONFIRMED` - Pagamento confirmado  
- `PAYMENT_RECEIVED_IN_CASH` - Pagamento recebido em mãos

### **2. Assinaturas**
- `SUBSCRIPTION_CREATED` - Assinatura criada
- `SUBSCRIPTION_INACTIVATED` - Assinatura inativada
- `SUBSCRIPTION_UPDATED` - Assinatura atualizada
- `SUBSCRIPTION_DELETED` - Assinatura removida

## 🔄 Como Funciona

### **Eventos de Pagamento Geral**
```
1. Asaas envia evento PAYMENT_RECEIVED
2. Sistema busca mensalidade com paymentId
3. Atualiza status para 'confirmada' ou 'paga'
4. Atualiza status do usuário
5. Logs detalhados para monitoramento
```

### **Eventos de Assinatura**
```
1. Asaas envia evento SUBSCRIPTION_CREATED
2. Sistema registra nova assinatura
3. Asaas envia evento SUBSCRIPTION_INACTIVATED/DELETED
4. Sistema marca mensalidades como canceladas
5. Status do usuário atualizado automaticamente
```

## 📊 Status de Mensalidades

| Status | Descrição | Evento |
|--------|-----------|--------|
| `pendente` | Aguardando pagamento | - |
| `confirmada` | Pagamento confirmado | PAYMENT_CONFIRMED |
| `paga` | Pagamento recebido em mãos | PAYMENT_RECEIVED_IN_CASH |
| `cancelada` | Assinatura cancelada | SUBSCRIPTION_INACTIVATED/DELETED |

## 🛡️ Segurança

### **Validação de Eventos**
- ✅ Lista de eventos suportados
- ✅ Retorna 200 para eventos não suportados
- ✅ Logs detalhados para auditoria

### **Tratamento de Erros**
- ✅ Try/catch para capturar erros
- ✅ Logs de erro detalhados
- ✅ Retorna 500 em caso de erro

## 📝 Logs de Exemplo

### **Pagamento Confirmado**
```
📥 Webhook Asaas recebido: { event: 'PAYMENT_CONFIRMED', paymentId: 'pay_123', subscriptionId: 'sub_456' }
💰 Pagamento confirmado: PAYMENT_CONFIRMED - Payment ID: pay_123
✅ Webhook: Mensalidade ID 15 marcada como confirmada
🔄 Assinatura ID sub_456 - Próxima cobrança será gerada automaticamente pelo Asaas.
```

### **Assinatura Inativada**
```
📥 Webhook Asaas recebido: { event: 'SUBSCRIPTION_INACTIVATED', subscriptionId: 'sub_456' }
❌ Assinatura inativada: sub_456
✅ Usuário 15 atualizado após cancelamento da assinatura
```

### **Evento Não Suportado**
```
📥 Webhook Asaas recebido: { event: 'PAYMENT_REFUNDED', paymentId: 'pay_123', subscriptionId: null }
⚠️ Evento não suportado: PAYMENT_REFUNDED
```

## 🔧 Configuração no Asaas

### **URL do Webhook**
```
https://seudominio.com/api/webhooks/asaas
```

### **Eventos a Configurar**
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_RECEIVED_IN_CASH
- ✅ SUBSCRIPTION_CREATED
- ✅ SUBSCRIPTION_INACTIVATED
- ✅ SUBSCRIPTION_UPDATED
- ✅ SUBSCRIPTION_DELETED

## 🎯 Benefícios

### **1. Automatização Completa**
- ✅ Status atualizado automaticamente
- ✅ Sem intervenção manual
- ✅ Confirmação em tempo real

### **2. Flexibilidade**
- ✅ Suporte a pagamentos manuais
- ✅ Múltiplos tipos de confirmação
- ✅ Eventos de assinatura

### **3. Monitoramento**
- ✅ Logs detalhados
- ✅ Rastreamento completo
- ✅ Auditoria facilitada

## 🚀 Pronto para Produção

O webhook está **100% configurado** e **pronto para produção**:

- 🛡️ **Seguro**: Validação de eventos
- 🔄 **Automático**: Atualização instantânea
- 📊 **Monitorado**: Logs completos
- 🎯 **Flexível**: Suporte a todos os cenários

**O sistema está pronto para receber eventos do Asaas!** 🚀
