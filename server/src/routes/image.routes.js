const router = require('express').Router();
const ctrl = require('../controllers/image.controller');

// Public, heavily cached image bytes decoded from the base64 blobs in
// Postgres. Mounted in app.js BEFORE the global /api rate limiter with its
// own (more generous) limiter — a single page view legitimately loads
// dozens of images.
router.get('/product/:imageId', ctrl.productImage);
router.get('/banner/:id', ctrl.bannerImage);
router.get('/category/:id', ctrl.categoryImage);
router.get('/review/:id/:index', ctrl.reviewImage);

module.exports = router;
