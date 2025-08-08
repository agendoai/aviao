-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "membership_tier" TEXT NOT NULL DEFAULT 'basic',
    "monthly_fee_status" TEXT NOT NULL DEFAULT 'paid',
    "priority_position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "aircraft_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "departure_date" TIMESTAMP(3) NOT NULL,
    "departure_time" TEXT NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL,
    "return_time" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "passengers" INTEGER NOT NULL,
    "flight_hours" DOUBLE PRECISION NOT NULL,
    "airport_fees" DOUBLE PRECISION NOT NULL,
    "overnight_stays" INTEGER NOT NULL DEFAULT 0,
    "overnight_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stops" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
