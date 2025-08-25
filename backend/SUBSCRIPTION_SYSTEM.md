# Sistema de Assinatura PIX - Asaas

## Visão Geral

Este sistema implementa assinaturas recorrentes via PIX usando o Asaas em modo sandbox, com controle automático de status de usuário baseado na mensalidade.

## Funcionalidades

### 1. Status do Usuário
- **Ativo**: Usuário com mensalidade em dia
- **Inativo**: Usuário com mensalidade vencida ou sem mensalidade

### 2. Tipos de Pagamento
- **Pagamento Único**: PIX para uma mensalidade específica
- **Assinatura Recorrente**: Cobrança automática mensal via PIX

### 3. Controle Automático
- Verificação automática de status baseado na data de vencimento
- Bloqueio de reservas para usuários inativos
- Atualização automática via webhooks do Asaas

## Configuração

### Variáveis de Ambiente
```env
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=sua_chave_api_sandbox
```

### Webhook Asaas
Configure o webhook no painel do Asaas para:
```
URL: https://seu-dominio.com/api/webhooks/asaas
Eventos: PAYMENT_RECEIVED, SUBSCRIPTION_CREATED, SUBSCRIPTION_CANCELLED, SUBSCRIPTION_PAYMENT_RECEIVED, SUBSCRIPTION_PAYMENT_OVERDUE
```

## Endpoints

### Pagamentos
- `POST /payments/membership/:userId` - Criar pagamento único
- `POST /payments/membership/subscription/:userId` - Criar assinatura recorrente
- `POST /payments/membership/subscription/:subscriptionId/cancel` - Cancelar assinatura

### Status de Usuário
- `POST /users/status/check/:userId` - Verificar status de um usuário
- `POST /users/status/check-all` - Verificar status de todos os usuários
- `GET /users/can-book/:userId` - Verificar se usuário pode fazer reservas

## Fluxo de Funcionamento

### 1. Criação de Assinatura
1. Usuário escolhe criar assinatura recorrente
2. Sistema cria cliente no Asaas (se necessário)
3. Sistema cria assinatura recorrente no Asaas
4. Sistema registra mensalidade no banco com `subscriptionId`

### 2. Pagamento Automático
1. Asaas gera cobrança PIX automaticamente
2. Usuário paga via PIX
3. Asaas envia webhook `SUBSCRIPTION_PAYMENT_RECEIVED`
4. Sistema marca mensalidade como paga
5. Sistema atualiza status do usuário para ativo
6. Sistema cria próxima mensalidade automaticamente

### 3. Verificação de Status
1. Sistema verifica data de vencimento da mensalidade
2. Se vencida e não paga, marca usuário como inativo
3. Usuários inativos não podem fazer reservas

## Cron Job Recomendado

Configure um cron job para verificar status diariamente:

```bash
# Executar diariamente às 6h
0 6 * * * curl -X POST https://seu-dominio.com/api/users/status/check-all
```

## Testes

### Sandbox Asaas
- Use cartões de teste do Asaas
- Configure webhook para ambiente de desenvolvimento
- Teste todos os eventos de webhook

### Status de Usuário
- Crie usuário sem mensalidade → deve ficar inativo
- Crie mensalidade vencida → usuário deve ficar inativo
- Pague mensalidade → usuário deve ficar ativo
- Deixe mensalidade vencer → usuário deve ficar inativo

## Monitoramento

### Logs Importantes
- Webhook recebidos do Asaas
- Mudanças de status de usuário
- Erros na criação/cancelamento de assinaturas
- Usuários bloqueados tentando fazer reservas

### Métricas
- Número de usuários ativos vs inativos
- Taxa de pagamento de mensalidades
- Assinaturas canceladas
- Erros de webhook

## Troubleshooting

### Problemas Comuns

1. **Webhook não recebido**
   - Verificar URL configurada no Asaas
   - Verificar logs do servidor
   - Testar endpoint manualmente

2. **Usuário não atualiza status**
   - Verificar se mensalidade existe
   - Verificar data de vencimento
   - Executar verificação manual

3. **Assinatura não criada**
   - Verificar dados do cliente no Asaas
   - Verificar API key
   - Verificar logs de erro

### Comandos Úteis

```bash
# Verificar status de um usuário
curl -X POST /api/users/status/check/123

# Verificar todos os usuários
curl -X POST /api/users/status/check-all

# Verificar se usuário pode fazer reserva
curl -X GET /api/users/can-book/123
```

## Estrutura do Banco de Dados

### Tabela User
- `status`: 'active' ou 'inactive' (baseado na mensalidade)

### Tabela MembershipPayment
- `subscriptionId`: ID da assinatura recorrente no Asaas
- `status`: 'pendente', 'paga', 'atrasada', 'cancelada'

## Componentes Frontend

### MembershipPayment.tsx
- Interface para pagamento único e assinatura recorrente
- Exibe status da mensalidade atual
- Permite cancelar assinatura recorrente
- Mostra QR Code PIX para pagamento

## Segurança

### Validações
- Verificação de status antes de permitir reservas
- Validação de dados do usuário no Asaas
- Controle de acesso por role (admin/user)

### Sandbox
- Use sempre sandbox para testes
- Configure webhooks para ambiente de desenvolvimento
- Teste todos os cenários antes de produção
