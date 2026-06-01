const express = require('express');
const router = express.Router();
const { getProviders } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Fetch registered software providers
router.route('/providers').get(protect, getProviders);

module.exports = router;
