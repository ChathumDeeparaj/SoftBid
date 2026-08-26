/**
 * Issue #15: NoSQL Injection Sanitizer
 * Replaces express-mongo-sanitize (incompatible with Express 5 getter-only req.query).
 * Recursively removes MongoDB operator keys ($, .) from req.body and req.params.
 * Does NOT attempt to modify req.query (read-only in Express 5).
 */

const FORBIDDEN_KEYS_RE = /^\$|\.+/;

const sanitizeValue = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeValue);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      if (!FORBIDDEN_KEYS_RE.test(key)) {
        cleaned[key] = sanitizeValue(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
};

const mongoSanitize = () => (req, res, next) => {
  if (req.body)   req.body   = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  // req.query is getter-only in Express 5 — skip it
  next();
};

module.exports = mongoSanitize;
