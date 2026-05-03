const slugify = require('slugify');
const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { buildProductQuery } = require('../utils/apiFeatures');
const { fileToDataUrl } = require('../middleware/upload.middleware');

// Full include — use for detail / admin edit pages (all images + variants)
const productInclude = {
  images: { orderBy: { order: 'asc' } },
  variants: true,
  categories: { select: { id: true, name: true, slug: true } },
};

// Light include — use for listing endpoints. Returns only the primary
// image so response payloads don't balloon when every row carries a
// base64-encoded gallery.
const productListInclude = {
  images: {
    where: { isPrimary: true },
    take: 1,
  },
  variants: {
    select: { id: true, size: true, color: true, colorHex: true, stock: true },
  },
  categories: { select: { id: true, name: true, slug: true } },
};

function toStringArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

function toCategoryIds(body) {
  if (Array.isArray(body.categoryIds)) return body.categoryIds.filter(Boolean);
  if (typeof body.categoryIds === 'string' && body.categoryIds) {
    return body.categoryIds.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (body.categoryId) return [body.categoryId];
  return [];
}

// GET /api/products
const listProducts = asyncHandler(async (req, res) => {
  const { where, orderBy, skip, take, pageNum } = buildProductQuery(req.query);

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: productListInclude,
    }),
  ]);

  res.json({
    success: true,
    page: pageNum,
    limit: take,
    total,
    totalPages: Math.ceil(total / take),
    products,
  });
});

// GET /api/products/featured
const featured = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 8,
    include: productListInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, products });
});

// GET /api/products/new-arrivals
const newArrivals = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    take: 8,
    include: productListInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, products });
});

// GET /api/products/category/:categorySlug
const byCategory = asyncHandler(async (req, res) => {
  const { categorySlug } = req.params;
  const products = await prisma.product.findMany({
    where: { isActive: true, categories: { some: { slug: categorySlug } } },
    include: productListInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, products });
});

// GET /api/products/:slug — full detail, all images
const getProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      ...productInclude,
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  const categoryIds = product.categories.map((c) => c.id);
  const related = categoryIds.length
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          id: { not: product.id },
          categories: { some: { id: { in: categoryIds } } },
        },
        take: 4,
        include: productListInclude,
      })
    : [];

  res.json({ success: true, product, related });
});

// -------------------- ADMIN --------------------

// GET /api/admin/products/:id
const adminGetProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: productInclude,
  });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

// POST /api/admin/products
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    discountPrice,
    discountPercent,
    tags,
    careInstructions,
    isFeatured,
    isNewArrival,
    isActive,
    stock,
    variants,
  } = req.body;

  const categoryIds = toCategoryIds(req.body);
  if (!name || !description || !price || categoryIds.length === 0) {
    throw new ApiError(400, 'name, description, price, and at least one category are required');
  }

  const slug = slugify(`${name}-${Date.now()}`, { lower: true, strict: true });

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      discountPercent: discountPercent ? Number(discountPercent) : null,
      categories: { connect: categoryIds.map((cid) => ({ id: cid })) },
      tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((t) => t.trim()) : [],
      fabric: toStringArray(req.body.fabric),
      fit: toStringArray(req.body.fit),
      occasion: toStringArray(req.body.occasion),
      careInstructions,
      isFeatured: !!isFeatured,
      isNewArrival: !!isNewArrival,
      isActive: isActive !== false,
      stock: Number(stock || 0),
      variants: variants?.length
        ? {
            create: variants.map((v) => ({
              size: v.size,
              color: v.color,
              colorHex: v.colorHex,
              stock: Number(v.stock || 0),
              sku: v.sku,
            })),
          }
        : undefined,
    },
    include: productInclude,
  });

  res.status(201).json({ success: true, product });
});

