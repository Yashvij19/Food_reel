const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { validate } = require('../../common/middleware/validate');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { rateLimiters } = require('../../common/middleware/rate-limiter');
const { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema 
} = require('./auth.validation');

// POST /api/v1/auth/register
router.post(
  '/register',
  rateLimiters.register,
  validate({ body: registerSchema }),
  authController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  rateLimiters.auth,
  validate({ body: loginSchema }),
  authController.login
);

// POST /api/v1/auth/logout
router.post(
  '/logout',
  authenticate,
  authController.logout
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  rateLimiters.auth,
  validate({ body: refreshTokenSchema }),
  authController.refresh
);

// GET /api/v1/auth/me
router.get(
  '/me',
  authenticate,
  authController.me
);

module.exports = router;