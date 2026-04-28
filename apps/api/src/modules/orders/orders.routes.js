const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { validate } = require('../../common/middleware/validate');
const { authenticate, requireRestaurantOwner } = require('../../common/middleware/auth.middleware');
const { rateLimiters } = require('../../common/middleware/rate-limiter');
const {
  createOrderSchema,
  orderIdParamSchema,
  updateAddressSchema,
  updateStatusSchema,
  paginationSchema
} = require('./orders.validation');

// All routes require authentication
router.use(authenticate);

// POST /api/v1/orders
router.post(
  '/',
  rateLimiters.orders,
  validate({ body: createOrderSchema }),
  ordersController.createOrder
);

// GET /api/v1/orders/history
router.get(
  '/history',
  rateLimiters.default,
  validate({ query: paginationSchema }),
  ordersController.getOrderHistory
);

// GET /api/v1/orders/restaurant/:restaurantId
router.get(
  '/restaurant/:restaurantId',
  requireRestaurantOwner,
  rateLimiters.default,
  validate({ query: paginationSchema }),
  ordersController.getRestaurantOrders
);

// GET /api/v1/orders/:id
router.get(
  '/:id',
  rateLimiters.default,
  validate({ params: orderIdParamSchema }),
  ordersController.getOrder
);

// PATCH /api/v1/orders/:id/address
router.patch(
  '/:id/address',
  rateLimiters.default,
  validate({ params: orderIdParamSchema, body: updateAddressSchema }),
  ordersController.updateAddress
);

// PATCH /api/v1/orders/:id/status
router.patch(
  '/:id/status',
  requireRestaurantOwner,
  rateLimiters.default,
  validate({ params: orderIdParamSchema, body: updateStatusSchema }),
  ordersController.updateStatus
);

// POST /api/v1/orders/:id/payment-confirm
router.post(
  '/:id/payment-confirm',
  rateLimiters.default,
  validate({ params: orderIdParamSchema }),
  ordersController.confirmPayment
);

module.exports = router;