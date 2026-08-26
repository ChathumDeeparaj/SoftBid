const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

/**
 * Auth rate limiter — 10 attempts per 15 minutes per IP
 * Prevents brute-force login attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

/**
 * Bid rate limiter — 5 bid submissions per minute per IP
 * Prevents TOPSIS engine spam
 */
const bidLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many bid submissions. Please wait a moment.' },
});

module.exports = { generalLimiter, authLimiter, bidLimiter };
