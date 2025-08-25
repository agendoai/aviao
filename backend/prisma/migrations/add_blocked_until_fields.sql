-- Adicionar campos blocked_until e maintenance_buffer_hours à tabela bookings
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "blocked_until" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "maintenance_buffer_hours" INTEGER NOT NULL DEFAULT 3;
