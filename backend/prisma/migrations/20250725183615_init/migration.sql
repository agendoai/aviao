/*
  Warnings:

  - The primary key for the `Booking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `aircraft_id` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `airport_fees` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `departure_date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `departure_time` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `destination` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `flight_hours` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `overnight_fee` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `overnight_stays` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `passengers` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `return_date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `return_time` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `stops` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Booking` table. All the data in the column will be lost.
  - The `id` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `aircraftId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_user_id_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_pkey",
DROP COLUMN "aircraft_id",
DROP COLUMN "airport_fees",
DROP COLUMN "created_at",
DROP COLUMN "departure_date",
DROP COLUMN "departure_time",
DROP COLUMN "destination",
DROP COLUMN "flight_hours",
DROP COLUMN "notes",
DROP COLUMN "origin",
DROP COLUMN "overnight_fee",
DROP COLUMN "overnight_stays",
DROP COLUMN "passengers",
DROP COLUMN "return_date",
DROP COLUMN "return_time",
DROP COLUMN "stops",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "aircraftId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pendente',
ADD CONSTRAINT "Booking_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Profile";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "asaasCustomerId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aircraft" (
    "id" SERIAL NOT NULL,
    "model" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedMission" (
    "id" SERIAL NOT NULL,
    "route" TEXT NOT NULL,
    "seatsAvailable" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airport" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "airportId" INTEGER NOT NULL,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Airport_code_key" ON "Airport"("code");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stop" ADD CONSTRAINT "Stop_airportId_fkey" FOREIGN KEY ("airportId") REFERENCES "Airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
