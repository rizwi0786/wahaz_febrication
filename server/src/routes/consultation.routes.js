const router = require('express').Router();
const ctrl = require('../controllers/consultation.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public create — guests can book too. If a JWT is present we attach the user.
const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return next();
  return verifyToken(req, res, next);
};

router.post('/', optionalAuth, ctrl.createConsultation);

router.use(verifyToken);
router.get('/', ctrl.getMyConsultations);
router.post('/:id/cancel', ctrl.cancelConsultation);

module.exports = router;
