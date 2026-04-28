const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { validate } = require('../../common/middleware/validate');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { rateLimiters } = require('../../common/middleware/rate-limiter');
const {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
  paginationSchema
} = require('./users.validation');

// All routes require authentication
router.use(authenticate);
router.use(rateLimiters.default);

// GET /api/v1/users/profile
router.get('/profile', usersController.getProfile);

// PATCH /api/v1/users/profile
router.patch(
  '/profile',
  validate({ body: updateProfileSchema }),
  usersController.updateProfile
);

// GET /api/v1/users/saved-reels
router.get(
  '/saved-reels',
  validate({ query: paginationSchema }),
  usersController.getSavedReels
);

// GET /api/v1/users/following
router.get(
  '/following',
  validate({ query: paginationSchema }),
  usersController.getFollowedRestaurants
);

// GET /api/v1/users/addresses
router.get('/addresses', usersController.getAddresses);

// POST /api/v1/users/addresses
router.post(
  '/addresses',
  validate({ body: createAddressSchema }),
  usersController.createAddress
);

// PATCH /api/v1/users/addresses/:id
router.patch(
  '/addresses/:id',
  validate({ params: addressIdParamSchema, body: updateAddressSchema }),
  usersController.updateAddress
);

// DELETE /api/v1/users/addresses/:id
router.delete(
  '/addresses/:id',
  validate({ params: addressIdParamSchema }),
  usersController.deleteAddress
);

module.exports = router;