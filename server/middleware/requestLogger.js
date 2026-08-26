const logger = require('../config/logger');

/**
 * Issue #17: Request logging middleware
 * Logs every HTTP request with method, URL, status, response time, and user ID.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // After response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${duration}ms`,
      ip: req.ip,
    };

    // Attach user ID if authenticated
    if (req.user) {
      logData.userId = req.user._id;
      logData.userRole = req.user.role;
    }

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

module.exports = requestLogger;
