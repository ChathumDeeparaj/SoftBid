const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

// Role guard middleware generator
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden. Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
};

// Super admin guard - requires role=admin AND isSuperAdmin=true
const superAdminGuard = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin' || !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Forbidden. Super Admin access required.' });
  }
  next();
};

module.exports = { protect, roleGuard, superAdminGuard };
