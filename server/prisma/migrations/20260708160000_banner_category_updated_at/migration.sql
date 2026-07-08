-- Banner and Category images are edited in place, so their /api/images/...
-- URLs carry ?v=<updatedAt epoch> for cache busting. Add the columns that
-- back that version stamp.
ALTER TABLE "Banner" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Category" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
