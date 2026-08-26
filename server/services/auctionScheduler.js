const Project = require('../models/Project');

/**
 * Issue #3: Auction Scheduler
 * Runs every 60 seconds, finds open projects whose auctionEndsAt has passed,
 * and transitions them to 'closed' status.
 * Also emits an `auction_closed` socket event to every affected room so
 * clients on the LiveAuction page refresh automatically without polling.
 */

let intervalId = null;

const closeExpiredAuctions = async (io) => {
  try {
    const now = new Date();

    // Find expired auctions BEFORE updating so we have their IDs
    const expiredProjects = await Project.find({
      status: 'open',
      auctionEndsAt: { $lte: now },
    }).select('_id');

    if (expiredProjects.length === 0) return;

    // Bulk-close them
    const ids = expiredProjects.map((p) => p._id);
    await Project.updateMany({ _id: { $in: ids } }, { status: 'closed' });

    console.log(`[AuctionScheduler] Auto-closed ${ids.length} expired auction(s).`);

    // Notify every connected client in each auction room
    if (io) {
      ids.forEach((id) => {
        io.to(id.toString()).emit('auction_closed', { projectId: id.toString() });
      });
    }
  } catch (error) {
    console.error('[AuctionScheduler] Error:', error.message);
  }
};

/**
 * Start the auction scheduler (runs every 60 seconds).
 * Pass the socket.io `io` instance so we can emit events on close.
 */
const startAuctionScheduler = (io) => {
  console.log('[AuctionScheduler] Started. Checking for expired auctions every 60s.');
  // Run immediately on start
  closeExpiredAuctions(io);
  // Then run every 60 seconds
  intervalId = setInterval(() => closeExpiredAuctions(io), 60 * 1000);
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
