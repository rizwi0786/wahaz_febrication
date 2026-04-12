const slugify = require('slugify');
const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { buildProductQuery } = require('../utils/apiFeatures');
const { fileToDataUrl } = require('../middleware/upload.middleware');

// Full include — use for detail / admin edit pages (all images + variants)
const productInclude = {
  images: { orderBy: { order: 'asc' } },
  variants: true,
  category: { select: { id: true, name: true, slug: true } },
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
  category: { select: { id: true, name: true, slug: true } },
};

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
    where: { isActive: true, category: { slug: categorySlug } },
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

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    include: productListInclude,
  });

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
    categoryId,
    tags,
    fabric,
    fit,
    occasion,
    careInstructions,
    isFeatured,
    isNewArrival,
    isActive,
    stock,
    variants,
  } = req.body;

  if (!name || !description || !price || !categoryId) {
    throw new ApiError(400, 'name, description, price, and categoryId are required');
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
      categoryId,
      tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((t) => t.trim()) : [],
      fabric,
      fit,
      occasion,
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
      data: rest,
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
//   - multipart/form-data with field name "images" (files), or
//   - JSON body: { images: ["data:image/...;base64,..."] }
const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Collect incoming image payloads from either upload path
  let dataUrls = [];
  if (req.files?.length) {
    dataUrls = req.files.map(fileToDataUrl).filter(Boolean);
  } else if (Array.isArray(req.body?.images)) {
    dataUrls = req.body.images.filter(
      (u) => typeof u === 'string' && u.startsWith('data:image/')
    );
  }

  if (dataUrls.length === 0) throw new ApiError(400, 'No images uploaded');

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await prisma.productImage.count({ where: { productId: id } });

  const created = await prisma.$transaction(
    dataUrls.map((url, idx) =>
      prisma.productImage.create({
        data: {
          productId: id,
          url,
          isPrimary: existing === 0 && idx === 0,
          order: existing + idx,
        },
      })
    )
  );

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
