const crypto = require('crypto');
const prisma = require('../config/db');
const razorpay = require('../config/razorpay');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { sendEmail } = require('../utils/sendEmail');

const SHIPPING_FREE_ABOVE = 999;
const SHIPPING_CHARGE = 99;
const TAX_RATE = 0.18;

function generateRequestNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BC-CUSTOM-${ts}-${rand}`;
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BC-${ts}-${rand}`;
}

// OrderItem.productId is a required FK on Product, but custom designs aren't
// real catalog products. We lazily create (and reuse) a single hidden sentinel
// Product so custom orders can be tracked through the existing Order pipeline
// without schema changes. The product is hidden from the storefront via
// isActive=false and a dedicated category.
async function getCustomDesignProductId() {
  const slug = '__custom-design__';
  let product = await prisma.product.findUnique({ where: { slug } });
  if (product) return product.id;

  const categorySlug = '__custom-design__';
  let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Custom Design',
        slug: categorySlug,
        description: 'Internal category for custom design orders',
        isActive: false,
      },
    });
  }

  product = await prisma.product.create({
    data: {
      name: 'Custom Design',
      slug,
      description: 'Internal placeholder for custom design orders',
      price: 0,
      categories: { connect: [{ id: category.id }] },
      isActive: false,
      stock: 0,
    },
  });
  return product.id;
}

function computeTotals(unitPrice, quantity) {
  const subtotal = Number(unitPrice) * quantity;
  const shippingCharge = subtotal >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_CHARGE;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + shippingCharge + tax).toFixed(2));
  return { subtotal, shippingCharge, tax, total };
}

// POST /api/custom-orders
const createCustomOrder = asyncHandler(async (req, res) => {
  const { designImages, clothPhotos, sizeDetails, description, quantity, userNotes } = req.body;

  if (!Array.isArray(designImages) || designImages.length === 0) {
    throw new ApiError(400, 'At least one design image is required');
  }
  if (!sizeDetails || typeof sizeDetails !== 'object') {
    throw new ApiError(400, 'sizeDetails is required');
  }

  const created = await prisma.customOrder.create({
    data: {
      requestNumber: generateRequestNumber(),
      userId: req.user.id,
      designImages,
      clothPhotos: Array.isArray(clothPhotos) ? clothPhotos : [],
      description: description || null,
      sizeDetails,
      quantity: Number(quantity) > 0 ? Number(quantity) : 1,
      userNotes: userNotes || null,
      status: 'PENDING_REVIEW',
    },
  });

  res.status(201).json({ success: true, customOrder: created });
});

// GET /api/custom-orders
const getMyCustomOrders = asyncHandler(async (req, res) => {
  const customOrders = await prisma.customOrder.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, customOrders });
});

// GET /api/custom-orders/:id
const getCustomOrder = asyncHandler(async (req, res) => {
  const customOrder = await prisma.customOrder.findUnique({
    where: { id: req.params.id },
  });
  if (!customOrder || customOrder.userId !== req.user.id) {
    throw new ApiError(404, 'Custom order not found');
  }
  res.json({ success: true, customOrder });
});

// POST /api/custom-orders/:id/counter-offer (one-time only)
const counterOffer = asyncHandler(async (req, res) => {
  const { counterPrice, message } = req.body;
  const price = Number(counterPrice);
  if (!price || price <= 0) throw new ApiError(400, 'counterPrice must be a positive number');

  const co = await prisma.customOrder.findUnique({ where: { id: req.params.id } });
  if (!co || co.userId !== req.user.id) throw new ApiError(404, 'Custom order not found');
  if (co.status !== 'PRICE_QUOTED') {
    throw new ApiError(400, 'A counter offer can only be made after admin has quoted a price');
  }
  if (co.counterUsed) {
    throw new ApiError(400, 'You have already used your one counter offer for this request');
  }

  const updated = await prisma.customOrder.update({
    where: { id: co.id },
    data: {
      status: 'COUNTER_OFFERED',
      userCounterPrice: price,
      counterUsed: true,
      userNotes: message ? message : co.userNotes,
    },
  });
  res.json({ success: true, customOrder: updated });
});

