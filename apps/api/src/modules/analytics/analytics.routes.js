const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { validate } = require('../../common/middleware/validate');
const { authenticate, requireRestaurantOwner } = require('../../common/middleware/auth.middleware');
const { rateLimiters } = require('../../common/middleware/rate-limiter');
const {
  restaurantIdParamSchema,
  reelIdParamSchema,
  periodQuerySchema
} = require('./analytics.validation');

// All routes require authentication and restaurant owner role
router.use(authenticate);
router.use(requireRestaurantOwner);
router.use(rateLimiters.default);

// GET /api/v1/analytics/restaurant/:id
router.get(
  '/restaurant/:id',
  validate({ params: restaurantIdParamSchema, query: periodQuerySchema }),
  analyticsController.getRestaurantAnalytics
);

// GET /api/v1/analytics/reels/:id
router.get(
  '/reels/:id',
  validate({ params: reelIdParamSchema }),
  analyticsController.getReelAnalytics
);

module.exports = router;