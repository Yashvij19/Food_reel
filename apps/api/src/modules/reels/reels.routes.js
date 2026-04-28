const express = require('express');
const router = express.Router();
const reelsController = require('./reels.controller');
const { validate } = require('../../common/middleware/validate');
const { authenticate, optionalAuth, requireRestaurantOwner } = require('../../common/middleware/auth.middleware');
const { rateLimiters } = require('../../common/middleware/rate-limiter');
const {
  createReelSchema,
  reelIdParamSchema,
  viewReelSchema,
  feedQuerySchema
} = require('./reels.validation');

// GET /api/v1/reels/feed
router.get(
  '/feed',
  rateLimiters.feed,
  optionalAuth,
  validate({ query: feedQuerySchema }),
  reelsController.getFeed
);

// POST /api/v1/reels
router.post(
  '/',
  authenticate,
  requireRestaurantOwner,
  rateLimiters.default,
  validate({ body: createReelSchema }),
  reelsController.createReel
);

// GET /api/v1/reels/:id
router.get(
  '/:id',
  optionalAuth,
  rateLimiters.default,
  validate({ params: reelIdParamSchema }),
  reelsController.getReel
);

// DELETE /api/v1/reels/:id
router.delete(
  '/:id',
  authenticate,
  requireRestaurantOwner,
  rateLimiters.default,
  validate({ params: reelIdParamSchema }),
  reelsController.deleteReel
);

// POST /api/v1/reels/:id/view
router.post(
  '/:id/view',
  authenticate,
  rateLimiters.views,
  validate({ params: reelIdParamSchema, body: viewReelSchema }),
  reelsController.recordView
);

module.exports = router;