const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Issue #5: Include tokenVersion in JWT payload
 * Reduced expiry from 30d to 24h for security
 */
const generateToken = (id, role, tokenVersion) => {
  return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

// @desc    Register a new user (client or provider)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, role, companyName, portfolioUrl, yearsExperience } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }

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

    const user = await User.create({
      email,
      password,
      role,
      companyName: role === 'client' ? companyName : undefined,
      portfolioUrl: role === 'provider' ? portfolioUrl : undefined,
      yearsExperience: role === 'provider' ? yearsExperience : undefined,
      isVerified: role === 'client' ? true : false,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id, user.role, user.tokenVersion),
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

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id, user.role, user.tokenVersion),
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
