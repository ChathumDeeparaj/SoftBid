const Project = require('../models/Project');
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
      invitedProviders
    } = req.body;

    if (!title || !description || !clientBudgetLKR) {
      return res.status(400).json({ message: 'Title, description, and budget are required.' });
    }

    if (invitedProviders && Array.isArray(invitedProviders) && invitedProviders.length > 5) {
      return res.status(400).json({ message: 'You can only invite up to 5 favorite service providers.' });
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
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('❌ [createProject] Error:', error.message);
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

module.exports = { getMyProjects, createProject, getAllProjects, updateProjectStatus };
