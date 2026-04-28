const Redis = require('ioredis');
const config = require('../config');
const logger = require('../common/logger/logger');

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
});

redis.on('connect', () => {
  logger.info('🔴 Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

// Connect to Redis
redis.connect().catch((err) => {
  logger.error('Failed to connect to Redis:', err);
});

// Cache helper functions
const cacheHelpers = {
  // Get cached value
  async get(key) {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  // Set cached value with TTL (in seconds)
  async set(key, value, ttlSeconds = 300) {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  // Delete cached value
  async del(key) {
    await redis.del(key);
  },

  // Increment counter
  async incr(key, ttlSeconds = 300) {
    const result = await redis.incr(key);
    if (result === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return result;
  },

  // Get counter value
  async getCounter(key) {
    const value = await redis.get(key);
    return value ? parseInt(value, 10) : 0;
  },

  // Add to set
  async sadd(key, member) {
    return redis.sadd(key, member);
  },

  // Check if member exists in set
  async sismember(key, member) {
    return redis.sismember(key, member);
  },

  // Get set members
  async smembers(key) {
    return redis.smembers(key);
  },

  // Set with expiry check
  async setWithExpiry(key, value, ttlSeconds) {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },

  // Check if key exists
  async exists(key) {
    return redis.exists(key);
  }
};

module.exports = {
  redis,
  cache: cacheHelpers
};