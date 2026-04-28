const { query, transaction } = require('../../database/db');
const { cache } = require('../../cache/redis');
const { NotFoundError, AuthorizationError, ConflictError } = require('../../common/middleware/error-handler');
const feedService = require('../reels/feed.service');

/**
 * Toggle like on a reel
 */
const toggleLike = async (userId, reelId) => {
  // Check if reel exists
  const reelResult = await query(
    `SELECT id FROM reels WHERE id = \$1 AND is_active = true`,
    [reelId]
  );

  if (reelResult.rows.length === 0) {
    throw new NotFoundError('Reel not found');
  }

  // Check if already liked
  const existingLike = await query(
    `SELECT id FROM likes WHERE user_id = \$1 AND reel_id = \$2`,
    [userId, reelId]
  );

  let liked;

  if (existingLike.rows.length > 0) {
    // Unlike
    await query(
      `DELETE FROM likes WHERE user_id = \$1 AND reel_id = \$2`,
      [userId, reelId]
    );
    
    // Decrement DB counter
    await query(
      `UPDATE reels SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = \$1`,
      [reelId]
    );
    
    liked = false;
  } else {
    // Like
    await query(
      `INSERT INTO likes (user_id, reel_id) VALUES (\$1, \$2)`,
      [userId, reelId]
    );
    
    // Increment DB counter
    await query(
      `UPDATE reels SET likes_count = likes_count + 1 WHERE id = \$1`,
      [reelId]
    );
    
    liked = true;

    // Update user preferences based on reel category
    await updateUserPreferences(userId, reelId);
  }

  // Get updated count
  const countResult = await query(
    `SELECT likes_count FROM reels WHERE id = \$1`,
    [reelId]
  );

  return {
    liked,
    likesCount: countResult.rows[0].likes_count
  };
};

/**
 * Toggle save on a reel
 */
const toggleSave = async (userId, reelId) => {
  // Check if reel exists
  const reelResult = await query(
    `SELECT id FROM reels WHERE id = \$1 AND is_active = true`,
    [reelId]
  );

  if (reelResult.rows.length === 0) {
    throw new NotFoundError('Reel not found');
  }

  // Check if already saved
  const existingSave = await query(
    `SELECT id FROM saves WHERE user_id = \$1 AND reel_id = \$2`,
    [userId, reelId]
  );

  let saved;

  if (existingSave.rows.length > 0) {
    // Unsave
    await query(
      `DELETE FROM saves WHERE user_id = \$1 AND reel_id = \$2`,
      [userId, reelId]
    );
    saved = false;
  } else {
    // Save
    await query(
      `INSERT INTO saves (user_id, reel_id) VALUES (\$1, \$2)`,
      [userId, reelId]
    );
    saved = true;
  }

  return { saved };
};

/**
 * Toggle follow on a restaurant
 */
const toggleFollow = async (userId, restaurantId) => {
  // Check if restaurant exists
  const restaurantResult = await query(
    `SELECT id FROM restaurants WHERE id = \$1 AND is_active = true`,
    [restaurantId]
  );

  if (restaurantResult.rows.length === 0) {
    throw new NotFoundError('Restaurant not found');
  }

  // Check if already following
  const existingFollow = await query(
    `SELECT id FROM follows WHERE user_id = \$1 AND restaurant_id = \$2`,
    [userId, restaurantId]
  );

  let following;

  if (existingFollow.rows.length > 0) {
    // Unfollow
    await query(
      `DELETE FROM follows WHERE user_id = \$1 AND restaurant_id = \$2`,
      [userId, restaurantId]
    );
    following = false;
  } else {
    // Follow
    await query(
      `INSERT INTO follows (user_id, restaurant_id) VALUES (\$1, \$2)`,
      [userId, restaurantId]
    );
    following = true;
  }

  // Invalidate user's feed cache
  await feedService.invalidateFeed(userId);

  // Clear and update follower count cache
  await cache.del(`restaurant:followers:${restaurantId}`);

  // Get updated count
  const countResult = await query(
    `SELECT COUNT(*) FROM follows WHERE restaurant_id = \$1`,
    [restaurantId]
  );

  return {
    following,
    followersCount: parseInt(countResult.rows[0].count)
  };
};

