const express = require('express');
const router = express.Router();
const interactionsController = require('./interactions.controller');
const { validate } = require('../../common/middleware/validate');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { rateLimiters } = require('../../common/middleware/rate-limiter');
const {
  reelIdParamSchema,
  restaurantIdParamSchema,
  commentIdParamSchema,
  createCommentSchema,
  paginationSchema
} = require('./interactions.validation');

// All routes require authentication
router.use(authenticate);
router.use(rateLimiters.default);

// POST /api/v1/reels/:id/like
router.post(
  '/reels/:id/like',
  validate({ params: reelIdParamSchema }),
  interactionsController.toggleLike
);

// DELETE /api/v1/reels/:id/like (same as POST - toggle)
router.delete(
  '/reels/:id/like',
  validate({ params: reelIdParamSchema }),
  interactionsController.toggleLike
);

// POST /api/v1/reels/:id/save
router.post(
  '/reels/:id/save',
  validate({ params: reelIdParamSchema }),
  interactionsController.toggleSave
);

// GET /api/v1/reels/:id/comments
router.get(
  '/reels/:id/comments',
  validate({ params: reelIdParamSchema, query: paginationSchema }),
  interactionsController.getComments
);

// POST /api/v1/reels/:id/comments
router.post(
  '/reels/:id/comments',
  validate({ params: reelIdParamSchema, body: createCommentSchema }),
  interactionsController.createComment
);

// DELETE /api/v1/reels/:id/comments/:commentId
router.delete(
  '/reels/:id/comments/:commentId',
  validate({ params: commentIdParamSchema }),
  interactionsController.deleteComment
);

// POST /api/v1/restaurants/:id/follow
router.post(
  '/restaurants/:id/follow',
  validate({ params: restaurantIdParamSchema }),
  interactionsController.toggleFollow
);

module.exports = router;