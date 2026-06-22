const router = require('express').Router();
const ctrl = require('../controllers/newsletter.controller');

// Public — anyone can subscribe from the site footer.
router.post('/', ctrl.subscribe);

module.exports = router;
