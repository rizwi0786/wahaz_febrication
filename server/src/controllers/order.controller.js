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
  const { shippingAddress, paymentMethod, couponCode, notes, fitPreference } = req.body;
  const ALLOWED_FITS = ['Slim Fit', 'Regular Fit', 'Tailored Fit', 'Relaxed Fit', 'Classic Fit'];
  if (fitPreference && !ALLOWED_FITS.includes(fitPreference)) {
    throw new ApiError(400, `fitPreference must be one of: ${ALLOWED_FITS.join(', ')}`);
  }
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

  const unavailable = cart.items.filter((it) => !it.product?.isActive);
  if (unavailable.length > 0) {
    const names = unavailable.map((it) => it.product?.name).filter(Boolean).join(', ');
    throw new ApiError(
      400,
      `Some items in your cart are no longer available: ${names}. Please remove them before checking out.`
    );
  }

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
        orderStatus: "ORDER_RECEIVED",
        subtotal,
        discount,
        shippingCharge,
        tax,
        total,
        couponCode: coupon?.code,
        fitPreference: fitPreference || null,
        notes,
        items: { create: lineItems },
        tracking: {
          create: {
            status: "ORDER_RECEIVED",
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

// Constant-time signature comparison so an attacker can't infer the expected
// digest from response timing.
function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

async function logPaymentEvent(data) {
  try {
    await prisma.paymentEvent.create({ data });
  } catch (e) {
    // Unique-violation on (source, eventId, eventType) means we already
    // logged this event — that's the whole point of the unique constraint.
    if (e?.code !== "P2002") console.error("[paymentEvent]", e);
  }
}

// Promote a PENDING Razorpay order to PAID. Atomic and idempotent: the
// updateMany WHERE clause guarantees we only run side effects when this
// call is the one that actually flipped the status.
async function finalizePaidOrder({
  orderId,
  razorpayPaymentId,
  amountPaise,
  source,
}) {
  return prisma.$transaction(async (tx) => {
    const flipped = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "PENDING" },
      data: {
        paymentStatus: "PAID",
        paymentId: razorpayPaymentId,
        paymentAmount: amountPaise,
        paidAt: new Date(),
      },
    });

    if (flipped.count === 0) {
      // Already finalized by the other channel (verify vs webhook). No-op.
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      return { order: existing, alreadyPaid: true };
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
    if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (order.couponCode) {
      await tx.coupon.update({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.orderTracking.create({
      data: {
        orderId,
        status: "ORDER_RECEIVED",
        message: `Payment received (${source})`,
      },
    });

    return { order, alreadyPaid: false };
  });
}

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

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.userId !== req.user.id) throw new ApiError(403, "Forbidden");

  // Bind the razorpayOrderId from client to the one we created. If they don't
  // match, the client is trying to attach a payment from another order.
  if (
    !order.razorpayOrderId ||
    order.razorpayOrderId !== razorpayOrderId
  ) {
    await logPaymentEvent({
      orderId,
      source: "verify",
      eventType: "verify.order_mismatch",
      eventId: razorpayPaymentId,
      razorpayOrderId,
      razorpayPaymentId,
      status: "failed",
      errorMessage: "razorpayOrderId does not match order",
      ipAddress: req.ip,
    });
    throw new ApiError(400, "Order/payment mismatch");
  }

  // 1. HMAC signature check (constant-time)
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (!timingSafeEqualHex(expectedSignature, razorpaySignature)) {
    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
    await logPaymentEvent({
      orderId,
      source: "verify",
      eventType: "verify.signature_failed",
      eventId: razorpayPaymentId,
      razorpayOrderId,
      razorpayPaymentId,
      status: "failed",
      signatureValid: false,
      ipAddress: req.ip,
    });
    throw new ApiError(400, "Invalid payment signature");
  }

  // 2. Pull the actual payment from Razorpay and validate amount/currency/status
  // server-side. Never trust what the client tells us about how much was paid.
  let payment;
  try {
    payment = await razorpay.payments.fetch(razorpayPaymentId);
  } catch (e) {
    await logPaymentEvent({
      orderId,
      source: "verify",
      eventType: "verify.fetch_failed",
      eventId: razorpayPaymentId,
      razorpayPaymentId,
      status: "failed",
      errorMessage: e?.message,
      ipAddress: req.ip,
    });
    throw new ApiError(502, "Could not verify payment with gateway");
  }

  const expectedAmount = Math.round(Number(order.total) * 100);
  const validations = [
    [payment.order_id === razorpayOrderId, "order_id mismatch"],
    [payment.amount === expectedAmount, "amount mismatch"],
    [payment.currency === "INR", "currency mismatch"],
    [
      payment.status === "captured" || payment.status === "authorized",
      `unexpected status ${payment.status}`,
    ],
  ];
  const failed = validations.find(([ok]) => !ok);
  if (failed) {
    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
    await logPaymentEvent({
      orderId,
      source: "verify",
      eventType: "verify.validation_failed",
      eventId: razorpayPaymentId,
      razorpayOrderId,
      razorpayPaymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: "failed",
      signatureValid: true,
      errorMessage: failed[1],
      rawPayload: payment,
      ipAddress: req.ip,
    });
    throw new ApiError(400, `Payment validation failed: ${failed[1]}`);
  }

  // 3. Promote to PAID idempotently
  const { order: updated, alreadyPaid } = await finalizePaidOrder({
    orderId,
    razorpayPaymentId,
    amountPaise: payment.amount,
    source: "verify",
  });

  await logPaymentEvent({
    orderId,
    source: "verify",
    eventType: alreadyPaid ? "verify.already_paid" : "verify.success",
    eventId: razorpayPaymentId,
    razorpayOrderId,
    razorpayPaymentId,
    amount: payment.amount,
    currency: payment.currency,
    status: "success",
    signatureValid: true,
    ipAddress: req.ip,
  });

  if (!alreadyPaid) {
    const tpl = emailTemplates.orderConfirmation(updated);
    sendEmail({ to: order.user.email, ...tpl }).catch((e) =>
      console.error("[email]", e),
    );
  }

  res.json({ success: true, order: updated });
});

