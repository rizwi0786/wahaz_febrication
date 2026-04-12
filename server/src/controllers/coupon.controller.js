const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');

// POST /api/coupons/validate  body: { code, subtotal }
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) throw new ApiError(400, 'code is required');

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon || !coupon.isActive) throw new ApiError(404, 'Invalid coupon');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(400, 'Coupon expired');
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }
  if (coupon.minOrderAmount && Number(subtotal) < Number(coupon.minOrderAmount)) {
    throw new ApiError(400, `Minimum order for this coupon is Rs. ${coupon.minOrderAmount}`);
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = (Number(subtotal) * Number(coupon.discountValue)) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else {
    discount = Number(coupon.discountValue);
  }

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
    },
  });
});

// -------------------- ADMIN --------------------

const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, coupons });
});

const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    expiresAt,
  } = req.body;

  if (!code || !discountType || !discountValue) {
    throw new ApiError(400, 'code, discountType, and discountValue are required');
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  res.status(201).json({ success: true, coupon });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (data.code) data.code = data.code.toUpperCase();
  if (data.discountValue) data.discountValue = Number(data.discountValue);
  if (data.minOrderAmount) data.minOrderAmount = Number(data.minOrderAmount);
  if (data.maxDiscount) data.maxDiscount = Number(data.maxDiscount);
  if (data.usageLimit) data.usageLimit = Number(data.usageLimit);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);

  const coupon = await prisma.coupon.update({ where: { id }, data });
  res.json({ success: true, coupon });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Coupon deleted' });
});

module.exports = { validateCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon };
