const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (client or provider)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, role, companyName, portfolioUrl, yearsExperience } = req.body;

    // Validate generic required fields
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Role-specific validation
    if (role === 'client' && !companyName) {
      return res.status(400).json({ message: 'Clients must provide a company name.' });
    }
    if (role === 'provider' && (!portfolioUrl || !yearsExperience)) {
      return res.status(400).json({ message: 'Providers must supply portfolio URL and years of experience.' });
    }

    // Create user
    const user = await User.create({
      email,
      password, // Will be hashed by the pre-save hook
      role,
      companyName: role === 'client' ? companyName : undefined,
      portfolioUrl: role === 'provider' ? portfolioUrl : undefined,
      yearsExperience: role === 'provider' ? yearsExperience : undefined,
      isVerified: role === 'client' ? true : false, // Clients are auto-verified, providers need admin approval
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    console.error('❌ [register] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Check password
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('❌ [login] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