// POST /api/webhooks/razorpay  (raw body, no auth)
// Authoritative source of payment truth. Razorpay retries until 2xx, so we
// must dedup via PaymentEvent.unique(source, eventId, eventType).
const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return res.status(500).json({ success: false });
  }

  const rawBody = req.body; // Buffer (express.raw)
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!signature || !timingSafeEqualHex(expected, String(signature))) {
    await logPaymentEvent({
      source: "webhook",
      eventType: "webhook.signature_failed",
      status: "failed",
      signatureValid: false,
      ipAddress: req.ip,
    });
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }

  const eventType = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;
  const razorpayPaymentId = paymentEntity?.id;
  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;

  // Locate our internal order by razorpayOrderId (unique).
  let dbOrder = null;
  if (razorpayOrderId) {
    dbOrder = await prisma.order.findUnique({
      where: { razorpayOrderId },
    });
  }

  // Always log the event first (idempotent via unique constraint).
  await logPaymentEvent({
    orderId: dbOrder?.id,
    source: "webhook",
    eventType,
    eventId: razorpayPaymentId || payload.payload?.refund?.entity?.id || payload.id,
    razorpayOrderId,
    razorpayPaymentId,
    amount: paymentEntity?.amount,
    currency: paymentEntity?.currency,
    status: paymentEntity?.status,
    signatureValid: true,
    rawPayload: payload,
    ipAddress: req.ip,
  });

  if (!dbOrder) {
    // Webhook for an order we don't know about — ack so Razorpay stops retrying.
    return res.json({ success: true, ignored: true });
  }

  if (eventType === "payment.captured" || eventType === "order.paid") {
    const expectedAmount = Math.round(Number(dbOrder.total) * 100);
    if (
      paymentEntity &&
      paymentEntity.amount === expectedAmount &&
      paymentEntity.currency === "INR"
    ) {
      const { order: updated, alreadyPaid } = await finalizePaidOrder({
        orderId: dbOrder.id,
        razorpayPaymentId,
        amountPaise: paymentEntity.amount,
        source: "webhook",
      });
      if (!alreadyPaid) {
        const user = await prisma.user.findUnique({
          where: { id: updated.userId },
        });
        const tpl = emailTemplates.orderConfirmation(updated);
        sendEmail({ to: user.email, ...tpl }).catch((e) =>
          console.error("[email]", e),
        );
      }
    } else {
      await logPaymentEvent({
        orderId: dbOrder.id,
        source: "webhook",
        eventType: "webhook.amount_mismatch",
        eventId: razorpayPaymentId,
        razorpayOrderId,
        razorpayPaymentId,
        amount: paymentEntity?.amount,
        currency: paymentEntity?.currency,
        status: "failed",
        errorMessage: `expected ${expectedAmount} got ${paymentEntity?.amount}`,
        rawPayload: payload,
      });
    }
  } else if (eventType === "payment.failed") {
    await prisma.order.updateMany({
      where: { id: dbOrder.id, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
  }

  // Refund events: log only for now; reconciliation handled later.
  res.json({ success: true });
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
  if (!["ORDER_RECEIVED", "IN_TAILORING"].includes(order.orderStatus)) {
    throw new ApiError(
      400,
      `Cannot cancel an order with status ${order.orderStatus}`,
    );
  }

  const stockWasDeducted =
    order.paymentMethod === "COD" || order.paymentStatus === "PAID";

  const updated = await prisma.$transaction(async (tx) => {
    // Restore stock if it was already deducted (COD always; Razorpay only after payment).
    if (stockWasDeducted) {
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
    "ORDER_RECEIVED",
    "IN_TAILORING",
    "QUALITY_CHECK",
    "READY_TO_SHIP",
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

  const tpl = emailTemplates.orderStatusUpdate(
    { ...updated, user: order.user },
    status,
    message,
  );
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
  razorpayWebhook,
  getMyOrders,
  getOrder,
  cancelOrder,
  listAllOrders,
  updateOrderStatus,
  adminGetOrder,
};
