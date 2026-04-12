const router = require('express').Router();
const ctrl = require('../controllers/cart.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', ctrl.getCart);
router.post('/', ctrl.addToCart);
router.put('/:itemId', ctrl.updateItem);
router.delete('/:itemId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);

module.exports = router;
