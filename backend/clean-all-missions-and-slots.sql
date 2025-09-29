-- Script para limpar todas as missões, reservas e slots do calendário
-- ⚠️ ATENÇÃO: Este script irá DELETAR TODOS os dados relacionados a missões e reservas
-- Execute apenas se tiver certeza de que quer limpar tudo!

-- 1. Limpar mensagens do chat (dependem de participation requests)
DELETE FROM "ChatMessage";

-- 2. Limpar pedidos de participação (dependem de shared missions)
DELETE FROM "ParticipationRequest";

-- 3. Limpar reservas de missões compartilhadas (dependem de shared missions)
DELETE FROM "SharedMissionBooking";

-- 4. Limpar missões compartilhadas
DELETE FROM "SharedMission";

-- 5. Limpar transações (dependem de bookings)
DELETE FROM "Transaction";

-- 6. Limpar slots de agenda da aeronave (dependem de bookings)
DELETE FROM "AircraftSchedule";

-- 7. Limpar reservas individuais
DELETE FROM "Booking";

-- 8. Resetar os contadores de auto-incremento (opcional, mas recomendado)
-- Isso garante que os próximos IDs comecem do 1 novamente

-- Para PostgreSQL:
ALTER SEQUENCE "ChatMessage_id_seq" RESTART WITH 1;
ALTER SEQUENCE "ParticipationRequest_id_seq" RESTART WITH 1;
ALTER SEQUENCE "SharedMissionBooking_id_seq" RESTART WITH 1;
ALTER SEQUENCE "SharedMission_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Transaction_id_seq" RESTART WITH 1;
ALTER SEQUENCE "AircraftSchedule_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Booking_id_seq" RESTART WITH 1;

-- 9. Verificar se tudo foi limpo
SELECT 
    'ChatMessage' as tabela, COUNT(*) as registros FROM "ChatMessage"
UNION ALL
SELECT 
    'ParticipationRequest' as tabela, COUNT(*) as registros FROM "ParticipationRequest"
UNION ALL
SELECT 
    'SharedMissionBooking' as tabela, COUNT(*) as registros FROM "SharedMissionBooking"
UNION ALL
SELECT 
    'SharedMission' as tabela, COUNT(*) as registros FROM "SharedMission"
UNION ALL
SELECT 
    'Transaction' as tabela, COUNT(*) as registros FROM "Transaction"
UNION ALL
SELECT 
    'AircraftSchedule' as tabela, COUNT(*) as registros FROM "AircraftSchedule"
UNION ALL
SELECT 
    'Booking' as tabela, COUNT(*) as registros FROM "Booking";

-- Mensagem de confirmação
SELECT '✅ Todas as missões, reservas e slots foram limpos com sucesso!' as resultado;









