const multer = require('multer');
const { ApiError } = require('../utils/errorHandler');

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
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  console.error('[error]', err);
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
