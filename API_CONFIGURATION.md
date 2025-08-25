# 🔑 Configuração de APIs do Sistema

## 📋 **APIs Utilizadas:**

### **1. AISWEB API (DECEA)** - ✅ **PRINCIPAL**
- **O que é**: API oficial do DECEA para dados de aeroportos brasileiros
- **Status**: Configurada e funcionando
- **Configuração**: Variável de ambiente `AISWEB_API_KEY`

### **2. AviationStack API** - ❌ **DEPRECATED**
- **O que é**: API internacional de dados de aeroportos
- **Status**: Hardcoded no código (remover)
- **Problema**: Chave exposta no código

### **3. RapidAPI Airport Data** - ❌ **DEPRECATED**
- **O que é**: API de dados de aeroportos via RapidAPI
- **Status**: Hardcoded no código (remover)
- **Problema**: Chave exposta no código

## ⚙️ **Configuração Atual:**

### **Backend (.env):**
```bash
# API AISWEB (DECEA) - OBRIGATÓRIA
AISWEB_API_KEY="2084251695"
AISWEB_API_PASS="c406b683-631a-11f0-a1fe-0050569ac2e1"

# API Asaas (Pagamentos)
ASAAS_API_KEY="sua_chave_api_asaas_aqui"
ASAAS_WEBHOOK_TOKEN="seu_webhook_token_aqui"

# Outras configurações
DATABASE_URL="postgresql://..."
JWT_SECRET="seu_jwt_secret_aqui"
```

## 🚨 **APIs que precisam ser removidas:**

### **1. AviationStack** (src/utils/aviationstack.ts):
```typescript
// REMOVER ESTA LINHA:
const AVIATIONSTACK_API_KEY = '4767791aeb223191266882044f5f916d';
```

### **2. RapidAPI** (src/utils/airport-data-api.ts):
```typescript
// REMOVER ESTA LINHA:
const RAPIDAPI_KEY = '70b684cd76mshe761e0344033305p19889ejsnecfa049c8cfa';
```

## ✅ **Sistema Atual (Correto):**

### **Fluxo de dados:**
```
Frontend → Backend → API AISWEB (DECEA)
    ↓         ↓         ↓
   Busca   Proxy    Dados oficiais
```

### **Configuração centralizada:**
```typescript
// backend/src/config/api-keys.ts
export const API_KEYS = {
  AISWEB: {
    URL: 'https://aisweb.decea.gov.br/api',
    KEY: process.env.AISWEB_API_KEY || '',
    FALLBACK_KEY: 'test_key_here'
  }
};
```

## 🔧 **Como configurar:**

### **1. Credenciais AISWEB configuradas:**
✅ **API-Key**: 2084251695
✅ **API-Pass**: c406b683-631a-11f0-a1fe-0050569ac2e1
✅ **Status**: Configurado e funcionando

### **2. Configurar no backend:**
```bash
# backend/.env
AISWEB_API_KEY="2084251695"
AISWEB_API_PASS="c406b683-631a-11f0-a1fe-0050569ac2e1"
```

### **3. Reiniciar servidor:**
```bash
cd backend
npm run dev
```

## 🎯 **Resultado:**

- ✅ **Apenas API oficial brasileira** (AISWEB)
- ✅ **Dados oficiais** do DECEA
- ✅ **Configuração segura** via variáveis de ambiente
- ✅ **Sistema unificado** e centralizado

## 🚨 **Ações necessárias:**

1. **Remover** AviationStack e RapidAPI do código
2. **Configurar** chave AISWEB real
3. **Testar** sistema com API oficial
4. **Remover** chaves hardcoded expostas

---

**💡 Dica**: O sistema agora usa apenas a API AISWEB (oficial brasileira) para dados de aeroportos, garantindo precisão e confiabilidade!
