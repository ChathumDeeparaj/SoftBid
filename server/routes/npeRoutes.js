const express = require('express');
const router = express.Router();
const {
  getNpePreview, getNpeConfig, updateNpeConfig,
  getNpeProfiles, getNpeCalibration,
} = require('../controllers/npeController');
const { protect, superAdminGuard } = require('../middleware/auth');
const { cache, invalidateCache } = require('../middleware/cacheMiddleware'); // Issue #16

// Live NPE estimate preview (any authenticated user can call this during form-fill)
router.route('/preview').post(protect, getNpePreview);

// Issue #12: List all NPE profiles
router.route('/profiles').get(protect, getNpeProfiles);

// Issue #7: NPE calibration metrics (Super Admin only)
router.route('/calibration').get(protect, superAdminGuard, getNpeCalibration);

// Read NPE formula parameters — Issue #16: cache for 5 minutes
router.get('/config', protect, cache((req) => `npe:config:${req.query.profile || 'default'}`, 300), getNpeConfig);

// Super Admin: update NPE formula parameters — invalidate cache on update
router.put('/config', protect, superAdminGuard, async (req, res, next) => {
  const profile = req.query.profile || 'default';
  await invalidateCache(`npe:config:${profile}`);
  next();
}, updateNpeConfig);

module.exports = router;
