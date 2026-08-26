const express = require('express');
const router = express.Router();
const { getProviders, getProviderById, updateProviderProfile, addReview, getProviderReviews } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { cache, invalidateCache } = require('../middleware/cacheMiddleware'); // Issue #16

// Fetch registered software providers — Issue #16: cache for 2 minutes
router.route('/providers').get(protect, cache('providers:all', 120), getProviders);

// Fetch a specific software provider's profile — cache per provider for 2 minutes
router.route('/providers/:id')
  .get(protect, cache((req) => `provider:${req.params.id}`, 120), getProviderById)
  .put(protect, async (req, res, next) => {
    // Invalidate both the specific provider and the list cache on profile update
    await invalidateCache(`provider:${req.params.id}`);
    await invalidateCache('providers:all');
    next();
  }, updateProviderProfile);

// Provider Reviews
router.route('/providers/:id/reviews')
  .get(protect, getProviderReviews)
  .post(protect, async (req, res, next) => {
    // Invalidate provider cache after a new review changes feedbackScore
    await invalidateCache(`provider:${req.params.id}`);
    await invalidateCache('providers:all');
    next();
  }, addReview);

module.exports = router;
