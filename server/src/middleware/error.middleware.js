const multer = require('multer');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../config/logger');
const { getClientIp } = require('../utils/clientIp');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Multer file-size / upload errors
  if (err instanceof multer.MulterError) {
    const map = {
      LIMIT_FILE_SIZE: 'File is too large (max 2 MB per image)',
      LIMIT_UNEXPECTED_FILE: 'Too many images in one upload (max 10)',
      LIMIT_FILE_COUNT: 'Too many files in one upload',
      LIMIT_FIELD_COUNT: 'Too many form fields',
    };
    return res.status(400).json({
      success: false,
      message: map[err.code] || err.message,
    });
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `Duplicate value for unique field: ${(err.meta?.target || []).join(', ')}`,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  if (err instanceof ApiError) {
    // Operational errors are expected (400/404/etc.) and stay quiet, but a 5xx
    // ApiError is a real server fault worth recording.
    if (err.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} -> ${err.statusCode} ${err.message}`, {
        ip: getClientIp(req),
        userId: req.user?.id,
        stack: err.stack,
      });
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // Anything reaching here is unexpected — log it with full context + stack.
  logger.error(`${req.method} ${req.originalUrl} -> ${err.statusCode || 500} ${err.message}`, {
    ip: getClientIp(req),
    userId: req.user?.id,
    stack: err.stack,
  });
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
