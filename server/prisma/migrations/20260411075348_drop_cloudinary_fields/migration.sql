/*
  Warnings:

  - You are about to drop the column `imagePublicId` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `imagePublicId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `ProductImage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "imagePublicId";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "imagePublicId";

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "publicId";
