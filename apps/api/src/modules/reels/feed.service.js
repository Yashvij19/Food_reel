const { query } = require('../../database/db');
const { cache } = require('../../cache/redis');

const FEED_CACHE_TTL = 600; // 10 minutes
const FEED_SIZE = 50;

/**
 * Get personalized feed for user
 * Phase 1: Simple chronological feed with basic scoring
 */
const getFeed = async (userId, options = {}) => {
  const { page = 1, limit = 10, cursor } = options;

  // Try to get cached feed
  const cacheKey = `feed:${userId}`;
  let feedReelIds = await cache.get(cacheKey);

  if (!feedReelIds) {
    // Generate new feed
    feedReelIds = await generateFeed(userId);
    await cache.set(cacheKey, feedReelIds, FEED_CACHE_TTL);
  }

  // Paginate from cached feed
  const startIndex = cursor 
    ? feedReelIds.indexOf(cursor) + 1 
    : (page - 1) * limit;
  
  const paginatedIds = feedReelIds.slice(startIndex, startIndex + limit);

  if (paginatedIds.length === 0) {
    return { reels: [], meta: { page, limit, hasMore: false } };
  }

  // Fetch full reel data
  const reels = await fetchReelsWithDetails(paginatedIds, userId);

  return {
    reels,
    meta: {
      page,
      limit,
      hasMore: startIndex + limit < feedReelIds.length,
      nextCursor: paginatedIds[paginatedIds.length - 1]
    }
  };
};

/**
 * Generate personalized feed
 * Scoring algorithm (Phase 1 - simplified):
 * - Followed restaurants get priority
 * - Recent reels score higher
 * - Popular reels (likes/views) score higher
 * - Already seen reels score lower
 */
const generateFeed = async (userId) => {
  // Get user's followed restaurants
  const followsResult = await query(
    `SELECT restaurant_id FROM follows WHERE user_id = \$1`,
    [userId]
  );
  const followedIds = followsResult.rows.map(r => r.restaurant_id);

  // Get user's recently watched reels (last 48 hours)
  const watchedResult = await query(
    `SELECT DISTINCT reel_id FROM watch_events
     WHERE user_id = \$1 AND watched_at > NOW() - INTERVAL '48 hours'`,
    [userId]
  );
  const watchedIds = watchedResult.rows.map(r => r.reel_id);

  // Get user preferences
  const prefsResult = await query(
    `SELECT liked_categories FROM user_preferences WHERE user_id = \$1`,
    [userId]
  );
  const likedCategories = prefsResult.rows[0]?.liked_categories || [];

  // Build scoring query
  const result = await query(
    `WITH scored_reels AS (
      SELECT 
        r.id,
        r.created_at,
        r.views_count,
        r.likes_count,
        res.category,
        -- Recency score (0-1, exponential decay over 7 days)
        EXP(-EXTRACT(EPOCH FROM (NOW() - r.created_at)) / (7 * 24 * 3600)) as recency_score,
        -- Popularity score (normalized)
        CASE 
          WHEN r.views_count > 0 
          THEN (r.likes_count::float / r.views_count) 
          ELSE 0 
        END as engagement_ratio,
        -- Following bonus
        CASE WHEN res.id = ANY(\$2::uuid[]) THEN 0.3 ELSE 0 END as follow_bonus,
        -- Category match bonus
        CASE WHEN res.category = ANY(\$3::text[]) THEN 0.15 ELSE 0 END as category_bonus,
        -- Seen penalty
        CASE WHEN r.id = ANY(\$4::uuid[]) THEN -1.0 ELSE 0 END as seen_penalty
      FROM reels r
      JOIN restaurants res ON r.restaurant_id = res.id
      WHERE r.is_active = true AND res.is_active = true
    )
    SELECT id,
           (recency_score * 0.3 + 
            engagement_ratio * 0.25 + 
            follow_bonus + 
            category_bonus + 
            seen_penalty) as total_score
    FROM scored_reels
    ORDER BY total_score DESC, created_at DESC
    LIMIT \$5`,
    [
      userId,
      followedIds.length > 0 ? followedIds : ['00000000-0000-0000-0000-000000000000'],
      likedCategories.length > 0 ? likedCategories : ['_none_'],
      watchedIds.length > 0 ? watchedIds : ['00000000-0000-0000-0000-000000000000'],
      FEED_SIZE
    ]
  );

  return result.rows.map(r => r.id);
};

