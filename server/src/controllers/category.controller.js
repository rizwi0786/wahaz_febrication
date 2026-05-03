const slugify = require('slugify');
const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { fileToDataUrl } = require('../middleware/upload.middleware');

// GET /api/categories
const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, categories });
});

// GET /api/categories/:slug
const getCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, category });
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

  res.status(201).json({ success: true, category });
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
  res.json({ success: true, category });
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
