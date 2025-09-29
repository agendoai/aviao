-- AddMigration: Adicionar campos de horário de destino secundário para SharedMission
-- Matching the solo mission (Booking) schema for secondary destination times

-- AlterTable
ALTER TABLE "SharedMission" ADD COLUMN     "secondaryDestination" TEXT; -- Destino secundário (opcional) - igual ao Booking
ALTER TABLE "SharedMission" ADD COLUMN     "secondary_departure_time" TIMESTAMP(3); -- Horário de saída do destino secundário - igual ao Booking
