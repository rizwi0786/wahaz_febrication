-- Payment hardening: idempotency fields on Order + PaymentEvent audit table.

ALTER TABLE "Order"
  ADD COLUMN "paymentAmount" INTEGER,
  ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_paymentId_key" ON "Order"("paymentId");
CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");

CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "status" TEXT,
    "signatureValid" BOOLEAN,
    "errorMessage" TEXT,
    "ipAddress" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentEvent_source_eventId_eventType_key"
  ON "PaymentEvent"("source", "eventId", "eventType");
CREATE INDEX "PaymentEvent_orderId_idx" ON "PaymentEvent"("orderId");
CREATE INDEX "PaymentEvent_razorpayPaymentId_idx" ON "PaymentEvent"("razorpayPaymentId");
CREATE INDEX "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");

ALTER TABLE "PaymentEvent"
  ADD CONSTRAINT "PaymentEvent_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
