const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/', ctrl.placeOrder);
router.post('/verify-payment', ctrl.verifyPayment);
router.get('/', ctrl.getMyOrders);
router.get('/:id', ctrl.getOrder);
router.post('/:id/cancel', ctrl.cancelOrder);

module.exports = router;
