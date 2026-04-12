const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');

async function recalcProductRating(productId) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating || 0,
      totalReviews: agg._count,
    },
  });
}

// GET /api/products/:id/reviews
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.id, isApproved: true },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, reviews });
});

// POST /api/reviews
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment, images } = req.body;
  if (!productId || !rating || !comment) {
    throw new ApiError(400, 'productId, rating, and comment are required');
  }
  if (rating < 1 || rating > 5) throw new ApiError(400, 'rating must be between 1 and 5');

  // Only allow reviews from users who have ordered this product
  const hasOrdered = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId: req.user.id,
        orderStatus: { in: ['DELIVERED'] },
      },
    },
  });
  if (!hasOrdered) {
    throw new ApiError(403, 'You can only review products you have purchased');
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        rating: Number(rating),
        title,
        comment,
        images: Array.isArray(images) ? images : [],
      },
    });
    res.status(201).json({ success: true, review, message: 'Review submitted; awaiting approval.' });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new ApiError(409, 'You have already reviewed this product');
    }
    throw err;
  }
});

// PUT /api/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || review.userId !== req.user.id) {
    throw new ApiError(404, 'Review not found');
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      rating: req.body.rating ? Number(req.body.rating) : review.rating,
      title: req.body.title ?? review.title,
      comment: req.body.comment ?? review.comment,
      images: req.body.images ?? review.images,
      isApproved: false,
    },
  });
  await recalcProductRating(updated.productId);
  res.json({ success: true, review: updated });
});

// DELETE /api/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Forbidden');
  }
  await prisma.review.delete({ where: { id } });
  await recalcProductRating(review.productId);
  res.json({ success: true, message: 'Review deleted' });
});

// PUT /api/admin/reviews/:id/approve
const approveReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await prisma.review.update({
    where: { id },
    data: { isApproved: true },
  });
  await recalcProductRating(review.productId);
  res.json({ success: true, review });
});

// GET /api/admin/reviews
const listAllReviews = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status === 'pending') where.isApproved = false;
  if (status === 'approved') where.isApproved = true;

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, reviews });
});

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  approveReview,
  listAllReviews,
};
