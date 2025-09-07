# 🧹 Scripts de Limpeza do Sistema

Scripts para limpar dados de teste do sistema de aviação.

## 📁 Scripts Disponíveis

### 1. `clean-calendar.js` - Limpeza Básica
**Limpa apenas as missões (bookings)**
```bash
node clean-calendar.js
```

**O que faz:**
- ✅ Deleta todas as missões
- ✅ Mostra contagem antes/depois
- ✅ Confirma limpeza

### 2. `clean-all-data.js` - Limpeza Completa
**Limpa todos os dados de teste**
```bash
node clean-all-data.js
```

**O que faz:**
- ✅ Missões (bookings)
- ✅ Transações (transactions)
- ✅ Solicitações de participação
- ✅ Mensagens do chat
- ✅ Missões compartilhadas
- ✅ Resumo detalhado

### 3. `backup-and-clean.js` - Backup + Limpeza
**Faz backup antes de limpar**
```bash
node backup-and-clean.js
```

**O que faz:**
- 💾 Cria backup completo dos dados
- 🗂️ Salva em pasta `backups/`
- 🧹 Limpa todos os dados
- 📊 Mostra estatísticas

## 🚀 Como Usar

### **Opção 1: Limpeza Rápida (Apenas Missões)**
```bash
cd backend
node clean-calendar.js
```

### **Opção 2: Limpeza Completa**
```bash
cd backend
node clean-all-data.js
```

### **Opção 3: Backup + Limpeza (Recomendado)**
```bash
cd backend
node backup-and-clean.js
```

## 📊 Exemplo de Saída

```
🧹 Iniciando limpeza do calendário...
📊 Missões encontradas: 5
🗑️  Missões deletadas: 5
✅ Calendário limpo com sucesso!
📊 Missões restantes: 0
🎉 Limpeza concluída! O calendário está pronto para testes.
```

## ⚠️ Importante

- **Backup**: Sempre use `backup-and-clean.js` se quiser preservar dados
- **Produção**: NUNCA execute estes scripts em ambiente de produção
- **Confirmação**: Os scripts não pedem confirmação, execute com cuidado

## 🔄 Restaurar Dados

Se você usou `backup-and-clean.js`, os dados estão salvos em:
```
backups/backup-[timestamp].json
```

Para restaurar, você pode usar o arquivo de backup criado.

## 🎯 Após a Limpeza

1. **Calendário Limpo**: Todos os slots ficam verdes
2. **Testes**: Pode criar novas missões para testar
3. **Cálculos**: O sistema calcula bloqueios corretamente
4. **Validação**: Conflitos são detectados em tempo real

## 🛠️ Desenvolvimento

Para adicionar novos tipos de dados ao script:

1. Adicione a tabela no `clean-all-data.js`
2. Inclua no backup do `backup-and-clean.js`
3. Teste com dados de exemplo

---

**💡 Dica**: Use `backup-and-clean.js` sempre que quiser testar o sistema do zero!




