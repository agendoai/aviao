# 🛩️ Configuração da API AISWEB (DECEA)

## 📋 **O que é a API AISWEB?**

A **AISWEB** é a API oficial do **DECEA** (Departamento de Controle do Espaço Aéreo) que fornece dados reais de aeroportos brasileiros, incluindo:

- ✅ Coordenadas GPS precisas
- ✅ Informações de pistas
- ✅ Dados de navegação
- ✅ Informações meteorológicas
- ✅ NOTAMs (avisos aos navegantes)

## 🔑 **Como obter a chave da API:**

1. **Acesse**: https://aisweb.decea.gov.br/api
2. **Cadastre-se** como desenvolvedor
3. **Solicite** uma chave de API
4. **Aguarde** aprovação (geralmente 24-48h)

## ⚙️ **Configuração no Sistema:**

### 1. **Adicione a variável de ambiente:**
```bash
# No arquivo .env do backend
AISWEB_API_KEY="sua_chave_api_aisweb_aqui"
```

### 2. **Reinicie o servidor:**
```bash
cd backend
npm run dev
```

## 🔄 **Como funciona o sistema:**

### **Fluxo de busca de coordenadas:**
1. **SEMPRE**: Tenta buscar na API AISWEB primeiro (dados oficiais)
2. **Se API falhar**: Usa base local como fallback
3. **Logs detalhados**: Mostra a origem dos dados (aisweb/local_fallback)

### **Exemplo de resposta:**
```json
{
  "lat": -21.1411,
  "lon": -50.4247,
  "source": "aisweb"  // ou "local"
}
```

## 🎯 **Vantagens da API AISWEB:**

- **Dados oficiais** do governo brasileiro
- **Atualizações automáticas** de coordenadas
- **Informações completas** de aeroportos
- **Alta precisão** GPS
- **Gratuita** para uso não comercial

## 🚨 **Limitações:**

- **Rate limiting**: Máximo de requisições por minuto
- **Aprovação necessária**: Chave não é automática
- **Dados apenas brasileiros**: Foco no Brasil

## 📊 **Status atual:**

- ✅ **Sistema configurado** para priorizar API AISWEB
- ✅ **Fallback local** funcionando como backup
- ✅ **Logs detalhados** mostrando origem dos dados
- ✅ **Busca de coordenadas** sempre tenta API primeiro
- ⏳ **Aguardando** chave da API para testes completos

## 🔍 **Testando a API:**

```bash
# Testar se a API está funcionando
curl http://localhost:4000/api/airports/coords?icao=SBAU
```

**Resposta esperada:**
```json
{
  "lat": -21.1411,
  "lon": -50.4247,
  "source": "aisweb"
}
```

## 📝 **Logs do sistema:**

Quando a API AISWEB estiver funcionando, você verá:
```
🔍 Buscando SBAU na API AISWEB...
✅ Coordenadas obtidas via AISWEB para SBAU
```

Quando usar fallback local:
```
ℹ️ API AISWEB falhou, usando base local para SBAU
```

---

**💡 Dica**: O sistema agora **SEMPRE** tenta usar a API AISWEB primeiro para dados oficiais e atualizados. A base local serve apenas como backup caso a API falhe!
