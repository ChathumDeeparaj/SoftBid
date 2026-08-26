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
      invitedProviders, auctionDurationDays, ahpWeights,
    } = req.body;

    if (!title || !description || !clientBudgetLKR) {
      return res.status(400).json({ message: 'Title, description, and budget are required.' });
    }

    if (invitedProviders && Array.isArray(invitedProviders) && invitedProviders.length > 5) {
      return res.status(400).json({ message: 'You can only invite up to 5 favorite service providers.' });
    }

    // Issue #3: Calculate auction end date (default 7 days)
    const durationDays = Number(auctionDurationDays) || 7;
    const auctionEndsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

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
};
