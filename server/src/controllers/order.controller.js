const crypto = require("crypto");
const prisma = require("../config/db");
const razorpay = require("../config/razorpay");
const { ApiError, asyncHandler } = require("../utils/errorHandler");
const { sendEmail, emailTemplates } = require("../utils/sendEmail");

const SHIPPING_FREE_ABOVE = 999;
const SHIPPING_CHARGE = 99;
const TAX_RATE = 0.18;

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WF-${ts}-${rand}`;
}

async function calculateTotals(cartItems, couponCode) {
  let subtotal = 0;
  const lineItems = [];

  for (const item of cartItems) {
    const price = Number(item.product.discountPrice || item.product.price);
    const total = price * item.quantity;
    subtotal += total;

    if (item.variant.stock < item.quantity) {
      throw new ApiError(
        400,
        `${item.product.name} (${item.variant.size}/${item.variant.color}) out of stock`,
      );
    }

    lineItems.push({
      productId: item.productId,
      productName: item.product.name,
      productImage: item.product.images?.[0]?.url || "",
      size: item.variant.size,
      color: item.variant.color,
      variantId: item.variantId,
      quantity: item.quantity,
      price,
      total,
    });
  }

  // Coupon
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });
    if (!coupon || !coupon.isActive) throw new ApiError(400, "Invalid coupon");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new ApiError(400, "Coupon expired");
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, "Coupon usage limit reached");
    }
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw new ApiError(
        400,
        `Minimum order for this coupon is Rs. ${coupon.minOrderAmount}`,
      );
    }

    if (coupon.discountType === "PERCENTAGE") {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount)
        discount = Math.min(discount, Number(coupon.maxDiscount));
    } else {
      discount = Number(coupon.discountValue);
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shippingCharge =
    discountedSubtotal >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_CHARGE;
  const tax = Number((discountedSubtotal * TAX_RATE).toFixed(2));
  const total = Number((discountedSubtotal + shippingCharge + tax).toFixed(2));

  return { subtotal, discount, shippingCharge, tax, total, lineItems, coupon };
}

// POST /api/orders
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode, notes } = req.body;
  if (!shippingAddress) throw new ApiError(400, "shippingAddress is required");
  if (!paymentMethod || !["RAZORPAY", "COD"].includes(paymentMethod)) {
    throw new ApiError(400, "paymentMethod must be RAZORPAY or COD");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
          variant: true,
        },
      },
    },
  });
  if (!cart || cart.items.length === 0)
    throw new ApiError(400, "Cart is empty");

  const { subtotal, discount, shippingCharge, tax, total, lineItems, coupon } =
    await calculateTotals(cart.items, couponCode);

  const orderNumber = generateOrderNumber();

  let razorpayOrder = null;
  if (paymentMethod === "RAZORPAY") {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // paise
      currency: "INR",
      receipt: orderNumber,
      notes: { userId: req.user.id },
    });
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        shippingAddress,
        paymentMethod,
        paymentStatus: "PENDING",
        razorpayOrderId: razorpayOrder?.id,
        orderStatus: "PROCESSING",
        subtotal,
        discount,
        shippingCharge,
        tax,
        total,
        couponCode: coupon?.code,
        notes,
        items: { create: lineItems },
        tracking: {
          create: {
            status: "PROCESSING",
            message: "Order received",
          },
        },
      },
      include: { items: true },
    });

    // For COD, decrement stock immediately. For Razorpay, stock is decremented after payment verification.
    if (paymentMethod === "COD") {
      for (const item of lineItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.order.update({
        where: { id: created.id },
        data: { orderStatus: "CONFIRMED" },
      });
    }

    return created;
  });

  // Confirmation email for COD (Razorpay sends after verification)
  if (paymentMethod === "COD") {
    const tpl = emailTemplates.orderConfirmation(order);
    sendEmail({ to: req.user.email, ...tpl }).catch((e) =>
      console.error("[email]", e),
    );
  }

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

// POST /api/orders/verify-payment
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
    req.body;
  if (
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature ||
    !orderId
  ) {
    throw new ApiError(400, "Missing payment verification fields");
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED" },
    });
    throw new ApiError(400, "Invalid payment signature");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.userId !== req.user.id) throw new ApiError(403, "Forbidden");

  const updated = await prisma.$transaction(async (tx) => {
    // Deduct variant stock
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }
    // Clear user's cart
    const cart = await tx.cart.findUnique({ where: { userId: req.user.id } });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    // Bump coupon usage
    if (order.couponCode) {
      await tx.coupon.update({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        paymentId: razorpayPaymentId,
        orderStatus: "CONFIRMED",
        tracking: {
          create: { status: "CONFIRMED", message: "Payment received" },
        },
      },
      include: { items: true },
    });
  });

  const tpl = emailTemplates.orderConfirmation(updated);
  sendEmail({ to: order.user.email, ...tpl }).catch((e) =>
    console.error("[email]", e),
  );

  res.json({ success: true, order: updated });
});

// GET /api/orders
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: true, tracking: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, orders });
});

// GET /api/orders/:id
// Strictly owner-only. Admins must use GET /api/admin/orders/:id instead,
// which is served by orderCtrl.adminGetOrder with the admin guard applied.
// We return 404 (not 403) to avoid leaking whether an order exists at all
// to anyone who isn't the owner.
const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, tracking: { orderBy: { createdAt: "asc" } } },
  });
  if (!order || order.userId !== req.user.id) {
    throw new ApiError(404, "Order not found");
  }
  res.json({ success: true, order });
});

// POST /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, user: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.userId !== req.user.id) throw new ApiError(403, "Forbidden");
  if (!["PROCESSING", "CONFIRMED"].includes(order.orderStatus)) {
    throw new ApiError(
      400,
      `Cannot cancel an order with status ${order.orderStatus}`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Restore stock if it was deducted (CONFIRMED or COD)
    if (order.orderStatus === "CONFIRMED" || order.paymentMethod === "COD") {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        orderStatus: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
        tracking: {
          create: {
            status: "CANCELLED",
            message: reason || "Cancelled by customer",
          },
        },
      },
      include: { items: true, tracking: true },
    });
  });

  const tpl = emailTemplates.orderCancelled(updated, reason);
  sendEmail({ to: order.user.email, ...tpl }).catch((e) =>
    console.error("[email]", e),
  );

  res.json({ success: true, order: updated });
});

// -------------------- ADMIN --------------------

// GET /api/admin/orders
const listAllOrders = asyncHandler(async (req, res) => {
  const { status, search, from, to, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.orderStatus = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
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
    orders,
  });
});

// PUT /api/admin/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, message, location } = req.body;
  const VALID = [
    "PROCESSING",
    "CONFIRMED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
  ];
  if (!VALID.includes(status)) throw new ApiError(400, "Invalid status");

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });
  if (!order) throw new ApiError(404, "Order not found");

  const data = {
    orderStatus: status,
    tracking: { create: { status, message: message || status, location } },
  };
  if (status === "DELIVERED") {
    data.deliveredAt = new Date();
    // For COD orders, mark payment as PAID upon delivery
    if (order.paymentMethod === "COD") {
      data.paymentStatus = "PAID";
    }
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data,
    include: { items: true, tracking: true },
  });

  const tpl = emailTemplates.orderStatusUpdate(updated, status, message);
  sendEmail({ to: order.user.email, ...tpl }).catch((e) =>
    console.error("[email]", e),
  );

  res.json({ success: true, order: updated });
});

// GET /api/admin/orders/:id
const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: true,
      tracking: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, order });
});

module.exports = {
  placeOrder,
  verifyPayment,
  getMyOrders,
  getOrder,
  cancelOrder,
  listAllOrders,
  updateOrderStatus,
  adminGetOrder,
};
