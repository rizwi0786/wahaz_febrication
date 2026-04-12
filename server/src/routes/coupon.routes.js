const router = require('express').Router();
const ctrl = require('../controllers/coupon.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/validate', verifyToken, ctrl.validateCoupon);

module.exports = router;
