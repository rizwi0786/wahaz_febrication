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

// Multi-attribute fields — accept either an array, a comma-separated string,
// or a single string. Always returns an array of trimmed non-empty values.
function toStringArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

// Resolve the list of category ids from the request body. Accepts the new
// `categoryIds` array as well as the legacy `categoryId` single string.
function toCategoryIds(body) {
  if (Array.isArray(body.categoryIds)) {
    return body.categoryIds.filter(Boolean);
  }
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
    throw new ApiError(
      400,
      'name, description, price, and at least one category are required'
    );
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
      categories: { connect: categoryIds.map((id) => ({ id })) },
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

  // Multi-value attributes — coerce to arrays only if present in the payload,
  // so a partial update doesn't accidentally wipe them.
  if ('fabric' in data) data.fabric = toStringArray(data.fabric);
  if ('fit' in data) data.fit = toStringArray(data.fit);
  if ('occasion' in data) data.occasion = toStringArray(data.occasion);

  // Normalize numeric fields. HTML inputs always arrive as strings, and an
  // empty string should become `null` for the nullable columns (discountPrice,
  // discountPercent) rather than NaN.
  const toNullableNumber = (v) =>
    v === '' || v === null || v === undefined ? null : Number(v);

  if (data.price !== undefined && data.price !== '') data.price = Number(data.price);
  if ('discountPrice' in data) data.discountPrice = toNullableNumber(data.discountPrice);
  if ('discountPercent' in data) data.discountPercent = toNullableNumber(data.discountPercent);
  if (data.stock !== undefined && data.stock !== '') data.stock = Number(data.stock);

  // Categories — `set` replaces the full join list. Only apply when the
  // caller explicitly sends category info, so partial updates don't clear it.
  let categoriesUpdate;
  if ('categoryIds' in req.body || 'categoryId' in req.body) {
    const ids = toCategoryIds(req.body);
    if (ids.length === 0) {
      throw new ApiError(400, 'At least one category is required');
    }
    categoriesUpdate = { set: ids.map((cid) => ({ id: cid })) };
  }
  delete data.categoryIds;
  delete data.categoryId;

  // Strip fields that must not be updated through this generic path.
  delete data.id;
  delete data.slug;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.avgRating;
  delete data.totalReviews;
  delete data.images;
  delete data.categories;
  delete data.category;

  // Handle variants replacement if provided
  const { variants, ...rest } = data;

  const product = await prisma.$transaction(async (tx) => {
    if (variants) {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productVariant.createMany({
        data: variants.map((v) => ({
          productId: id,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          stock: Number(v.stock || 0),
          sku: v.sku,
        })),
      });
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
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Images cascade-delete because ProductImage has onDelete: Cascade
  await prisma.product.delete({ where: { id } });
  res.json({ success: true, message: 'Product deleted' });
});

// POST /api/admin/products/:id/images
// Accepts either:
//   - multipart/form-data with field name "images" (files) plus optional
//     "color" and "isPrimary" fields, or
//   - JSON body: { images: [{ url, color?, isPrimary? }] | ["data:image/..."] }
const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Normalise both upload paths into a list of { url, color, isPrimary } items.
  let items = [];
  if (req.files?.length) {
    // For multipart uploads `color` and `isPrimary` may be a single value
    // (one file) or an array (one entry per file, same order).
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
        if (entry && typeof entry === 'object' && typeof entry.url === 'string' &&
            entry.url.startsWith('data:image/')) {
          return {
            url: entry.url,
            color: entry.color || null,
            isPrimary: !!entry.isPrimary,
          };
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
  // Only one primary per product. If the caller marked one as primary, demote
  // any current primary first.
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
      const row = await tx.productImage.create({
        data: {
          productId: id,
          url: item.url,
          color: item.color || null,
          isPrimary: item.isPrimary || (promoteFirst && idx === 0),
          order: existing + idx,
        },
      });
      rows.push(row);
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
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  deleteImage,
};
