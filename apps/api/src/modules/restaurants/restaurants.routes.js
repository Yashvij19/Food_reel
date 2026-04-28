const express = require('express');
const router = express.Router();
const restaurantsController = require('./restaurants.controller');
const { validate } = require('../../common/middleware/validate');
const { authenticate, optionalAuth, requireRestaurantOwner } = require('../../common/middleware/auth.middleware');
const { rateLimiters } = require('../../common/middleware/rate-limiter');
const {
  createRestaurantSchema,
  updateRestaurantSchema,
  restaurantIdParamSchema,
  createFoodItemSchema,
  updateFoodItemSchema,
  foodItemIdParamSchema,
  searchQuerySchema
} = require('./restaurants.validation');

router.use(rateLimiters.default);

// GET /api/v1/restaurants/search
router.get(
  '/search',
  validate({ query: searchQuerySchema }),
  restaurantsController.searchRestaurants
);

// GET /api/v1/restaurants/my - Get current user's restaurants
router.get(
  '/my',
  authenticate,
  requireRestaurantOwner,
  restaurantsController.getMyRestaurants
);

// POST /api/v1/restaurants
router.post(
  '/',
  authenticate,
  requireRestaurantOwner,
  validate({ body: createRestaurantSchema }),
  restaurantsController.createRestaurant
);

// GET /api/v1/restaurants/:id
router.get(
  '/:id',
  optionalAuth,
  validate({ params: restaurantIdParamSchema }),
  restaurantsController.getRestaurant
);

// PATCH /api/v1/restaurants/:id
router.patch(
  '/:id',
  authenticate,
  requireRestaurantOwner,
  validate({ params: restaurantIdParamSchema, body: updateRestaurantSchema }),
  restaurantsController.updateRestaurant
);

// GET /api/v1/restaurants/:id/menu
router.get(
  '/:id/menu',
  validate({ params: restaurantIdParamSchema }),
  restaurantsController.getMenu
);

// POST /api/v1/restaurants/:id/menu
router.post(
  '/:id/menu',
  authenticate,
  requireRestaurantOwner,
  validate({ params: restaurantIdParamSchema, body: createFoodItemSchema }),
  restaurantsController.addMenuItem
);

// PATCH /api/v1/restaurants/:id/menu/:itemId
router.patch(
  '/:id/menu/:itemId',
  authenticate,
  requireRestaurantOwner,
  validate({ params: foodItemIdParamSchema, body: updateFoodItemSchema }),
  restaurantsController.updateMenuItem
);

// DELETE /api/v1/restaurants/:id/menu/:itemId
router.delete(
  '/:id/menu/:itemId',
  authenticate,
  requireRestaurantOwner,
  validate({ params: foodItemIdParamSchema }),
  restaurantsController.deleteMenuItem
);

module.exports = router;