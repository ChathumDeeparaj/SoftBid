const express = require('express');
const router = express.Router();
const { getNpePreview, getNpeConfig, updateNpeConfig } = require('../controllers/npeController');
const { protect, superAdminGuard } = require('../middleware/auth');

// Live NPE estimate preview (any authenticated user can call this during form-fill)
router.route('/preview').post(protect, getNpePreview);

// Read NPE formula parameters (Any authenticated user can read this to power the UI)
router.route('/config').get(protect, getNpeConfig);

// Super Admin: update NPE formula parameters
router.route('/config').put(protect, superAdminGuard, updateNpeConfig);

module.exports = router;
