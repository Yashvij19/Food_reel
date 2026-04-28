const authService = require('./auth.service');
const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Get token from header to decode expiry
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token);
    
    await authService.logout(req.user.jti, decoded.exp);
    
    res.json({
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 */
const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    
    res.json({
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  me
};