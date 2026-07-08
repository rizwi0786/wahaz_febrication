const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');

const ONE_YEAR = 31536000;

// Decode a stored image (base64 data URL, or a remote URL from seed data)
// and send it as a real image response. Callers guarantee cache-safety:
// ProductImage rows are immutable, banner/category/review URLs carry a
// ?v=<updatedAt> version — so `immutable` for a year is always correct.
function sendStoredImage(res, stored) {
  if (!stored) throw new ApiError(404, 'Image not found');

  if (/^https?:\/\//i.test(stored)) {
    res.set('Cache-Control', 'public, max-age=86400');
    return res.redirect(302, stored);
  }

  const match = /^data:([\w/+.-]+);base64,(.*)$/s.exec(stored);
  if (!match) throw new ApiError(404, 'Image not found');

  const buffer = Buffer.from(match[2], 'base64');
  res.set({
    'Content-Type': match[1],
    'Content-Length': buffer.length,
    'Cache-Control': `public, max-age=${ONE_YEAR}, immutable`,
    // Helmet defaults to same-origin CORP; images must stay embeddable even
    // if the page is momentarily served from the www host.
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  return res.send(buffer);
}

// GET /api/images/product/:imageId
const productImage = asyncHandler(async (req, res) => {
  const image = await prisma.productImage.findUnique({
    where: { id: req.params.imageId },
    select: { url: true },
  });
  return sendStoredImage(res, image?.url);
});

// GET /api/images/banner/:id
const bannerImage = asyncHandler(async (req, res) => {
  const banner = await prisma.banner.findUnique({
    where: { id: req.params.id },
    select: { image: true },
  });
  return sendStoredImage(res, banner?.image);
});

// GET /api/images/category/:id
const categoryImage = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    select: { image: true },
  });
  return sendStoredImage(res, category?.image);
});

// GET /api/images/review/:id/:index
const reviewImage = asyncHandler(async (req, res) => {
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || index < 0) throw new ApiError(404, 'Image not found');

  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
    select: { images: true },
  });
  return sendStoredImage(res, review?.images?.[index]);
});

module.exports = { productImage, bannerImage, categoryImage, reviewImage };
