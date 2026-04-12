const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const {
  generateTokens,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const SALT_ROUNDS = 12;

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email, and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const verifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      phone,
      verifyToken,
      cart: { create: {} },
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  // Fire-and-forget verification email
  const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  const tpl = emailTemplates.verifyEmail(name, verifyLink);
  sendEmail({ to: email, ...tpl }).catch((e) => console.error('[email]', e));

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    user,
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'email and password are required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (user.isBlocked) throw new ApiError(403, 'Account blocked');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const { accessToken, refreshToken } = generateTokens(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  setRefreshCookie(res, refreshToken);

  res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await prisma.user.update({
        where: { id: decoded.id },
        data: { refreshToken: null },
      });
    } catch {
      /* ignore */
    }
  }
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

// POST /api/auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, 'Refresh token reuse detected');
  }

  // Rotate both tokens
  const { accessToken, refreshToken: newRefresh } = generateTokens(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } });
  setRefreshCookie(res, newRefresh);

  res.json({ success: true, accessToken });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'email is required');

  const user = await prisma.user.findUnique({ where: { email } });
  // Respond 200 even if user not found (avoid account enumeration)
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hr
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: expiry },
    });
    const link = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const tpl = emailTemplates.resetPassword(user.name, link);
    sendEmail({ to: email, ...tpl }).catch((e) => console.error('[email]', e));
  }

  res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, 'token and password are required');

  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpiry: null },
  });

  res.json({ success: true, message: 'Password reset successful' });
});

// GET /api/auth/verify-email/:token
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user) throw new ApiError(400, 'Invalid verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null },
  });

  res.json({ success: true, message: 'Email verified' });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatar: true,
      isVerified: true,
      createdAt: true,
    },
  });
  res.json({ success: true, user });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  me,
};
