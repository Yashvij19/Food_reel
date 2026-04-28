const { query, transaction } = require('../../database/db');
const { cache } = require('../../cache/redis');
const { NotFoundError, AuthorizationError } = require('../../common/middleware/error-handler');
const restaurantsService = require('../restaurants/restaurants.service');

/**
 * Create a new reel
 */
const createReel = async (uploaderId, data) => {
  const { restaurantId, foodItemId, videoUrl, thumbnailUrl, caption, durationMs } = data;

  // Verify ownership
  await restaurantsService.verifyOwnership(restaurantId, uploaderId);

  // Verify food item belongs to restaurant if provided
  if (foodItemId) {
    const itemResult = await query(
      `SELECT id FROM food_items WHERE id = \$1 AND restaurant_id = \$2`,
      [foodItemId, restaurantId]
    );

    if (itemResult.rows.length === 0) {
      throw new NotFoundError('Food item not found in this restaurant');
    }
  }

  const result = await query(
    `INSERT INTO reels 
     (restaurant_id, food_item_id, uploader_id, video_url, thumbnail_url, caption, duration_ms)
     VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7)
     RETURNING *`,
    [restaurantId, foodItemId, uploaderId, videoUrl, thumbnailUrl, caption, durationMs || 0]
  );

  return formatReel(result.rows[0]);
};

/**
 * Get reel by ID with details
 */
const getReelById = async (reelId, userId = null) => {
  const result = await query(
    `SELECT r.*,
            res.id as restaurant_id,
            res.name as restaurant_name,
            res.logo_url as restaurant_logo,
            res.category as restaurant_category,
            fi.id as food_item_id,
            fi.name as food_item_name,
            fi.price as food_item_price,
            fi.is_veg as food_item_is_veg,
            fi.image_url as food_item_image,
            fi.is_available as food_item_available,
            u.name as uploader_name
     FROM reels r
     JOIN restaurants res ON r.restaurant_id = res.id
     LEFT JOIN food_items fi ON r.food_item_id = fi.id
     JOIN users u ON r.uploader_id = u.id
     WHERE r.id = \$1`,
    [reelId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Reel not found');
  }

  const reel = result.rows[0];

  // Get interaction status if user is logged in
  let isLiked = false;
  let isSaved = false;
  let isFollowing = false;

  if (userId) {
    const [likeResult, saveResult, followResult] = await Promise.all([
      query(`SELECT id FROM likes WHERE user_id = \$1 AND reel_id = \$2`, [userId, reelId]),
      query(`SELECT id FROM saves WHERE user_id = \$1 AND reel_id = \$2`, [userId, reelId]),
      query(`SELECT id FROM follows WHERE user_id = \$1 AND restaurant_id = \$2`, [userId, reel.restaurant_id])
    ]);

    isLiked = likeResult.rows.length > 0;
    isSaved = saveResult.rows.length > 0;
    isFollowing = followResult.rows.length > 0;
  }

  // Get cached counts or use DB values
  const cachedLikes = await cache.getCounter(`reel:likes:${reelId}`);
  const cachedViews = await cache.getCounter(`reel:views:${reelId}`);

  return {
    id: reel.id,
    videoUrl: reel.video_url,
    thumbnailUrl: reel.thumbnail_url,
    caption: reel.caption,
    durationMs: reel.duration_ms,
    viewsCount: reel.views_count + cachedViews,
    likesCount: reel.likes_count + cachedLikes,
    commentsCount: reel.comments_count,
    createdAt: reel.created_at,
    restaurant: {
      id: reel.restaurant_id,
      name: reel.restaurant_name,
      logoUrl: reel.restaurant_logo,
      category: reel.restaurant_category,
      isFollowing
    },
    foodItem: reel.food_item_id ? {
      id: reel.food_item_id,
      name: reel.food_item_name,
      price: parseFloat(reel.food_item_price),
      isVeg: reel.food_item_is_veg,
      imageUrl: reel.food_item_image,
      isAvailable: reel.food_item_available
    } : null,
    uploader: {
      id: reel.uploader_id,
      name: reel.uploader_name
    },
    isLiked,
    isSaved
  };
};

/**
 * Delete reel
 */
const deleteReel = async (reelId, userId) => {
  // Verify ownership
  const reelResult = await query(
    `SELECT r.id, r.restaurant_id, res.owner_id
     FROM reels r
     JOIN restaurants res ON r.restaurant_id = res.id
     WHERE r.id = \$1`,
    [reelId]
  );

  if (reelResult.rows.length === 0) {
    throw new NotFoundError('Reel not found');
  }

  if (reelResult.rows[0].owner_id !== userId) {
    throw new AuthorizationError('You do not own this reel');
  }

  // Soft delete
  await query(
    `UPDATE reels SET is_active = false WHERE id = \$1`,
    [reelId]
  );

  // Clear cache
  await cache.del(`reel:likes:${reelId}`);
  await cache.del(`reel:views:${reelId}`);

  return { deleted: true };
};

/**
 * Record view event
 */
const recordView = async (reelId, userId, watchMs) => {
  // Increment view count in Redis
  await cache.incr(`reel:views:${reelId}`, 300); // 5 min TTL

  // Record watch event in database
  await query(
    `INSERT INTO watch_events (user_id, reel_id, watch_ms)
     VALUES (\$1, \$2, \$3)`,
    [userId, reelId, watchMs]
  );

  return { recorded: true };
};

/**
 * Get reels by restaurant
 */
const getReelsByRestaurant = async (restaurantId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [reelsResult, countResult] = await Promise.all([
    query(
      `SELECT r.*, fi.name as food_item_name, fi.price as food_item_price
       FROM reels r
       LEFT JOIN food_items fi ON r.food_item_id = fi.id
       WHERE r.restaurant_id = \$1 AND r.is_active = true
       ORDER BY r.created_at DESC
       LIMIT \$2 OFFSET \$3`,
      [restaurantId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) FROM reels WHERE restaurant_id = \$1 AND is_active = true`,
      [restaurantId]
    )
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    reels: reelsResult.rows.map(formatReel),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// Helper function
const formatReel = (row) => ({
  id: row.id,
  restaurantId: row.restaurant_id,
  foodItemId: row.food_item_id,
  uploaderId: row.uploader_id,
  videoUrl: row.video_url,
  thumbnailUrl: row.thumbnail_url,
  caption: row.caption,
  durationMs: row.duration_ms,
  viewsCount: row.views_count,
  likesCount: row.likes_count,
  commentsCount: row.comments_count,
  createdAt: row.created_at,
  foodItem: row.food_item_name ? {
    name: row.food_item_name,
    price: parseFloat(row.food_item_price)
  } : null
});

module.exports = {
  createReel,
  getReelById,
  deleteReel,
  recordView,
  getReelsByRestaurant
};