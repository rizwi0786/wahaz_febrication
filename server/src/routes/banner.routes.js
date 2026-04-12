const router = require('express').Router();
const ctrl = require('../controllers/banner.controller');

router.get('/', ctrl.listActiveBanners);

module.exports = router;
