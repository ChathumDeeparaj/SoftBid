const express = require('express');
const router = express.Router();
const { submitBid, withdrawBid, getProjectBids } = require('../controllers/bidController');
const { protect, roleGuard } = require('../middleware/auth');

// Submit or update a bid (Provider only)
router.route('/').post(protect, roleGuard('provider'), submitBid);

// Issue #11: Withdraw a bid (Provider only — bid owner)
router.route('/:bidId/withdraw').put(protect, roleGuard('provider'), withdrawBid);

// Get all bids for a project (Client/Admin/Provider)
router.route('/:projectId').get(protect, getProjectBids);

module.exports = router;
