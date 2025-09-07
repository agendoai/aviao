#!/bin/bash

# Script para monitorar webhooks quando rodando com PM2
# Uso: ./monitor-webhooks-pm2.sh [comando]

PROJECT_DIR="/c/Users/pcdev/Documents/reservaaviao/projeto/aviao/backend"
LOG_DIR="$PROJECT_DIR/logs"
WEBHOOK_LOG="$LOG_DIR/webhook.log"
ERROR_LOG="$LOG_DIR/webhook-errors.log"

# Cores para o terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Função para colorir texto
colorize() {
    local color=$1
    local text=$2
    echo -e "${color}${text}${NC}"
}

# Função para mostrar status do PM2
show_pm2_status() {
    echo -e "\n${CYAN}📊 STATUS DO PM2:${NC}"
    echo "=================="
    pm2 status
}

# Função para mostrar logs do PM2
show_pm2_logs() {
    local lines=${1:-50}
    echo -e "\n${CYAN}📋 ÚLTIMAS ${lines} LINHAS DO PM2:${NC}"
    echo "================================="
    pm2 logs backend --lines $lines --timestamp
}

# Função para monitorar logs em tempo real
monitor_pm2_logs() {
    echo -e "\n${GREEN}🔍 MONITORANDO LOGS DO PM2 EM TEMPO REAL${NC}"
    echo "Pressione Ctrl+C para parar"
    echo "================================"
    pm2 logs backend --timestamp
}

# Função para monitorar arquivos de webhook
monitor_webhook_files() {
    echo -e "\n${GREEN}🔍 MONITORANDO ARQUIVOS DE WEBHOOK EM TEMPO REAL${NC}"
    echo "Pressione Ctrl+C para parar"
    echo "=========================================="
    
    if [ ! -f "$WEBHOOK_LOG" ]; then
        echo -e "${YELLOW}⚠️  Arquivo de log não encontrado: $WEBHOOK_LOG${NC}"
        echo "Aguardando criação..."
    fi
    
    if [ ! -f "$ERROR_LOG" ]; then
        echo -e "${YELLOW}⚠️  Arquivo de erro não encontrado: $ERROR_LOG${NC}"
        echo "Aguardando criação..."
    fi
    
    # Monitorar ambos os arquivos
    tail -f "$WEBHOOK_LOG" "$ERROR_LOG" 2>/dev/null | while read line; do
        if [[ $line == *"webhook.log"* ]]; then
            echo -e "${GREEN}📝 $line${NC}"
        elif [[ $line == *"webhook-errors.log"* ]]; then
            echo -e "${RED}❌ $line${NC}"
        else
            echo "$line"
        fi
    done
}

# Função para mostrar estatísticas dos webhooks
show_webhook_stats() {
    echo -e "\n${CYAN}📊 ESTATÍSTICAS DOS WEBHOOKS:${NC}"
    echo "================================"
    
    if [ ! -f "$WEBHOOK_LOG" ]; then
        echo -e "${RED}❌ Arquivo de log não encontrado${NC}"
        return
    fi
    
    local total=$(wc -l < "$WEBHOOK_LOG" 2>/dev/null || echo "0")
    local errors=$(wc -l < "$ERROR_LOG" 2>/dev/null || echo "0")
    local success=$((total - errors))
    
    echo -e "📈 Total de logs: ${WHITE}$total${NC}"
    echo -e "✅ Sucessos: ${GREEN}$success${NC}"
    echo -e "❌ Erros: ${RED}$errors${NC}"
    
    # Mostrar últimos eventos
    echo -e "\n${PURPLE}📡 ÚLTIMOS EVENTOS:${NC}"
    tail -n 10 "$WEBHOOK_LOG" 2>/dev/null | while read line; do
        if [[ -n "$line" ]]; then
            echo "   $line"
        fi
    done
}

# Função para limpar logs
clear_logs() {
    echo -e "\n${YELLOW}🧹 LIMPANDO LOGS...${NC}"
    
    if [ -f "$WEBHOOK_LOG" ]; then
        > "$WEBHOOK_LOG"
        echo -e "✅ Logs gerais limpos"
    fi
    
    if [ -f "$ERROR_LOG" ]; then
        > "$ERROR_LOG"
        echo -e "✅ Logs de erro limpos"
    fi
    
    echo -e "${GREEN}🧹 Todos os logs foram limpos!${NC}"
}

# Função para reiniciar o processo
restart_process() {
    echo -e "\n${YELLOW}🔄 REINICIANDO PROCESSO...${NC}"
    pm2 restart backend
    echo -e "${GREEN}✅ Processo reiniciado!${NC}"
}

# Função para mostrar ajuda
show_help() {
    echo -e "\n${CYAN}🔧 COMANDOS DISPONÍVEIS:${NC}"
    echo "=========================="
    echo -e "${WHITE}status${NC}     - Mostrar status do PM2"
    echo -e "${WHITE}logs${NC}       - Mostrar últimas 50 linhas do PM2"
    echo -e "${WHITE}logs [N]${NC}   - Mostrar últimas N linhas do PM2"
    echo -e "${WHITE}monitor${NC}    - Monitorar logs do PM2 em tempo real"
    echo -e "${WHITE}files${NC}      - Monitorar arquivos de webhook em tempo real"
    echo -e "${WHITE}stats${NC}      - Mostrar estatísticas dos webhooks"
    echo -e "${WHITE}clear${NC}      - Limpar todos os logs"
    echo -e "${WHITE}restart${NC}    - Reiniciar processo backend"
    echo -e "${WHITE}help${NC}       - Mostrar esta ajuda"
    echo ""
    echo -e "Exemplo: ${YELLOW}./monitor-webhooks-pm2.sh monitor${NC}"
}

# Função principal
main() {
    local command=${1:-help}
    
    case $command in
        "status")
            show_pm2_status
            ;;
        "logs")
            local lines=${2:-50}
            show_pm2_logs $lines
            ;;
        "monitor")
            monitor_pm2_logs
            ;;
        "files")
            monitor_webhook_files
            ;;
        "stats")
            show_webhook_stats
            ;;
        "clear")
            clear_logs
            ;;
        "restart")
            restart_process
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Executar
main "$@"



