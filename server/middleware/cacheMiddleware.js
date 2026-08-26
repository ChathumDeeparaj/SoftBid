const { getRedisClient } = require('../config/redis');

/**
 * Issue #16: Redis Cache Middleware
 * Generic cache middleware that checks Redis before hitting the DB.
 * Falls back gracefully if Redis is not connected.
 *
 * @param {string|Function} keyOrFn - Cache key string or function(req) => string
 * @param {number} ttlSeconds - Time-to-live in seconds
 */
const cache = (keyOrFn, ttlSeconds = 120) => {
  return async (req, res, next) => {
    const client = getRedisClient();
    if (!client || !client.isReady) return next(); // Graceful fallback

    const key = typeof keyOrFn === 'function' ? keyOrFn(req) : keyOrFn;

    try {
      const cached = await client.get(key);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('[Cache] Read error:', err.message);
      return next(); // On error, skip cache
    }

    // Intercept res.json to store result in cache
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        client.setEx(key, ttlSeconds, JSON.stringify(data)).catch(() => {});
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Invalidate a specific cache key
 */
const invalidateCache = async (key) => {
  const client = getRedisClient();
  if (!client || !client.isReady) return;
  try {
    await client.del(key);
  } catch (err) {
    console.error('[Cache] Invalidation error:', err.message);
  }
};

/**
 * Invalidate all keys matching a pattern
 */
const invalidateCachePattern = async (pattern) => {
  const client = getRedisClient();
  if (!client || !client.isReady) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (err) {
    console.error('[Cache] Pattern invalidation error:', err.message);
  }
};

module.exports = { cache, invalidateCache, invalidateCachePattern };
