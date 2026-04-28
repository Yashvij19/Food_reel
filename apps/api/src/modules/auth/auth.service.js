const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../../database/db');
const { cache } = require('../../cache/redis');
const config = require('../../config');
const { 
  AuthenticationError, 
  ConflictError, 
  NotFoundError 
} = require('../../common/middleware/error-handler');

const BCRYPT_ROUNDS = 12;

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  const jti = uuidv4();
  
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    jti
  };

  const token = jwt.sign(payload, config.jwt.privateKey, {
    algorithm: 'RS256',
    expiresIn: config.jwt.expiry
  });

  return { token, jti };
};

/**
 * Generate refresh token
 */
const generateRefreshToken = async (userId) => {
  const token = uuidv4();
  const tokenHash = await bcrypt.hash(token, 10);
  
  // Calculate expiry date
  const expiryDays = parseInt(config.jwt.refreshExpiry) || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // Store in database
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (\$1, \$2, \$3)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
};

/**
 * Register new user
 */
const register = async (userData) => {
  const { name, email, phone, password, role } = userData;

  // Check if email already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = \$1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const result = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES (\$1, \$2, \$3, \$4, \$5)
     RETURNING id, name, email, phone, role, avatar_url, created_at`,
    [name, email, phone, passwordHash, role]
  );

  const user = result.rows[0];

  // Create user preferences entry
  await query(
    `INSERT INTO user_preferences (user_id, liked_categories, disliked_categories)
     VALUES (\$1, \$2, \$3)`,
    [user.id, [], []]
  );

  // Generate tokens
  const { token, jti } = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    },
    token,
    refreshToken
  };
};

/**
 * Login user
 */
const login = async (email, password) => {
  // Find user
  const result = await query(
    `SELECT id, name, email, phone, password_hash, role, avatar_url, created_at
     FROM users WHERE email = \$1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AuthenticationError('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate tokens
  const { token, jti } = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    },
    token,
    refreshToken
  };
};

/**
 * Logout user (blacklist current token)
 */
const logout = async (jti, tokenExpiry) => {
  // Calculate remaining TTL for token
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(tokenExpiry - now, 0);

  if (ttl > 0) {
    // Add token to blacklist
    await cache.set(`jwt:blacklist:${jti}`, '1', ttl);
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  // Find all non-revoked, non-expired refresh tokens
  const result = await query(
    `SELECT id, user_id, token_hash, expires_at
     FROM refresh_tokens
     WHERE revoked_at IS NULL AND expires_at > NOW()`,
    []
  );

  // Find matching token
  let matchedToken = null;
  for (const row of result.rows) {
    const isMatch = await bcrypt.compare(refreshToken, row.token_hash);
    if (isMatch) {
      matchedToken = row;
      break;
    }
  }

  if (!matchedToken) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  // Get user
  const userResult = await query(
    `SELECT id, name, email, phone, role, avatar_url
     FROM users WHERE id = \$1`,
    [matchedToken.user_id]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  // Revoke old refresh token
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = \$1`,
    [matchedToken.id]
  );

  // Generate new tokens
  const { token } = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user.id);

  return {
    token,
    refreshToken: newRefreshToken
  };
};

/**
 * Get current user
 */
const getCurrentUser = async (userId) => {
  const result = await query(
    `SELECT id, name, email, phone, role, avatar_url, created_at
     FROM users WHERE id = \$1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at
  };
};

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser
};