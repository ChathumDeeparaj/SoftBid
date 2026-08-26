const Project = require('../models/Project');
const Bid = require('../models/Bid');
const User = require('../models/User');
const NpeConfig = require('../models/NpeConfig');
const { calculateNPE } = require('../services/npeEngine');

// @desc    Get logged in user's (client's) projects
// @route   GET /api/projects/my-projects
// @access  Private (Client only)
const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('❌ [getMyProjects] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new project with NPE snapshot
// @route   POST /api/projects
// @access  Private (Client only)
const createProject = async (req, res) => {
  try {
    const {
      title, description, timeframe, clientBudgetLKR,
      selectedFeatures, integrations, securityLevel, riskAccepted,
      invitedProviders, auctionEndsAt: rawAuctionEndsAt, auctionDurationDays, ahpWeights,
    } = req.body;

    if (!title || !description || !clientBudgetLKR) {
      return res.status(400).json({ message: 'Title, description, and budget are required.' });
    }

    if (invitedProviders && Array.isArray(invitedProviders) && invitedProviders.length > 5) {
      return res.status(400).json({ message: 'You can only invite up to 5 favorite service providers.' });
    }

    // Use client-provided auctionEndsAt if given; fall back to auctionDurationDays or 7 days
    let auctionEndsAt;
    if (rawAuctionEndsAt) {
      auctionEndsAt = new Date(rawAuctionEndsAt);
      if (isNaN(auctionEndsAt.getTime()) || auctionEndsAt <= new Date()) {
        return res.status(400).json({ message: 'Bid deadline must be a valid future date.' });
      }
    } else {
      const durationDays = Number(auctionDurationDays) || 7;
      auctionEndsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }

    // Issue #2: Validate AHP weights if provided
    let validatedWeights = { experience: 0.40, quality: 0.40, price: 0.20 };
    if (ahpWeights) {
      const { experience = 0.4, quality = 0.4, price = 0.2 } = ahpWeights;
      const sum = experience + quality + price;
      if (Math.abs(sum - 1.0) <= 0.02) {
        validatedWeights = { experience, quality, price };
      }
    }

    // Load current NPE config and calculate snapshot
    let config = await NpeConfig.findOne();
    if (!config) config = await NpeConfig.create({});

    const npeResult = calculateNPE(
      { selectedFeatures: selectedFeatures || [], integrations: integrations || 0, securityLevel: securityLevel || 'basic' },
      config
    );

    const project = await Project.create({
      title,
      description,
      timeframe: timeframe || 'Not specified',
      clientBudgetLKR: Number(clientBudgetLKR),
      selectedFeatures: selectedFeatures || [],
      integrations: integrations || 0,
      securityLevel: securityLevel || 'basic',
      riskAccepted: riskAccepted || false,
      npeEstimate: npeResult.benchmark,
      npeBreakdown: npeResult.breakdown,
      npeConfidence: npeResult.confidence,
      client: req.user._id,
      invitedProviders: invitedProviders || [],
      auctionEndsAt,
      ahpWeights: validatedWeights,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('❌ [createProject] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Award a project to a bid winner
// @route   PUT /api/projects/:id/award
// @access  Private (Client — project owner only)
const awardProject = async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) {
      return res.status(400).json({ message: 'bidId is required to award a project.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Only the client who owns the project can award it
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can award this project.' });
    }

    // Project must be 'closed' (auction ended) to be awarded
    if (project.status !== 'closed') {
      return res.status(400).json({ message: 'Project must be in "closed" status to award. Wait for the auction to end.' });
    }

    const bid = await Bid.findById(bidId).populate('provider', 'email companyName');
    if (!bid || bid.project.toString() !== project._id.toString()) {
      return res.status(404).json({ message: 'Bid not found for this project.' });
    }
    if (bid.status !== 'active') {
      return res.status(400).json({ message: 'Cannot award a withdrawn or already-processed bid.' });
    }

    // Award
    project.status = 'awarded';
    project.awardedProvider = bid.provider._id;
    project.awardedBid = bid._id;
    project.awardedAt = new Date();
    await project.save();

    // Mark the winning bid as accepted, others as rejected
    bid.status = 'accepted';
    await bid.save();

    await Bid.updateMany(
      { project: project._id, _id: { $ne: bid._id }, status: 'active' },
      { status: 'rejected' }
    );

    // Notify all viewers in the auction room via socket
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('auction_awarded', {
        projectId: project._id.toString(),
        awardedBidId: bid._id.toString(),
        awardedProvider: {
          _id: bid.provider._id,
          companyName: bid.provider.companyName,
          email: bid.provider.email,
        },
        awardedAt: project.awardedAt,
      });
    }

    res.status(200).json({ message: 'Project awarded successfully!', project, winningBid: bid });
  } catch (error) {
    console.error('❌ [awardProject] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark a project as completed (Issue #8: increment provider's completedProjects)
// @route   PUT /api/projects/:id/complete
// @access  Private (Client — project owner only)
const completeProject = async (req, res) => {
  try {
    const { actualCostLKR } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can mark this as completed.' });
    }

    if (project.status !== 'awarded' && project.status !== 'in-progress') {
      return res.status(400).json({ message: 'Project must be "awarded" or "in-progress" to complete.' });
    }

    project.status = 'completed';
    project.completedAt = new Date();
    if (actualCostLKR) project.actualCostLKR = Number(actualCostLKR);
    await project.save();

    // Issue #8: Increment the awarded provider's completedProjects count
    if (project.awardedProvider) {
      await User.findByIdAndUpdate(project.awardedProvider, {
        $inc: { completedProjects: 1 },
      });
    }

    res.status(200).json({ message: 'Project marked as completed.', project });
  } catch (error) {
    console.error('❌ [completeProject] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Provider accepts the awarded contract → status: awarded → in-progress
// @route   PUT /api/projects/:id/accept
// @access  Private (Provider — must be the awardedProvider)
const acceptContract = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'email companyName')
      .populate('awardedProvider', 'email companyName');
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!project.awardedProvider || project.awardedProvider._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the awarded provider can accept this contract.' });
    }
    if (project.status !== 'awarded') {
      return res.status(400).json({ message: `Cannot accept — project status is "${project.status}".` });
    }

    project.status = 'in-progress';
    project.contractAcceptedAt = new Date();
    await project.save();

    // Notify the client via socket
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('contract_accepted', {
        projectId: project._id.toString(),
        provider: {
          _id: project.awardedProvider._id,
          companyName: project.awardedProvider.companyName,
          email: project.awardedProvider.email,
        },
        acceptedAt: project.contractAcceptedAt,
      });
    }

    res.status(200).json({ message: 'Contract accepted. Project is now in progress.', project });
  } catch (error) {
    console.error('❌ [acceptContract] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Provider adds a milestone to the project
// @route   POST /api/projects/:id/milestones
// @access  Private (Provider — must be the awardedProvider)
const addMilestone = async (req, res) => {
  try {
    const { title, description, dueDate, providerNote } = req.body;
    if (!title) return res.status(400).json({ message: 'Milestone title is required.' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!project.awardedProvider || project.awardedProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the awarded provider can add milestones.' });
    }
    if (!['in-progress', 'awarded'].includes(project.status)) {
      return res.status(400).json({ message: 'Milestones can only be added to in-progress projects.' });
    }

    const milestone = {
      title,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      providerNote: providerNote || '',
      status: 'submitted',
      submittedAt: new Date(),
    };
    project.milestones.push(milestone);
    await project.save();

    const newMilestone = project.milestones[project.milestones.length - 1];

    // Notify client via socket
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('milestone_submitted', {
        projectId: project._id.toString(),
        milestone: newMilestone,
      });
    }

    res.status(201).json({ message: 'Milestone submitted for client review.', milestone: newMilestone, project });
  } catch (error) {
    console.error('❌ [addMilestone] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Client approves a submitted milestone
// @route   PUT /api/projects/:id/milestones/:milestoneId/approve
// @access  Private (Client — project owner only)
const approveMilestone = async (req, res) => {
  try {
    const { clientNote } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can approve milestones.' });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found.' });
    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted milestones can be approved.' });
    }

    milestone.status = 'approved';
    milestone.approvedAt = new Date();
    milestone.clientNote = clientNote || '';
    await project.save();

    // Notify provider via socket
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('milestone_approved', {
        projectId: project._id.toString(),
        milestoneId: milestone._id.toString(),
        milestoneTitle: milestone.title,
        clientNote: milestone.clientNote,
        approvedAt: milestone.approvedAt,
      });
    }

    res.status(200).json({ message: 'Milestone approved.', milestone, project });
  } catch (error) {
    console.error('❌ [approveMilestone] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Client submits a star review after project completion
// @route   POST /api/projects/:id/review
// @access  Private (Client — project owner only)
const submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can leave a review.' });
    }
    if (project.status !== 'completed') {
      return res.status(400).json({ message: 'Reviews can only be left on completed projects.' });
    }
    if (project.clientReview?.rating) {
      return res.status(400).json({ message: 'You have already reviewed this project.' });
    }

    project.clientReview = { rating: Number(rating), comment: comment || '', createdAt: new Date() };
    await project.save();

    // Update provider's average rating on their User record
    if (project.awardedProvider) {
      const allReviewed = await Project.find({
        awardedProvider: project.awardedProvider,
        'clientReview.rating': { $exists: true },
      }).select('clientReview.rating');

      const avg = allReviewed.reduce((sum, p) => sum + p.clientReview.rating, 0) / allReviewed.length;
      await User.findByIdAndUpdate(project.awardedProvider, {
        averageRating: Math.round(avg * 10) / 10,
        reviewCount: allReviewed.length,
      });
    }

    // Notify provider via socket
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('project_reviewed', {
        projectId: project._id.toString(),
        rating,
        comment: comment || '',
      });
    }

    res.status(201).json({ message: 'Review submitted. Thank you!', project });
  } catch (error) {
    console.error('❌ [submitReview] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Provider: get all projects they have won (awarded/in-progress/completed)
// @route   GET /api/projects/won
// @access  Private (Provider only)
const getWonProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      awardedProvider: req.user._id,
      status: { $in: ['awarded', 'in-progress', 'completed'] },
    })
      .populate('client', 'email companyName')
      .sort({ awardedAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('❌ [getWonProjects] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get ALL projects across all clients (admin view)
// @route   GET /api/projects/all
// @access  Private (Admin only)
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('client', 'email companyName')
      .sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('❌ [getAllProjects] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update project status (admin only)
// @route   PUT /api/projects/:id/status
// @access  Private (Admin)
const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.status(200).json(project);
  } catch (error) {
    console.error('❌ [updateProjectStatus] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private (All authenticated users)
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'email companyName')
      .populate('invitedProviders', 'email companyName')
      .populate('awardedProvider', 'email companyName');

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    res.status(200).json(project);
  } catch (error) {
    console.error('❌ [getProjectById] Error:', error.message);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all open projects for providers
// @route   GET /api/projects/open
// @access  Private (Provider only)
const getOpenProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: 'open' })
      .populate('client', 'email companyName')
      .sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('❌ [getOpenProjects] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMyProjects, createProject, getAllProjects,
  updateProjectStatus, getProjectById, getOpenProjects,
  awardProject, completeProject,
  acceptContract, addMilestone, approveMilestone, submitReview, getWonProjects,
};

