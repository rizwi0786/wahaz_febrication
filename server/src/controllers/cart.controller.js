const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');

const cartInclude = {
  items: {
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
      variant: true,
    },
  },
};

async function ensureCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: cartInclude });
  }
  return cart;
}

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await ensureCart(req.user.id);
  res.json({ success: true, cart });
});

// POST /api/cart  body: { productId, variantId, quantity }
const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;
  if (!productId || !variantId) {
    throw new ApiError(400, 'productId and variantId are required');
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || variant.productId !== productId) {
    throw new ApiError(404, 'Variant not found for this product');
  }
  if (!variant.product?.isActive) {
    throw new ApiError(400, 'This product is no longer available');
  }
  if (variant.stock < quantity) {
    throw new ApiError(400, `Only ${variant.stock} in stock`);
  }

  const cart = await ensureCart(req.user.id);

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: {
        cartId: cart.id,
        productId,
        variantId,
      },
    },
  });

  if (existing) {
    const newQty = existing.quantity + Number(quantity);
    if (variant.stock < newQty) throw new ApiError(400, `Only ${variant.stock} in stock`);
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity: Number(quantity),
      },
    });
  }

  const updated = await ensureCart(req.user.id);
  res.json({ success: true, cart: updated });
});

// PUT /api/cart/:itemId  body: { quantity }
const updateItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  if (!quantity || quantity < 1) throw new ApiError(400, 'quantity must be >= 1');

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, variant: true },
  });
  if (!item || item.cart.userId !== req.user.id) {
    throw new ApiError(404, 'Cart item not found');
  }
  if (item.variant.stock < quantity) {
    throw new ApiError(400, `Only ${item.variant.stock} in stock`);
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: Number(quantity) },
  });

  const cart = await ensureCart(req.user.id);
  res.json({ success: true, cart });
});

// DELETE /api/cart/:itemId
const removeItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!item || item.cart.userId !== req.user.id) {
    throw new ApiError(404, 'Cart item not found');
  }
  await prisma.cartItem.delete({ where: { id: itemId } });

  const cart = await ensureCart(req.user.id);
  res.json({ success: true, cart });
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await ensureCart(req.user.id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = { getCart, addToCart, updateItem, removeItem, clearCart, ensureCart };