// PUT /api/admin/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (data.tags && typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  if ('fabric' in data) data.fabric = toStringArray(data.fabric);
  if ('fit' in data) data.fit = toStringArray(data.fit);
  if ('occasion' in data) data.occasion = toStringArray(data.occasion);

  let categoriesUpdate;
  if ('categoryIds' in req.body || 'categoryId' in req.body) {
    const ids = toCategoryIds(req.body);
    if (ids.length === 0) throw new ApiError(400, 'At least one category is required');
    categoriesUpdate = { set: ids.map((cid) => ({ id: cid })) };
  }
  delete data.categoryIds;
  delete data.categoryId;
  delete data.categories;

  // Normalize numeric fields. HTML inputs always arrive as strings, and an
  // empty string should become `null` for the nullable columns (discountPrice,
  // discountPercent) rather than NaN.
  const toNullableNumber = (v) =>
    v === '' || v === null || v === undefined ? null : Number(v);

  if (data.price !== undefined && data.price !== '') data.price = Number(data.price);
  if ('discountPrice' in data) data.discountPrice = toNullableNumber(data.discountPrice);
  if ('discountPercent' in data) data.discountPercent = toNullableNumber(data.discountPercent);
  if (data.stock !== undefined && data.stock !== '') data.stock = Number(data.stock);

  // Strip fields that must not be updated through this generic path.
  delete data.id;
  delete data.slug;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.avgRating;
  delete data.totalReviews;
  delete data.images;
  delete data.category;

  // Handle variants replacement if provided
  const { variants, ...rest } = data;

  const product = await prisma.$transaction(async (tx) => {
    if (variants) {
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
      });

      const incomingIds = variants.filter((v) => v.id).map((v) => v.id);

      // 1. Delete only the variants that were removed by the admin.
      //    First clear cart items referencing those variants so the FK
      //    constraint is not violated — existing orders are unaffected
      //    because OrderItem stores size/color as plain values.
      const removedIds = existingVariants
        .filter((ev) => !incomingIds.includes(ev.id))
        .map((ev) => ev.id);

      if (removedIds.length) {
        await tx.cartItem.deleteMany({ where: { variantId: { in: removedIds } } });
        await tx.productVariant.deleteMany({ where: { id: { in: removedIds } } });
      }

      // 2. Update existing variants in place.
      for (const v of variants.filter((v) => v.id)) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: {
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            stock: Number(v.stock || 0),
            sku: v.sku,
          },
        });
      }

      // 3. Create newly added variants.
      const newVariants = variants.filter((v) => !v.id && v.size && v.color);
      if (newVariants.length) {
        await tx.productVariant.createMany({
          data: newVariants.map((v) => ({
            productId: id,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            stock: Number(v.stock || 0),
            sku: v.sku,
          })),
        });
      }
    }
    return tx.product.update({
      where: { id },
      data: { ...rest, ...(categoriesUpdate ? { categories: categoriesUpdate } : {}) },
      include: productInclude,
    });
  });

  res.json({ success: true, product });
});

// DELETE /api/admin/products/:id
// Soft-delete: mark inactive. Keeps the row so SKU sequences don't collide
// and so OrderItem references stay intact. Admins can re-activate via the
// edit form.
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, 'Product not found');
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  res.json({ success: true, message: 'Product deactivated' });
});

// GET /api/admin/products
// Like the public listing but returns inactive products too and skips the
// `isActive: true` floor that buildProductQuery applies.
const adminListProducts = asyncHandler(async (req, res) => {
  const { where, orderBy, skip, take, pageNum } = buildProductQuery(req.query);
  delete where.isActive;

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: productListInclude,
    }),
  ]);

  res.json({
    success: true,
    page: pageNum,
    limit: take,
    total,
    totalPages: Math.ceil(total / take),
    products,
  });
});

// POST /api/admin/products/:id/images
// Accepts either:
//   - multipart/form-data with field name "images" (files), or
//   - JSON body: { images: ["data:image/...;base64,..."] }
const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let items = [];
  if (req.files?.length) {
    const colors = [].concat(req.body?.color || []);
    const primaries = [].concat(req.body?.isPrimary || []);
    items = req.files
      .map((file, idx) => {
        const url = fileToDataUrl(file);
        if (!url) return null;
        return {
          url,
          color: colors[idx] || colors[0] || null,
          isPrimary: String(primaries[idx] || primaries[0] || '') === 'true',
        };
      })
      .filter(Boolean);
  } else if (Array.isArray(req.body?.images)) {
    items = req.body.images
      .map((entry) => {
        if (typeof entry === 'string' && entry.startsWith('data:image/')) {
          return { url: entry, color: null, isPrimary: false };
        }
        if (
          entry &&
          typeof entry === 'object' &&
          typeof entry.url === 'string' &&
          entry.url.startsWith('data:image/')
        ) {
          return { url: entry.url, color: entry.color || null, isPrimary: !!entry.isPrimary };
        }
        return null;
      })
      .filter(Boolean);
  }

  if (items.length === 0) throw new ApiError(400, 'No images uploaded');

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await prisma.productImage.count({ where: { productId: id } });
  const newPrimary = items.find((it) => it.isPrimary);
  const promoteFirst = !newPrimary && existing === 0;

  const created = await prisma.$transaction(async (tx) => {
    if (newPrimary) {
      await tx.productImage.updateMany({
        where: { productId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    const rows = [];
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      rows.push(
        await tx.productImage.create({
          data: {
            productId: id,
            url: item.url,
            color: item.color || null,
            isPrimary: item.isPrimary || (promoteFirst && idx === 0),
            order: existing + idx,
          },
        })
      );
    }
    return rows;
  });

  res.json({ success: true, images: created });
});

// DELETE /api/admin/products/:id/images/:imageId
const deleteImage = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) throw new ApiError(404, 'Image not found');

  await prisma.productImage.delete({ where: { id: imageId } });

  // If we just deleted the primary, promote another image (if any) to primary.
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { order: 'asc' },
    });
    if (next) {
      await prisma.productImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  res.json({ success: true, message: 'Image deleted' });
});

module.exports = {
  listProducts,
  featured,
  newArrivals,
  byCategory,
  getProduct,
  adminGetProduct,
  adminListProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  deleteImage,
};
