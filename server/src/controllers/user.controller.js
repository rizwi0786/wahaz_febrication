const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { fileToDataUrl } = require('../middleware/upload.middleware');

const SALT_ROUNDS = 12;

/**
 * Constant-time comparison between the client-supplied secret and the
 * server's ADMIN_CREATION_SECRET. Using a raw `===` would leak the prefix
 * length through response timing; Buffer lengths must also match before
 * timingSafeEqual, so we pad to a fixed 64-byte window.
 */
function isAdminSecretValid(provided) {
  const expected = process.env.ADMIN_CREATION_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.alloc(64);
  const b = Buffer.alloc(64);
  Buffer.from(String(provided)).copy(a);
  Buffer.from(String(expected)).copy(b);
  return crypto.timingSafeEqual(a, b);
}

// GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      isVerified: true,
      createdAt: true,
      addresses: true,
    },
  });
  res.json({ success: true, user });
});

// PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const data = {};
  if (name) data.name = name;
  if (phone) data.phone = phone;
  if (req.file) data.avatar = fileToDataUrl(req.file);
  else if (typeof req.body?.avatar === 'string' && req.body.avatar.startsWith('data:image/')) {
    data.avatar = req.body.avatar;
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { id: true, name: true, email: true, phone: true, avatar: true },
  });
  res.json({ success: true, user });
});

// PUT /api/users/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'currentPassword and newPassword are required');
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new ApiError(401, 'Current password is incorrect');

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashed, refreshToken: null },
  });

  res.json({ success: true, message: 'Password changed. Please log in again.' });
});

// POST /api/users/addresses
const addAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    country,
    isDefault,
  } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    throw new ApiError(400, 'Missing required address fields');
  }

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: !!isDefault,
    },
  });
  res.status(201).json({ success: true, address });
});

// PUT /api/users/addresses/:id
const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user.id) {
    throw new ApiError(404, 'Address not found');
  }

  if (req.body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id },
    data: req.body,
  });
  res.json({ success: true, address });
});

// DELETE /api/users/addresses/:id
const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user.id) {
    throw new ApiError(404, 'Address not found');
  }
  await prisma.address.delete({ where: { id } });
  res.json({ success: true, message: 'Address deleted' });
});

// -------------------- ADMIN --------------------

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const skip = (Number(page) - 1) * Number(limit);
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
        isVerified: true,
        avatar: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    users,
  });
});

// PUT /api/admin/users/:id/block
const toggleBlockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');

  const updated = await prisma.user.update({
    where: { id },
    data: { isBlocked: !user.isBlocked, refreshToken: null },
    select: { id: true, name: true, email: true, isBlocked: true },
  });
  res.json({ success: true, user: updated });
});

// POST /api/admin/users
// Admin-only. Creates a CUSTOMER freely; creating an ADMIN additionally
// requires the server-side ADMIN_CREATION_SECRET so that a stolen admin
// session on its own can't mint more admins.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, secretCode } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email, and password are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, 'Invalid email');
  }

  const wantsAdmin = role === 'ADMIN';
  if (wantsAdmin && !isAdminSecretValid(secretCode)) {
    // Generic message — never confirm "wrong secret" vs "missing config".
    throw new ApiError(403, 'Not authorized to create admin accounts');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already in use');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      phone,
      password: hashed,
      role: wantsAdmin ? 'ADMIN' : 'CUSTOMER',
      // Users created by an admin don't need to go through email verification.
      isVerified: true,
      cart: { create: {} },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  res.status(201).json({ success: true, user });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  listUsers,
  toggleBlockUser,
  createUser,
};
