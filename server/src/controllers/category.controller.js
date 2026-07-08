const slugify = require('slugify');
const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { fileToDataUrl } = require('../middleware/upload.middleware');
const { mapCategory } = require('../utils/imageUrls');

// `image` is deliberately absent — the base64 blob stays in Postgres and the
// response links to /api/images/category/<id> instead. `image` being nullable,
// callers pair this with a cheap ids-only existence query so the frontend
// still gets `image: null` (and shows its placeholder) where none was set.
const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

// GET /api/categories
const listCategories = asyncHandler(async (req, res) => {
  const [categories, withImage] = await prisma.$transaction([
    prisma.category.findMany({
      where: { isActive: true },
      // Only count active products so the sidebar badge matches what the Shop
      // listing actually shows (which filters on isActive: true). Inactive /
      // soft-deleted products must not inflate the badge.
      select: {
        ...categorySelect,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { isActive: true, image: { not: null } },
      select: { id: true },
    }),
  ]);

  const hasImage = new Set(withImage.map((c) => c.id));
  res.json({
    success: true,
    categories: categories.map((c) => mapCategory(c, hasImage.has(c.id))),
  });
});

// GET /api/categories/:slug
const getCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    select: {
      ...categorySelect,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  if (!category) throw new ApiError(404, 'Category not found');

  const withImage = await prisma.category.count({
    where: { id: category.id, image: { not: null } },
  });
  res.json({ success: true, category: mapCategory(category, withImage > 0) });
});

// Accept either an uploaded file or an inline base64 data URL in the body.
function resolveImage(req) {
  if (req.file) return fileToDataUrl(req.file);
  if (typeof req.body?.image === 'string' && req.body.image.startsWith('data:image/')) {
    return req.body.image;
  }
  return null;
}

// POST /api/admin/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new ApiError(400, 'name is required');

  const slug = slugify(name, { lower: true, strict: true });
  const image = resolveImage(req);

  const category = await prisma.category.create({
    data: { name, slug, description, image },
  });

  res.status(201).json({ success: true, category: mapCategory(category, !!category.image) });
});

// PUT /api/admin/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Category not found');

  const data = {};
  if (name) {
    data.name = name;
    data.slug = slugify(name, { lower: true, strict: true });
  }
  if (description !== undefined) data.description = description;
  if (isActive !== undefined) data.isActive = isActive === true || isActive === 'true';

  const image = resolveImage(req);
  if (image) data.image = image;

  const category = await prisma.category.update({ where: { id }, data });
  res.json({ success: true, category: mapCategory(category, !!category.image) });
});

// DELETE /api/admin/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Category not found');

  const productCount = await prisma.product.count({
    where: { categories: { some: { id } } },
  });
  if (productCount > 0) {
    throw new ApiError(400, `Cannot delete: ${productCount} products use this category`);
  }

  await prisma.category.delete({ where: { id } });
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