/**
 * Get comments for a reel
 */
const getComments = async (reelId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  // Verify reel exists
  const reelResult = await query(
    `SELECT id FROM reels WHERE id = \$1 AND is_active = true`,
    [reelId]
  );

  if (reelResult.rows.length === 0) {
    throw new NotFoundError('Reel not found');
  }

  const [commentsResult, countResult] = await Promise.all([
    query(
      `SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.reel_id = \$1
       ORDER BY c.created_at DESC
       LIMIT \$2 OFFSET \$3`,
      [reelId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) FROM comments WHERE reel_id = \$1`,
      [reelId]
    )
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    comments: commentsResult.rows.map(row => ({
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        avatarUrl: row.user_avatar
      }
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
 * Create a comment
 */
const createComment = async (userId, reelId, text) => {
  // Verify reel exists
  const reelResult = await query(
    `SELECT id FROM reels WHERE id = \$1 AND is_active = true`,
    [reelId]
  );

  if (reelResult.rows.length === 0) {
    throw new NotFoundError('Reel not found');
  }

  // Create comment and update count in transaction
  const result = await transaction(async (client) => {
    const commentResult = await client.query(
      `INSERT INTO comments (user_id, reel_id, text)
       VALUES (\$1, \$2, \$3)
       RETURNING *`,
      [userId, reelId, text]
    );

    await client.query(
      `UPDATE reels SET comments_count = comments_count + 1 WHERE id = \$1`,
      [reelId]
    );

    return commentResult.rows[0];
  });

  // Get user info
  const userResult = await query(
    `SELECT name, avatar_url FROM users WHERE id = \$1`,
    [userId]
  );

  return {
    id: result.id,
    text: result.text,
    createdAt: result.created_at,
    user: {
      id: userId,
      name: userResult.rows[0].name,
      avatarUrl: userResult.rows[0].avatar_url
    }
  };
};

/**
 * Delete a comment
 */
const deleteComment = async (userId, reelId, commentId) => {
  // Verify comment exists and belongs to user
  const commentResult = await query(
    `SELECT user_id FROM comments WHERE id = \$1 AND reel_id = \$2`,
    [commentId, reelId]
  );

  if (commentResult.rows.length === 0) {
    throw new NotFoundError('Comment not found');
  }

  if (commentResult.rows[0].user_id !== userId) {
    throw new AuthorizationError('You can only delete your own comments');
  }

  // Delete comment and update count in transaction
  await transaction(async (client) => {
    await client.query(
      `DELETE FROM comments WHERE id = \$1`,
      [commentId]
    );

    await client.query(
      `UPDATE reels SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = \$1`,
      [reelId]
    );
  });

  return { deleted: true };
};

/**
 * Update user preferences based on liked reel
 */
const updateUserPreferences = async (userId, reelId) => {
  // Get reel's restaurant category
  const result = await query(
    `SELECT res.category
     FROM reels r
     JOIN restaurants res ON r.restaurant_id = res.id
     WHERE r.id = \$1`,
    [reelId]
  );

  if (result.rows.length === 0 || !result.rows[0].category) {
    return;
  }

  const category = result.rows[0].category;

  // Add to liked categories if not already present
  await query(
    `INSERT INTO user_preferences (user_id, liked_categories, disliked_categories)
     VALUES (\$1, ARRAY[\$2]::text[], ARRAY[]::text[])
     ON CONFLICT (user_id) DO UPDATE
     SET liked_categories = 
       CASE 
         WHEN NOT (\$2 = ANY(user_preferences.liked_categories))
         THEN array_append(user_preferences.liked_categories, \$2)
         ELSE user_preferences.liked_categories
       END,
     updated_at = NOW()`,
    [userId, category]
  );

  // Invalidate feed cache
  await feedService.invalidateFeed(userId);
};

module.exports = {
  toggleLike,
  toggleSave,
  toggleFollow,
  getComments,
  createComment,
  deleteComment
};