/**
 * Fetch reels with full details
 */
const fetchReelsWithDetails = async (reelIds, userId) => {
  if (reelIds.length === 0) return [];

  const result = await query(
    `SELECT 
      r.*,
      res.id as restaurant_id,
      res.name as restaurant_name,
      res.logo_url as restaurant_logo,
      res.category as restaurant_category,
      fi.id as food_item_id,
      fi.name as food_item_name,
      fi.price as food_item_price,
      fi.is_veg as food_item_is_veg,
      fi.is_available as food_item_available,
      EXISTS(SELECT 1 FROM likes WHERE user_id = \$2 AND reel_id = r.id) as is_liked,
      EXISTS(SELECT 1 FROM saves WHERE user_id = \$2 AND reel_id = r.id) as is_saved,
      EXISTS(SELECT 1 FROM follows WHERE user_id = \$2 AND restaurant_id = res.id) as is_following
    FROM reels r
    JOIN restaurants res ON r.restaurant_id = res.id
    LEFT JOIN food_items fi ON r.food_item_id = fi.id
    WHERE r.id = ANY(\$1::uuid[])`,
    [reelIds, userId]
  );

  // Maintain order from reelIds
  const reelMap = new Map();
  for (const row of result.rows) {
    reelMap.set(row.id, formatReelWithDetails(row));
  }

  return reelIds.map(id => reelMap.get(id)).filter(Boolean);
};

/**
 * Format reel with all details
 */
const formatReelWithDetails = (row) => ({
  id: row.id,
  videoUrl: row.video_url,
  thumbnailUrl: row.thumbnail_url,
  caption: row.caption,
  durationMs: row.duration_ms,
  viewsCount: row.views_count,
  likesCount: row.likes_count,
  commentsCount: row.comments_count,
  createdAt: row.created_at,
  restaurant: {
    id: row.restaurant_id,
    name: row.restaurant_name,
    logoUrl: row.restaurant_logo,
    category: row.restaurant_category,
    isFollowing: row.is_following
  },
  foodItem: row.food_item_id ? {
    id: row.food_item_id,
    name: row.food_item_name,
    price: parseFloat(row.food_item_price),
    isVeg: row.food_item_is_veg,
    isAvailable: row.food_item_available
  } : null,
  isLiked: row.is_liked,
  isSaved: row.is_saved
});

/**
 * Invalidate user's feed cache
 */
const invalidateFeed = async (userId) => {
  await cache.del(`feed:${userId}`);
};

/**
 * Get explore feed (for non-authenticated users)
 */
const getExploreFeed = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT 
      r.*,
      res.id as restaurant_id,
      res.name as restaurant_name,
      res.logo_url as restaurant_logo,
      res.category as restaurant_category,
      fi.id as food_item_id,
      fi.name as food_item_name,
      fi.price as food_item_price,
      fi.is_veg as food_item_is_veg,
      fi.is_available as food_item_available
    FROM reels r
    JOIN restaurants res ON r.restaurant_id = res.id
    LEFT JOIN food_items fi ON r.food_item_id = fi.id
    WHERE r.is_active = true AND res.is_active = true
    ORDER BY 
      (r.likes_count + r.views_count * 0.1) DESC,
      r.created_at DESC
    LIMIT \$1 OFFSET \$2`,
    [limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM reels r
     JOIN restaurants res ON r.restaurant_id = res.id
     WHERE r.is_active = true AND res.is_active = true`
  );

  const total = parseInt(countResult.rows[0].count);

  return {
    reels: result.rows.map(row => ({
      ...formatReelWithDetails(row),
      isLiked: false,
      isSaved: false,
      restaurant: {
        ...formatReelWithDetails(row).restaurant,
        isFollowing: false
      }
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total
    }
  };
};

module.exports = {
  getFeed,
  generateFeed,
  invalidateFeed,
  getExploreFeed
};