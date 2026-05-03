-- CreateEnum
CREATE TYPE "CustomOrderStatus" AS ENUM ('PENDING_REVIEW', 'PRICE_QUOTED', 'COUNTER_OFFERED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PAID');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "CustomOrder" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designImages" TEXT[],
    "clothPhotos" TEXT[],
    "description" TEXT,
    "sizeDetails" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "CustomOrderStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "adminQuotedPrice" DECIMAL(10,2),
    "userCounterPrice" DECIMAL(10,2),
    "finalPrice" DECIMAL(10,2),
    "counterUsed" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "userNotes" TEXT,
    "rejectReason" TEXT,
    "shippingAddress" JSONB,
    "paymentMethod" "PaymentMethod",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "razorpayOrderId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationBooking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "topic" TEXT,
    "notes" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'PENDING',
    "meetLink" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomOrder_requestNumber_key" ON "CustomOrder"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CustomOrder_orderId_key" ON "CustomOrder"("orderId");

-- CreateIndex
CREATE INDEX "CustomOrder_userId_idx" ON "CustomOrder"("userId");

-- CreateIndex
CREATE INDEX "CustomOrder_status_idx" ON "CustomOrder"("status");

-- CreateIndex
CREATE INDEX "CustomOrder_createdAt_idx" ON "CustomOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationBooking_bookingNumber_key" ON "ConsultationBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "ConsultationBooking_userId_idx" ON "ConsultationBooking"("userId");

-- CreateIndex
CREATE INDEX "ConsultationBooking_status_idx" ON "ConsultationBooking"("status");

-- CreateIndex
CREATE INDEX "ConsultationBooking_preferredDate_idx" ON "ConsultationBooking"("preferredDate");

-- AddForeignKey
ALTER TABLE "CustomOrder" ADD CONSTRAINT "CustomOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
