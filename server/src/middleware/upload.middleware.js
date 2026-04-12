const multer = require('multer');

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// Keep this conservative — every image ends up base64-encoded inside Postgres
// and is sent in full on every API response that includes it.
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WebP images are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

/**
 * Convert a multer file (in memory) to a base64 data URL suitable for
 * storage in Postgres and direct use in `<img src>`.
 */
function fileToDataUrl(file) {
  if (!file || !file.buffer) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

module.exports = upload;
module.exports.fileToDataUrl = fileToDataUrl;
