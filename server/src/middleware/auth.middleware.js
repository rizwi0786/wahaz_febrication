const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');

/**
 * Verify the access token in the Authorization header and attach the user
 * to req.user. Responds 401 if missing/expired/invalid.
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized: missing token');
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Unauthorized: invalid or expired token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true, role: true, isBlocked: true },
  });

  if (!user) throw new ApiError(401, 'User not found');
  if (user.isBlocked) throw new ApiError(403, 'Account blocked');

  req.user = user;
  next();
});

/**
 * Requires req.user.role === 'ADMIN'. Must run after verifyToken.
 */
const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
