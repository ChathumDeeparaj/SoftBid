const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc  Protect routes — verify JWT and attach user to req
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found.' });
    }

    // Issue #5: Reject tokens with stale tokenVersion
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'Token has been invalidated. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed.' });
  }
};

/**
 * @desc  Role guard — restrict to specific roles
 */
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden. Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
};

/**
 * @desc  Super admin guard — requires role=admin AND isSuperAdmin=true
 */
const superAdminGuard = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin' || !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Forbidden. Super Admin access required.' });
  }
  next();
};

module.exports = { protect, roleGuard, superAdminGuard };
