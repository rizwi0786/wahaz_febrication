const router = require('express').Router();
const ctrl = require('../controllers/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/', verifyToken, ctrl.createReview);
router.put('/:id', verifyToken, ctrl.updateReview);
router.delete('/:id', verifyToken, ctrl.deleteReview);

module.exports = router;