// POST /api/custom-orders/:id/accept
// User accepts the current admin quote — sets finalPrice and moves to APPROVED
// (skips the counter step). Order is then placed via /place-order.
const acceptQuote = asyncHandler(async (req, res) => {
  const co = await prisma.customOrder.findUnique({ where: { id: req.params.id } });
  if (!co || co.userId !== req.user.id) throw new ApiError(404, 'Custom order not found');
  if (co.status !== 'PRICE_QUOTED') {
    throw new ApiError(400, 'No admin quote to accept');
  }
  const updated = await prisma.customOrder.update({
    where: { id: co.id },
    data: { status: 'APPROVED', finalPrice: co.adminQuotedPrice },
  });
  res.json({ success: true, customOrder: updated });
});

// POST /api/custom-orders/:id/cancel (user)
const cancelCustomOrder = asyncHandler(async (req, res) => {
  const co = await prisma.customOrder.findUnique({ where: { id: req.params.id } });
  if (!co || co.userId !== req.user.id) throw new ApiError(404, 'Custom order not found');
  if (['PAID', 'CANCELLED', 'REJECTED'].includes(co.status)) {
    throw new ApiError(400, `Cannot cancel a ${co.status} request`);
  }
  const updated = await prisma.customOrder.update({
    where: { id: co.id },
    data: { status: 'CANCELLED' },
  });
  res.json({ success: true, customOrder: updated });
});

// POST /api/custom-orders/:id/place-order
// After APPROVED, user provides shipping address + payment method to convert
// the request into a real Order. Mirrors order.controller.placeOrder logic.
const placeCustomOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  if (!shippingAddress) throw new ApiError(400, 'shippingAddress is required');
  if (!paymentMethod || !['RAZORPAY', 'COD'].includes(paymentMethod)) {
    throw new ApiError(400, 'paymentMethod must be RAZORPAY or COD');
  }

  const co = await prisma.customOrder.findUnique({ where: { id: req.params.id } });
  if (!co || co.userId !== req.user.id) throw new ApiError(404, 'Custom order not found');
  if (co.status !== 'APPROVED') throw new ApiError(400, 'Custom order is not approved yet');
  if (co.orderId) throw new ApiError(400, 'An order has already been placed for this request');

  const unitPrice = Number(co.finalPrice);
  const { subtotal, shippingCharge, tax, total } = computeTotals(unitPrice, co.quantity);
  const orderNumber = generateOrderNumber();
  const productImage = co.designImages?.[0] || '';
  const sentinelProductId = await getCustomDesignProductId();

  let razorpayOrder = null;
  if (paymentMethod === 'RAZORPAY') {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: orderNumber,
      notes: { userId: req.user.id, customOrderId: co.id },
    });
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        shippingAddress,
        paymentMethod,
        paymentStatus: 'PENDING',
        razorpayOrderId: razorpayOrder?.id,
        orderStatus: paymentMethod === 'COD' ? 'CONFIRMED' : 'PROCESSING',
        subtotal,
        discount: 0,
        shippingCharge,
        tax,
        total,
        notes: `Custom order ${co.requestNumber}`,
        items: {
          create: [
            {
              productId: sentinelProductId,
              productName: `Custom design (${co.requestNumber})`,
              productImage,
              size: 'CUSTOM',
              color: '-',
              quantity: co.quantity,
              price: unitPrice,
              total: subtotal,
            },
          ],
        },
        tracking: {
          create: { status: 'PROCESSING', message: 'Custom order received' },
        },
      },
      include: { items: true },
    });

    await tx.customOrder.update({
      where: { id: co.id },
      data: {
        orderId: created.id,
        status: paymentMethod === 'COD' ? 'PAID' : 'APPROVED',
        paymentMethod,
        razorpayOrderId: razorpayOrder?.id,
        shippingAddress,
      },
    });

    return created;
  });

  res.status(201).json({
    success: true,
    order,
    razorpay: razorpayOrder
      ? {
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        }
      : null,
  });
});

// -------------------- ADMIN --------------------

// GET /api/admin/custom-orders
const adminListCustomOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { requestNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [total, customOrders] = await prisma.$transaction([
    prisma.customOrder.count({ where }),
    prisma.customOrder.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    customOrders,
  });
});

// GET /api/admin/custom-orders/:id
const adminGetCustomOrder = asyncHandler(async (req, res) => {
  const customOrder = await prisma.customOrder.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!customOrder) throw new ApiError(404, 'Custom order not found');
  res.json({ success: true, customOrder });
});

