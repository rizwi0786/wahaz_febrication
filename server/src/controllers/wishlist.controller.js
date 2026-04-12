const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: {
          images: { orderBy: { order: 'asc' } },
          category: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, wishlist });
});

// POST /api/wishlist/:productId
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, 'Product not found');

  try {
    const item = await prisma.wishlist.create({
      data: { userId: req.user.id, productId },
    });
    res.status(201).json({ success: true, item });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.json({ success: true, message: 'Already in wishlist' });
    }
    throw err;
  }
});

// DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  await prisma.wishlist.deleteMany({
    where: { userId: req.user.id, productId },
  });
  res.json({ success: true, message: 'Removed from wishlist' });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
