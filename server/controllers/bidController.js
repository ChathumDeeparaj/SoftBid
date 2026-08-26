const Bid = require('../models/Bid');
const Project = require('../models/Project');
const { calculateRankings } = require('../services/rankingEngine');

/**
 * @desc    Submit a new bid or update an existing one
 * @route   POST /api/bids
 * @access  Private (Provider only)
 */
const submitBid = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can submit bids' });
    }

    const { projectId, bidAmountLKR } = req.body;

    if (!projectId || !bidAmountLKR) {
      return res.status(400).json({ message: 'Project ID and Bid Amount are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // ── Issue #3: Reject bids if auction is not open ──
    if (project.status !== 'open') {
      return res.status(400).json({ message: 'This auction is no longer accepting bids.' });
    }
    if (project.auctionEndsAt && new Date() > new Date(project.auctionEndsAt)) {
      return res.status(400).json({ message: 'The bidding deadline has passed.' });
    }

    // ── Issue #10: Bid range validation ──
    const amount = Number(bidAmountLKR);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Bid amount must be a positive number.' });
    }
    if (project.npeEstimate > 0) {
      const minBid = project.npeEstimate * 0.1;
      const maxBid = project.npeEstimate * 3.0;
      if (amount < minBid) {
        return res.status(400).json({
          message: `Bid too low. Minimum is LKR ${Math.round(minBid).toLocaleString()} (10% of NPE estimate).`,
        });
      }
      if (amount > maxBid) {
        return res.status(400).json({
          message: `Bid too high. Maximum is LKR ${Math.round(maxBid).toLocaleString()} (300% of NPE estimate).`,
        });
      }
    }

    // ── Issue #11: Amendment lock — no changes in final 30 minutes ──
    let bid = await Bid.findOne({ project: projectId, provider: req.user._id });
    if (bid) {
      if (project.auctionEndsAt) {
        const lockTime = new Date(project.auctionEndsAt.getTime() - 30 * 60 * 1000);
        if (new Date() > lockTime) {
          return res.status(400).json({
            message: 'Bid amendments are locked in the final 30 minutes before auction close.',
          });
        }
      }

      // Issue #11: Save revision history (max 5 revisions)
      if (bid.revisionHistory.length >= 5) {
        return res.status(400).json({ message: 'Maximum of 5 bid revisions allowed.' });
      }
      bid.revisionHistory.push({ amount: bid.bidAmountLKR, changedAt: new Date() });
      bid.bidAmountLKR = amount;
      await bid.save();
    } else {
      bid = await Bid.create({
        project: projectId,
        provider: req.user._id,
        bidAmountLKR: amount,
      });
    }

    // Fetch all active bids to recalculate rankings
    const allBids = await Bid.find({ project: projectId, status: 'active' })
      .populate('provider', 'completedProjects yearsExperience feedbackScore successRate email companyName isVerified');

    // Issue #2: Pass project's AHP weights to the ranking engine
    const rankedBids = calculateRankings(allBids, project.npeEstimate, project.ahpWeights);

    // Save ranks and trust scores in bulk
    const bulkOps = rankedBids.map(b => ({
      updateOne: {
        filter: { _id: b._id },
        update: { trustScore: b.trustScore, rank: b.rank },
      },
    }));
    await Bid.bulkWrite(bulkOps);

    // Emit updated leaderboard via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(projectId.toString()).emit('bids_updated', rankedBids);
    }

    res.status(201).json({ message: 'Bid submitted successfully', bid, leaderboard: rankedBids });
  } catch (error) {
    console.error('❌ [submitBid] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Withdraw a bid
 * @route   PUT /api/bids/:bidId/withdraw
 * @access  Private (Provider only — bid owner)
 */
const withdrawBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId);
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    if (bid.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only withdraw your own bids.' });
    }
    if (bid.status !== 'active') {
      return res.status(400).json({ message: 'Only active bids can be withdrawn.' });
    }

    // Issue #11: Check 30-min lock
    const project = await Project.findById(bid.project);
    if (project && project.auctionEndsAt) {
      const lockTime = new Date(project.auctionEndsAt.getTime() - 30 * 60 * 1000);
      if (new Date() > lockTime) {
        return res.status(400).json({
          message: 'Bid withdrawal is locked in the final 30 minutes before auction close.',
        });
      }
    }

    bid.status = 'withdrawn';
    bid.withdrawnAt = new Date();
    await bid.save();

    // Recalculate rankings without this bid
    if (project) {
      const allBids = await Bid.find({ project: bid.project, status: 'active' })
        .populate('provider', 'completedProjects yearsExperience feedbackScore successRate email companyName isVerified');
      const rankedBids = calculateRankings(allBids, project.npeEstimate, project.ahpWeights);
      const bulkOps = rankedBids.map(b => ({
        updateOne: { filter: { _id: b._id }, update: { trustScore: b.trustScore, rank: b.rank } },
      }));
      if (bulkOps.length > 0) await Bid.bulkWrite(bulkOps);

      const io = req.app.get('io');
      if (io) io.to(bid.project.toString()).emit('bids_updated', rankedBids);
    }

    res.status(200).json({ message: 'Bid withdrawn successfully', bid });
  } catch (error) {
    console.error('❌ [withdrawBid] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get all bids for a specific project
 * @route   GET /api/bids/:projectId
 * @access  Private
 */
const getProjectBids = async (req, res) => {
  try {
    const bids = await Bid.find({ project: req.params.projectId, status: 'active' })
      .populate('provider', 'email companyName isVerified')
      .sort({ rank: 1 });

    res.status(200).json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { submitBid, withdrawBid, getProjectBids };