// PUT /api/admin/custom-orders/:id/quote
const adminQuotePrice = asyncHandler(async (req, res) => {
  const { quotedPrice, adminNotes } = req.body;
  const price = Number(quotedPrice);
  if (!price || price <= 0) throw new ApiError(400, 'quotedPrice must be positive');

  const co = await prisma.customOrder.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });
  if (!co) throw new ApiError(404, 'Custom order not found');
  if (!['PENDING_REVIEW', 'PRICE_QUOTED'].includes(co.status)) {
    throw new ApiError(400, `Cannot quote on a ${co.status} request`);
  }

  const updated = await prisma.customOrder.update({
    where: { id: co.id },
    data: {
      status: 'PRICE_QUOTED',
      adminQuotedPrice: price,
      adminNotes: adminNotes || co.adminNotes,
    },
  });

  sendEmail({
    to: co.user.email,
    subject: `Your custom design quote — ${co.requestNumber}`,
    html: `
      <div style="font-family:Montserrat,Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Your custom design quote is ready</h2>
        <p>Request <strong>${co.requestNumber}</strong></p>
        <p>Our quoted unit price: <strong>Rs. ${price}</strong></p>
        ${adminNotes ? `<p>${adminNotes}</p>` : ''}
        <p>You can <strong>accept this quote</strong> or make a <strong>one-time counter offer</strong>.</p>
      </div>
    `,
  }).catch((e) => console.error('[email]', e));

  res.json({ success: true, customOrder: updated });
});

// PUT /api/admin/custom-orders/:id/respond-counter
// Admin's reply to a user's counter offer: accept (final) or reject.
const adminRespondCounter = asyncHandler(async (req, res) => {
  const { decision, finalPrice, rejectReason, adminNotes } = req.body;
  if (!['ACCEPT', 'REJECT'].includes(decision)) {
    throw new ApiError(400, 'decision must be ACCEPT or REJECT');
  }

  const co = await prisma.customOrder.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });
  if (!co) throw new ApiError(404, 'Custom order not found');
  if (co.status !== 'COUNTER_OFFERED') {
    throw new ApiError(400, 'No counter offer pending');
  }

  let updated;
  if (decision === 'ACCEPT') {
    const accepted = finalPrice ? Number(finalPrice) : Number(co.userCounterPrice);
    updated = await prisma.customOrder.update({
      where: { id: co.id },
      data: {
        status: 'APPROVED',
        finalPrice: accepted,
        adminNotes: adminNotes || co.adminNotes,
      },
    });
    sendEmail({
      to: co.user.email,
      subject: `Custom order approved — ${co.requestNumber}`,
      html: `
        <div style="font-family:Montserrat,Arial,sans-serif;max-width:600px;margin:auto">
          <h2>Your custom order has been approved</h2>
          <p>Request <strong>${co.requestNumber}</strong></p>
          <p>Final unit price: <strong>Rs. ${accepted}</strong></p>
          <p>You can now proceed to checkout to place the order.</p>
        </div>
      `,
    }).catch((e) => console.error('[email]', e));
  } else {
    updated = await prisma.customOrder.update({
      where: { id: co.id },
      data: {
        status: 'REJECTED',
        rejectReason: rejectReason || 'Counter offer rejected',
        adminNotes: adminNotes || co.adminNotes,
      },
    });
    sendEmail({
      to: co.user.email,
      subject: `Custom order update — ${co.requestNumber}`,
      html: `
        <div style="font-family:Montserrat,Arial,sans-serif;max-width:600px;margin:auto">
          <h2>Your counter offer was not accepted</h2>
          <p>Request <strong>${co.requestNumber}</strong></p>
          ${rejectReason ? `<p>${rejectReason}</p>` : ''}
        </div>
      `,
    }).catch((e) => console.error('[email]', e));
  }

  res.json({ success: true, customOrder: updated });
});

// PUT /api/admin/custom-orders/:id/reject
const adminReject = asyncHandler(async (req, res) => {
  const { rejectReason } = req.body;
  const co = await prisma.customOrder.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });
  if (!co) throw new ApiError(404, 'Custom order not found');
  if (['PAID', 'CANCELLED', 'REJECTED'].includes(co.status)) {
    throw new ApiError(400, `Cannot reject a ${co.status} request`);
  }
  const updated = await prisma.customOrder.update({
    where: { id: co.id },
    data: { status: 'REJECTED', rejectReason: rejectReason || null },
  });
  res.json({ success: true, customOrder: updated });
});

module.exports = {
  createCustomOrder,
  getMyCustomOrders,
  getCustomOrder,
  counterOffer,
  acceptQuote,
  cancelCustomOrder,
  placeCustomOrder,
  adminListCustomOrders,
  adminGetCustomOrder,
  adminQuotePrice,
  adminRespondCounter,
  adminReject,
};
