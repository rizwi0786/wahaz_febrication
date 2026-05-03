const router = require('express').Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const adminCtrl = require('../controllers/admin.controller');
const productCtrl = require('../controllers/product.controller');
const categoryCtrl = require('../controllers/category.controller');
const orderCtrl = require('../controllers/order.controller');
const userCtrl = require('../controllers/user.controller');
const reviewCtrl = require('../controllers/review.controller');
const couponCtrl = require('../controllers/coupon.controller');
const bannerCtrl = require('../controllers/banner.controller');
const customOrderCtrl = require('../controllers/customOrder.controller');
const consultationCtrl = require('../controllers/consultation.controller');

// All admin routes are double-protected
router.use(verifyToken, verifyAdmin);

// ---- Dashboard stats ----
router.get('/stats', adminCtrl.getStats);
router.get('/stats/revenue-chart', adminCtrl.revenueChart);
router.get('/stats/top-products', adminCtrl.topProducts);
router.get('/stats/recent-orders', adminCtrl.recentOrders);

// ---- Products ----
router.get('/products', productCtrl.adminListProducts);
router.get('/products/:id', productCtrl.adminGetProduct);
router.post('/products', productCtrl.createProduct);
router.put('/products/:id', productCtrl.updateProduct);
router.delete('/products/:id', productCtrl.deleteProduct);
router.post('/products/:id/images', upload.array('images', 10), productCtrl.uploadImages);
router.delete('/products/:id/images/:imageId', productCtrl.deleteImage);

// ---- Categories ----
router.post('/categories', upload.single('image'), categoryCtrl.createCategory);
router.put('/categories/:id', upload.single('image'), categoryCtrl.updateCategory);
router.delete('/categories/:id', categoryCtrl.deleteCategory);

// ---- Orders ----
router.get('/orders', orderCtrl.listAllOrders);
router.get('/orders/:id', orderCtrl.adminGetOrder);
router.put('/orders/:id/status', orderCtrl.updateOrderStatus);

// ---- Users ----
router.get('/users', userCtrl.listUsers);
router.post('/users', userCtrl.createUser);
router.put('/users/:id/block', userCtrl.toggleBlockUser);

// ---- Reviews ----
router.get('/reviews', reviewCtrl.listAllReviews);
router.put('/reviews/:id/approve', reviewCtrl.approveReview);
router.delete('/reviews/:id', reviewCtrl.deleteReview);

// ---- Coupons ----
router.get('/coupons', couponCtrl.listCoupons);
router.post('/coupons', couponCtrl.createCoupon);
router.put('/coupons/:id', couponCtrl.updateCoupon);
router.delete('/coupons/:id', couponCtrl.deleteCoupon);

// ---- Custom Orders ----
router.get('/custom-orders', customOrderCtrl.adminListCustomOrders);
router.get('/custom-orders/:id', customOrderCtrl.adminGetCustomOrder);
router.put('/custom-orders/:id/quote', customOrderCtrl.adminQuotePrice);
router.put('/custom-orders/:id/respond-counter', customOrderCtrl.adminRespondCounter);
router.put('/custom-orders/:id/reject', customOrderCtrl.adminReject);

// ---- Consultations ----
router.get('/consultations', consultationCtrl.adminListConsultations);
router.get('/consultations/:id', consultationCtrl.adminGetConsultation);
router.put('/consultations/:id/confirm', consultationCtrl.adminConfirmConsultation);
router.put('/consultations/:id/cancel', consultationCtrl.adminCancelConsultation);
router.put('/consultations/:id/complete', consultationCtrl.adminCompleteConsultation);

// ---- Google Calendar / Meet OAuth setup ----
router.get('/google/auth-url', consultationCtrl.googleAuthUrl);
router.get('/google/status', consultationCtrl.googleStatus);
// NOTE: /google/callback is mounted publicly in app.js because Google
// redirects the browser to it (no Authorization header).

// ---- Banners ----
router.get('/banners', bannerCtrl.listAllBanners);
router.post('/banners', upload.single('image'), bannerCtrl.createBanner);
router.put('/banners/:id', upload.single('image'), bannerCtrl.updateBanner);
router.delete('/banners/:id', bannerCtrl.deleteBanner);

module.exports = router;
