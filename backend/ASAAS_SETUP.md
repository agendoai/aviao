# Configuração do Asaas para PIX

## 1. Criar conta no Asaas

1. Acesse [https://www.asaas.com](https://www.asaas.com)
2. Clique em "Criar conta"
3. Preencha seus dados e confirme o email
4. Complete o cadastro da empresa

## 2. Obter API Key

1. Faça login no painel do Asaas
2. Vá em **Configurações > Integrações > API**
3. Clique em **"Gerar nova chave"**
4. Copie a chave gerada

## 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` com:

```env
# Configuração do Asaas
ASAAS_API_KEY="sua_chave_api_do_asaas_aqui"
ASAAS_API_URL="https://sandbox.asaas.com/api/v3"

# Para produção, use:
# ASAAS_API_URL="https://www.asaas.com/api/v3"
```

## 4. Sandbox vs Produção

### Sandbox (Teste)
- URL: `https://sandbox.asaas.com/api/v3`
- Use para testes e desenvolvimento
- Pagamentos são simulados
- Não gera cobranças reais

### Produção
- URL: `https://www.asaas.com/api/v3`
- Use para ambiente real
- Gera cobranças reais
- Requer conta verificada no Asaas

## 5. Funcionalidades Implementadas

### ✅ Criação de Cliente
- Cria automaticamente cliente no Asaas quando usuário se cadastra
- Armazena `asaasCustomerId` no banco de dados

### ✅ Cobrança PIX
- Gera cobrança PIX para mensalidades
- Gera cobrança PIX para reservas
- Retorna QR Code e código PIX

### ✅ Consulta de Status
- Verifica status do pagamento em tempo real
- Atualiza status no banco de dados

### ✅ Webhooks (Opcional)
- Recebe notificações automáticas de pagamento
- Atualiza status automaticamente

## 6. Testando

1. Configure as variáveis de ambiente
2. Reinicie o servidor backend
3. Tente gerar uma mensalidade PIX
4. Verifique se o QR Code é gerado
5. Teste o pagamento (sandbox)

## 7. Status dos Pagamentos

- `PENDING`: Aguardando pagamento
- `RECEIVED`: Pago
- `CONFIRMED`: Confirmado
- `OVERDUE`: Vencido
- `REFUNDED`: Estornado
- `CANCELLED`: Cancelado

## 8. Suporte

- [Documentação Asaas](https://docs.asaas.com/)
- [API Reference](https://docs.asaas.com/reference)
- [Webhooks](https://docs.asaas.com/docs/webhooks)

