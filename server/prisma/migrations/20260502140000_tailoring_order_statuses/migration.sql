-- Drop column default first so renaming the enum value referenced in it is safe.
ALTER TABLE "Order" ALTER COLUMN "orderStatus" DROP DEFAULT;

-- Rename existing enum values to bespoke names.
ALTER TYPE "OrderStatus" RENAME VALUE 'PROCESSING'  TO 'ORDER_RECEIVED';
ALTER TYPE "OrderStatus" RENAME VALUE 'CONFIRMED'   TO 'IN_TAILORING';

-- Add the two new tailoring-journey statuses.
ALTER TYPE "OrderStatus" ADD VALUE 'QUALITY_CHECK'  AFTER 'IN_TAILORING';
ALTER TYPE "OrderStatus" ADD VALUE 'READY_TO_SHIP'  AFTER 'QUALITY_CHECK';

-- Re-establish the default on the column.
ALTER TABLE "Order" ALTER COLUMN "orderStatus" SET DEFAULT 'ORDER_RECEIVED';
