# Calendário com Validação Inteligente

## Visão Geral

O sistema de calendário agora possui validação inteligente que garante que cada missão tenha 3 horas livres antes da decolagem para preparação, checagem e briefing.

## Como Funciona

### Regra das 3 Horas

Cada missão aérea precisa de:
- **3 horas antes da decolagem**: Preparação, checagem da aeronave, briefing da tripulação
- **Tempo de voo**: Ida e volta da missão
- **3 horas após o pouso**: Encerramento, manutenção, relatórios

### Validação em Tempo Real

Quando o usuário seleciona um horário no calendário:

1. **Sistema verifica** se há 3 horas livres antes do horário selecionado
2. **Se disponível**: Mostra mensagem verde de confirmação
3. **Se indisponível**: Mostra mensagem vermelha com explicação e sugestões

### Mensagens Visuais

#### ✅ Horário Disponível
```
✅ Horário Disponível
Este horário está disponível para agendamento. 
Clique em "Nova Reserva" para continuar.
```

#### ⛔ Horário Indisponível
```
⛔ Horário Indisponível
Indisponível: só pode decolar a partir de 14:00 (15/12/2024)
```

### Sugestões Automáticas

O sistema calcula automaticamente os próximos horários disponíveis e oferece:

- **Botões de sugestão**: Clique para selecionar automaticamente
- **Próximo horário recomendado**: Baseado na disponibilidade real
- **Múltiplas opções**: Até 3 horários alternativos

## Exemplo de Uso

### Cenário 1: Voo às 10:00
- **Usuário seleciona**: 10:00
- **Sistema verifica**: Precisa de 3h livres (07:00-10:00)
- **Se há voo até 17:00**: ✅ Disponível
- **Se há voo até 18:00**: ⛔ Indisponível (conflito com pós-voo)

### Cenário 2: Voo às 18:00
- **Usuário seleciona**: 18:00
- **Sistema verifica**: Precisa de 3h livres (15:00-18:00)
- **Se há voo até 14:00**: ✅ Disponível
- **Se há voo até 16:00**: ⛔ Indisponível (conflito com pós-voo)

## Componentes Implementados

### 1. Validador de Missões (`missionValidator.ts`)
```typescript
// Valida um horário específico
const validacao = validarHorarioCalendario(horarioCandidato, bookings, 2);

// Gera sugestões
const sugestoes = sugerirHorarios(horarioDesejado, duracaoMissao, missoes);
```

### 2. Calendário Inteligente (`FlightCalendar.tsx`)
- Validação em tempo real ao selecionar horário
- Mensagens visuais claras
- Sugestões automáticas
- Interface responsiva

### 3. Demonstração (`CalendarValidationDemo.tsx`)
- Teste de diferentes horários
- Explicação visual da regra
- Exemplos práticos

## Benefícios

### Para o Usuário
- **Feedback imediato**: Sabe instantaneamente se pode agendar
- **Sugestões inteligentes**: Não precisa adivinhar horários disponíveis
- **Interface clara**: Mensagens visuais fáceis de entender
- **Economia de tempo**: Evita tentativas de agendamento inválidas

### Para o Sistema
- **Prevenção de conflitos**: Evita agendamentos impossíveis
- **Otimização de recursos**: Melhor aproveitamento da aeronave
- **Regras consistentes**: Aplica a regra das 3h automaticamente
- **Auditoria**: Rastreamento de decisões de validação

## Configuração

### Constantes Ajustáveis
```typescript
const PRE_VOO_HORAS = 3;      // Horas antes da decolagem
const POS_VOO_HORAS = 3;      // Horas após o pouso
const PROXIMA_MISSAO_HORAS = 3; // Horas entre missões
```

### Personalização
- Alterar tempos de preparação/encerramento
- Adicionar regras específicas por aeronave
- Configurar horários de operação
- Definir exceções para emergências

## Testes

### Cenários de Teste
1. **Horário livre**: Deve permitir agendamento
2. **Conflito pré-voo**: Deve bloquear e sugerir alternativa
3. **Conflito pós-voo**: Deve bloquear e sugerir alternativa
4. **Múltiplos conflitos**: Deve encontrar próximo horário livre
5. **Fim do dia**: Deve sugerir próximo dia

### Como Testar
1. Acesse o calendário
2. Clique em diferentes horários
3. Observe as mensagens de validação
4. Teste as sugestões automáticas
5. Use a demonstração para entender melhor

## Próximas Melhorias

- [ ] Validação por tipo de aeronave
- [ ] Regras específicas por piloto
- [ ] Integração com sistema de manutenção
- [ ] Notificações em tempo real
- [ ] Histórico de validações
- [ ] Relatórios de disponibilidade
