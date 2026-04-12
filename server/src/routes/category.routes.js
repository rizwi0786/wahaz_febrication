const router = require('express').Router();
const ctrl = require('../controllers/category.controller');

router.get('/', ctrl.listCategories);
router.get('/:slug', ctrl.getCategory);

module.exports = router;
