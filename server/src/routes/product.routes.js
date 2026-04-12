const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const reviewCtrl = require('../controllers/review.controller');

router.get('/', ctrl.listProducts);
router.get('/featured', ctrl.featured);
router.get('/new-arrivals', ctrl.newArrivals);
router.get('/category/:categorySlug', ctrl.byCategory);
router.get('/:slug', ctrl.getProduct);
router.get('/:id/reviews', reviewCtrl.getProductReviews);

module.exports = router;
