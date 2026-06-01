const User = require('../models/User');

// @desc    Get all software providers
// @route   GET /api/users/providers
// @access  Private
const getProviders = async (req, res) => {
  try {
    // Find all users with role 'provider' and select only safe public fields
    const providers = await User.find({ role: 'provider' })
      .select('_id email portfolioUrl yearsExperience isVerified createdAt')
      .sort({ createdAt: -1 });
      
    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProviders
};
