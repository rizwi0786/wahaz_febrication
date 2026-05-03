const router = require('express').Router();
const ctrl = require('../controllers/customOrder.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/', ctrl.createCustomOrder);
router.get('/', ctrl.getMyCustomOrders);
router.get('/:id', ctrl.getCustomOrder);
router.post('/:id/counter-offer', ctrl.counterOffer);
router.post('/:id/accept', ctrl.acceptQuote);
router.post('/:id/cancel', ctrl.cancelCustomOrder);
router.post('/:id/place-order', ctrl.placeCustomOrder);

module.exports = router;
