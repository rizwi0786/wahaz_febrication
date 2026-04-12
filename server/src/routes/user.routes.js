const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(verifyToken);

router.get('/profile', ctrl.getProfile);
router.put('/profile', upload.single('avatar'), ctrl.updateProfile);
router.put('/change-password', ctrl.changePassword);
router.post('/addresses', ctrl.addAddress);
router.put('/addresses/:id', ctrl.updateAddress);
router.delete('/addresses/:id', ctrl.deleteAddress);

module.exports = router;
