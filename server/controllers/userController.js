const User = require('../models/User');
const Review = require('../models/Review');
const Project = require('../models/Project');

// @desc    Get all software providers
// @route   GET /api/users/providers
// @access  Private
const getProviders = async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider' })
      .select('_id email portfolioUrl yearsExperience isVerified createdAt companyName description skills feedbackScore successRate completedProjects')
      .sort({ createdAt: -1 });

    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single software provider by ID
// @route   GET /api/users/providers/:id
// @access  Private
const getProviderById = async (req, res) => {
  try {
    const provider = await User.findById(req.params.id)
      .select('-password -isSuperAdmin -role')
      .lean();

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.status(200).json(provider);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a software provider's profile
// @route   PUT /api/users/providers/:id
// @access  Private (Owner only)
const updateProviderProfile = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { description, skills, portfolioUrl, country, avgResponseTime, lastDelivery } = req.body;

    const provider = await User.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (description !== undefined) provider.description = description;
    if (skills !== undefined) provider.skills = skills;
    if (portfolioUrl !== undefined) provider.portfolioUrl = portfolioUrl;
    if (country !== undefined) provider.country = country;
    if (avgResponseTime !== undefined) provider.avgResponseTime = avgResponseTime;
    if (lastDelivery !== undefined) provider.lastDelivery = lastDelivery;

    await provider.save();

    res.status(200).json(provider);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a review for a provider
// @route   POST /api/users/providers/:id/reviews
// @access  Private (Client only)
const addReview = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can leave reviews' });
    }

    const providerId = req.params.id;
    const { rating, comment, projectId } = req.body;

    // ── Issue #1: Validate all required fields including projectId ──
    if (!rating || !comment || !projectId) {
      return res.status(400).json({ message: 'Rating, comment, and projectId are required.' });
    }

    const provider = await User.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // ── Issue #1: Validate the project exists and is completed ──
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    if (project.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review a provider after the project is completed.' });
    }
    // Verify the reviewer is the actual project client
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review providers on your own projects.' });
    }
    // Verify the provider being reviewed was actually awarded this project
    if (!project.awardedProvider || project.awardedProvider.toString() !== providerId) {
      return res.status(400).json({ message: 'This provider was not awarded this project.' });
    }

    // ── Issue #1: Check for duplicate review (compound index will also enforce this) ──
    const existingReview = await Review.findOne({
      provider: providerId, client: req.user._id, project: projectId,
    });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this provider for this project.' });
    }

    // Create the review
    const review = await Review.create({
      provider: providerId,
      client: req.user._id,
      project: projectId,
      rating: Number(rating),
      comment,
    });

    // ── Issue #8: Only update feedback metrics, NOT completedProjects ──
    // completedProjects is now incremented in completeProject controller
    const allReviews = await Review.find({ provider: providerId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const goodReviews = allReviews.filter(r => r.rating >= 4).length;

    provider.feedbackScore = parseFloat((totalRating / allReviews.length).toFixed(2));
    provider.successRate = Math.round((goodReviews / allReviews.length) * 100);
    await provider.save();

    res.status(201).json(review);
  } catch (error) {
    // Handle duplicate key error from compound index
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this provider for this project.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reviews for a provider
// @route   GET /api/users/providers/:id/reviews
// @access  Public or Private
const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.id })
      .populate('client', 'email companyName')
      .populate('project', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProviders,
  getProviderById,
  updateProviderProfile,
  addReview,
  getProviderReviews,
};
