const jwt = require('jsonwebtoken');
const config = require('../../config');
const { cache } = require('../../cache/redis');
const { AuthenticationError, AuthorizationError } = require('./error-handler');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwt.publicKey, {
      algorithms: ['RS256']
    });

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await cache.exists(`jwt:blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Attach user to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token has expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.publicKey, {
      algorithms: ['RS256']
    });

    const isBlacklisted = await cache.exists(`jwt:blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      req.user = null;
      return next();
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Require specific role(s)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Require restaurant owner role
 */
const requireRestaurantOwner = requireRole('restaurant_owner', 'admin');

/**
 * Require admin role
 */
const requireAdmin = requireRole('admin');

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireRestaurantOwner,
  requireAdmin
};