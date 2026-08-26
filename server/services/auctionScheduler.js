const Project = require('../models/Project');

/**
 * Issue #3: Auction Scheduler
 * Runs every 60 seconds, finds open projects whose auctionEndsAt has passed,
 * and transitions them to 'closed' status.
 */

let intervalId = null;

const closeExpiredAuctions = async () => {
  try {
    const now = new Date();
    const result = await Project.updateMany(
      { status: 'open', auctionEndsAt: { $lte: now } },
      { status: 'closed' }
    );

    if (result.modifiedCount > 0) {
      console.log(`[AuctionScheduler] Auto-closed ${result.modifiedCount} expired auction(s).`);
    }
  } catch (error) {
    console.error('[AuctionScheduler] Error:', error.message);
  }
};

/**
 * Start the auction scheduler (runs every 60 seconds)
 */
const startAuctionScheduler = () => {
  console.log('[AuctionScheduler] Started. Checking for expired auctions every 60s.');
  // Run immediately on start
  closeExpiredAuctions();
  // Then run every 60 seconds
  intervalId = setInterval(closeExpiredAuctions, 60 * 1000);
};

/**
 * Stop the scheduler (for graceful shutdown)
 */
const stopAuctionScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('[AuctionScheduler] Stopped.');
  }
};

module.exports = { startAuctionScheduler, stopAuctionScheduler, closeExpiredAuctions };
