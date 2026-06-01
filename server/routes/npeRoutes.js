const express = require('express');
const router = express.Router();
const { getNpePreview, getNpeConfig, updateNpeConfig } = require('../controllers/npeController');
const { protect, superAdminGuard } = require('../middleware/auth');

// Live NPE estimate preview (any authenticated user can call this during form-fill)
router.route('/preview').post(protect, getNpePreview);

// Super Admin: read and update NPE formula parameters
router.route('/config')
  .get(protect, superAdminGuard, getNpeConfig)
  .put(protect, superAdminGuard, updateNpeConfig);

module.exports = router;
