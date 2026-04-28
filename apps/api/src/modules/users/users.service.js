const { query, transaction } = require('../../database/db');
const { NotFoundError } = require('../../common/middleware/error-handler');

/**
 * Get user profile with stats
 */
const getProfile = async (userId) => {
  // Get user basic info
  const userResult = await query(
    `SELECT id, name, email, phone, role, avatar_url, created_at
     FROM users WHERE id = \$1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  // Get counts in parallel
  const [savedCount, orderCount, followingCount] = await Promise.all([
    query('SELECT COUNT(*) FROM saves WHERE user_id = \$1', [userId]),
    query('SELECT COUNT(*) FROM orders WHERE user_id = \$1', [userId]),
    query('SELECT COUNT(*) FROM follows WHERE user_id = \$1', [userId])
  ]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    stats: {
      savedReels: parseInt(savedCount.rows[0].count),
      orders: parseInt(orderCount.rows[0].count),
      followingRestaurants: parseInt(followingCount.rows[0].count)
    }
  };
};

/**
 * Update user profile
 */
const updateProfile = async (userId, data) => {
  const { name, phone, avatarUrl } = data;

  const updates = [];
  const values = [];
  let paramCount = 0;

  if (name !== undefined) {
    paramCount++;
    updates.push(`name = 
$$
{paramCount}`);
    values.push(name);
  }

  if (phone !== undefined) {
    paramCount++;
    updates.push(`phone =
$$
{paramCount}`);
    values.push(phone);
  }

  if (avatarUrl !== undefined) {
    paramCount++;
    updates.push(`avatar_url = 
$$
{paramCount}`);
    values.push(avatarUrl);
  }

  if (updates.length === 0) {
    return getProfile(userId);
  }

  paramCount++;
  values.push(userId);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')}
     WHERE id =
$$
{paramCount}
     RETURNING id, name, email, phone, role, avatar_url, created_at`,
    values
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

/**
 * Get user's saved reels
 */
const getSavedReels = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [reelsResult, countResult] = await Promise.all([
    query(
      `SELECT r.*, 
              res.name as restaurant_name,
              res.logo_url as restaurant_logo,
              fi.name as food_item_name,
              fi.price as food_item_price,
              fi.is_veg as food_item_is_veg,
              s.created_at as saved_at
       FROM saves s
       JOIN reels r ON s.reel_id = r.id
       JOIN restaurants res ON r.restaurant_id = res.id
       LEFT JOIN food_items fi ON r.food_item_id = fi.id
       WHERE s.user_id = \$1 AND r.is_active = true
       ORDER BY s.created_at DESC
       LIMIT \$2 OFFSET \$3`,
      [userId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) FROM saves s
       JOIN reels r ON s.reel_id = r.id
       WHERE s.user_id = \$1 AND r.is_active = true`,
      [userId]
    )
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    reels: reelsResult.rows.map(row => ({
      id: row.id,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      caption: row.caption,
      viewsCount: row.views_count,
      likesCount: row.likes_count,
      commentsCount: row.comments_count,
      createdAt: row.created_at,
      savedAt: row.saved_at,
      restaurant: {
        id: row.restaurant_id,
        name: row.restaurant_name,
        logoUrl: row.restaurant_logo
      },
      foodItem: row.food_item_id ? {
        id: row.food_item_id,
        name: row.food_item_name,
        price: parseFloat(row.food_item_price),
        isVeg: row.food_item_is_veg
      } : null
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user's addresses
 */
const getAddresses = async (userId) => {
  const result = await query(
    `SELECT id, label, full_address, lat, lng, is_default, created_at
     FROM addresses
     WHERE user_id = \$1
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    id: row.id,
    label: row.label,
    fullAddress: row.full_address,
    lat: row.lat ? parseFloat(row.lat) : null,
    lng: row.lng ? parseFloat(row.lng) : null,
    isDefault: row.is_default,
    createdAt: row.created_at
  }));
};

/**
 * Create new address
 */
const createAddress = async (userId, data) => {
  const { label, fullAddress, lat, lng, isDefault } = data;

  return transaction(async (client) => {
    // If this is set as default, unset other defaults
    if (isDefault) {
      await client.query(
        `UPDATE addresses SET is_default = false WHERE user_id = \$1`,
        [userId]
      );
    }

    const result = await client.query(
      `INSERT INTO addresses (user_id, label, full_address, lat, lng, is_default)
       VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
       RETURNING id, label, full_address, lat, lng, is_default, created_at`,
      [userId, label, fullAddress, lat, lng, isDefault]
    );

    const address = result.rows[0];

    return {
      id: address.id,
      label: address.label,
      fullAddress: address.full_address,
      lat: address.lat ? parseFloat(address.lat) : null,
      lng: address.lng ? parseFloat(address.lng) : null,
      isDefault: address.is_default,
      createdAt: address.created_at
    };
  });
};

/**
 * Update address
 */
const updateAddress = async (userId, addressId, data) => {
  const { label, fullAddress, lat, lng, isDefault } = data;

  return transaction(async (client) => {
    // Verify ownership
    const existing = await client.query(
      `SELECT id FROM addresses WHERE id = \$1 AND user_id = \$2`,
      [addressId, userId]
    );

    if (existing.rows.length === 0) {
      throw new NotFoundError('Address not found');
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await client.query(
        `UPDATE addresses SET is_default = false WHERE user_id = \$1 AND id != \$2`,
        [userId, addressId]
      );
    }

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (label !== undefined) {
      paramCount++;
      updates.push(`label = 
$$
{paramCount}`);
      values.push(label);
    }

    if (fullAddress !== undefined) {
      paramCount++;
      updates.push(`full_address =
$$
{paramCount}`);
      values.push(fullAddress);
    }

    if (lat !== undefined) {
      paramCount++;
      updates.push(`lat = 
$$
{paramCount}`);
      values.push(lat);
    }

    if (lng !== undefined) {
      paramCount++;
      updates.push(`lng =
$$
{paramCount}`);
      values.push(lng);
    }

    if (isDefault !== undefined) {
      paramCount++;
      updates.push(`is_default = $${paramCount}`);
      values.push(isDefault);
    }

    if (updates.length === 0) {
      // Return existing address if no updates
      const current = await client.query(
        `SELECT id, label, full_address, lat, lng, is_default, created_at
         FROM addresses WHERE id = \$1`,
        [addressId]
      );
      const row = current.rows[0];
      return {
        id: row.id,
        label: row.label,
        fullAddress: row.full_address,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        isDefault: row.is_default,
        createdAt: row.created_at
      };
    }

    paramCount++;
    values.push(addressId);

    const result = await client.query(
      `UPDATE addresses SET ${updates.join(', ')}
       WHERE id = 
$$
{paramCount}
       RETURNING id, label, full_address, lat, lng, is_default, created_at`,
      values
    );

    const address = result.rows[0];

    return {
      id: address.id,
      label: address.label,
      fullAddress: address.full_address,
      lat: address.lat ? parseFloat(address.lat) : null,
      lng: address.lng ? parseFloat(address.lng) : null,
      isDefault: address.is_default,
      createdAt: address.created_at
    };
  });
};

/**
 * Delete address
 */
const deleteAddress = async (userId, addressId) => {
  const result = await query(
    `DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id`,
    [addressId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Address not found');
  }

  return { deleted: true };
};

/**
 * Get followed restaurants
 */
const getFollowedRestaurants = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [restaurantsResult, countResult] = await Promise.all([
    query(
      `SELECT r.id, r.name, r.description, r.category, r.logo_url, r.cover_url,
              f.created_at as followed_at,
              (SELECT COUNT(*) FROM follows WHERE restaurant_id = r.id) as followers_count,
              (SELECT COUNT(*) FROM reels WHERE restaurant_id = r.id AND is_active = true) as reels_count
       FROM follows f
       JOIN restaurants r ON f.restaurant_id = r.id
       WHERE f.user_id = $1 AND r.is_active = true
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) FROM follows f
       JOIN restaurants r ON f.restaurant_id = r.id
       WHERE f.user_id = $1 AND r.is_active = true`,
      [userId]
    )
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    restaurants: restaurantsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      logoUrl: row.logo_url,
      coverUrl: row.cover_url,
      followedAt: row.followed_at,
      followersCount: parseInt(row.followers_count),
      reelsCount: parseInt(row.reels_count)
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getProfile,
  updateProfile,
  getSavedReels,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getFollowedRestaurants
};