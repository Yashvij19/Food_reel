const { cache } = require('../../cache/redis');
const { RateLimitError } = require('./error-handler');

/**
 * Create rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per window
 * @param {string} options.keyPrefix - Redis key prefix
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute
    max = 100,
    keyPrefix = 'rate'
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    try {
      // Use IP + user ID (if authenticated) as key
      const identifier = req.user?.id || req.ip;
      const key = `${keyPrefix}:${identifier}:${req.path}`;

      const current = await cache.incr(key, windowSeconds);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        throw new RateLimitError('Too many requests, please try again later');
      }

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        next(error);
      } else {
        // If Redis fails, allow the request
        next();
      }
    }
  };
};

// Pre-configured rate limiters
const rateLimiters = {
  // Auth endpoints - strict
  auth: createRateLimiter({
    windowMs: 60000,
    max: 5,
    keyPrefix: 'rate:auth'
  }),

  // Register - very strict
  register: createRateLimiter({
    windowMs: 60000,
    max: 3,
    keyPrefix: 'rate:register'
  }),

  // Orders - moderate
  orders: createRateLimiter({
    windowMs: 60000,
    max: 10,
    keyPrefix: 'rate:orders'
  }),

  // View events - high frequency allowed
  views: createRateLimiter({
    windowMs: 60000,
    max: 60,
    keyPrefix: 'rate:views'
  }),

  // Feed - moderate
  feed: createRateLimiter({
    windowMs: 60000,
    max: 60,
    keyPrefix: 'rate:feed'
  }),

  // Default - generous
  default: createRateLimiter({
    windowMs: 60000,
    max: 120,
    keyPrefix: 'rate:default'
  })
};

module.exports = {
  createRateLimiter,
  rateLimiters
};