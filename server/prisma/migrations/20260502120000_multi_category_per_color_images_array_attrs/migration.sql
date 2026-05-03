-- 1. Create the implicit M:N join table for Product <-> Category
CREATE TABLE "_ProductCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_ProductCategories_AB_unique" ON "_ProductCategories"("A", "B");
CREATE INDEX "_ProductCategories_B_index" ON "_ProductCategories"("B");
ALTER TABLE "_ProductCategories"
    ADD CONSTRAINT "_ProductCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProductCategories"
    ADD CONSTRAINT "_ProductCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill from existing Product.categoryId
INSERT INTO "_ProductCategories" ("A", "B")
SELECT "categoryId", "id" FROM "Product" WHERE "categoryId" IS NOT NULL;

-- 3. Drop old single-category column / FK / index
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
DROP INDEX IF EXISTS "Product_categoryId_idx";
ALTER TABLE "Product" DROP COLUMN "categoryId";

-- 4. Convert fabric / fit / occasion to TEXT[] preserving any existing value
ALTER TABLE "Product"
    ALTER COLUMN "fabric" DROP DEFAULT,
    ALTER COLUMN "fabric" TYPE TEXT[] USING (
        CASE WHEN "fabric" IS NULL OR "fabric" = '' THEN ARRAY[]::TEXT[]
             ELSE ARRAY["fabric"] END
    ),
    ALTER COLUMN "fabric" SET NOT NULL,
    ALTER COLUMN "fabric" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Product"
    ALTER COLUMN "fit" DROP DEFAULT,
    ALTER COLUMN "fit" TYPE TEXT[] USING (
        CASE WHEN "fit" IS NULL OR "fit" = '' THEN ARRAY[]::TEXT[]
             ELSE ARRAY["fit"] END
    ),
    ALTER COLUMN "fit" SET NOT NULL,
    ALTER COLUMN "fit" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Product"
    ALTER COLUMN "occasion" DROP DEFAULT,
    ALTER COLUMN "occasion" TYPE TEXT[] USING (
        CASE WHEN "occasion" IS NULL OR "occasion" = '' THEN ARRAY[]::TEXT[]
             ELSE ARRAY["occasion"] END
    ),
    ALTER COLUMN "occasion" SET NOT NULL,
    ALTER COLUMN "occasion" SET DEFAULT ARRAY[]::TEXT[];

-- 5. Per-color image scoping
ALTER TABLE "ProductImage" ADD COLUMN "color" TEXT;
CREATE INDEX "ProductImage_productId_color_idx" ON "ProductImage"("productId", "color");
