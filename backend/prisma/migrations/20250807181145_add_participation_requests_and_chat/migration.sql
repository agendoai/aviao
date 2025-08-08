/*
  Warnings:

  - You are about to drop the column `route` on the `SharedMission` table. All the data in the column will be lost.
  - You are about to drop the column `seatsAvailable` on the `SharedMission` table. All the data in the column will be lost.
  - You are about to drop the `MembershipPayment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `Aircraft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registration` to the `Aircraft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departure_date` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `return_date` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aircraftId` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `availableSeats` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departure_date` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerSeat` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `return_date` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalSeats` to the `SharedMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SharedMission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MembershipPayment" DROP CONSTRAINT "MembershipPayment_userId_fkey";

-- AlterTable
ALTER TABLE "Aircraft" ADD COLUMN     "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 2800,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "overnightRate" DOUBLE PRECISION NOT NULL DEFAULT 1500,
ADD COLUMN     "registration" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "departure_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "destination" TEXT NOT NULL,
ADD COLUMN     "flight_hours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "origin" TEXT NOT NULL,
ADD COLUMN     "overnight_stays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passengers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "return_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SharedMission" DROP COLUMN "route",
DROP COLUMN "seatsAvailable",
ADD COLUMN     "aircraftId" INTEGER NOT NULL,
ADD COLUMN     "availableSeats" INTEGER NOT NULL,
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "departure_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "destination" TEXT NOT NULL,
ADD COLUMN     "origin" TEXT NOT NULL,
ADD COLUMN     "overnightFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overnightStays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pricePerSeat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "return_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "totalSeats" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "MembershipPayment";

-- CreateTable
CREATE TABLE "SharedMissionBooking" (
    "id" SERIAL NOT NULL,
    "sharedMissionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedMissionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationRequest" (
    "id" SERIAL NOT NULL,
    "sharedMissionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "participationRequestId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'message',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharedMission" ADD CONSTRAINT "SharedMission_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMission" ADD CONSTRAINT "SharedMission_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMissionBooking" ADD CONSTRAINT "SharedMissionBooking_sharedMissionId_fkey" FOREIGN KEY ("sharedMissionId") REFERENCES "SharedMission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMissionBooking" ADD CONSTRAINT "SharedMissionBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationRequest" ADD CONSTRAINT "ParticipationRequest_sharedMissionId_fkey" FOREIGN KEY ("sharedMissionId") REFERENCES "SharedMission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationRequest" ADD CONSTRAINT "ParticipationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_participationRequestId_fkey" FOREIGN KEY ("participationRequestId") REFERENCES "ParticipationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
