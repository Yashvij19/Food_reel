const { query } = require('../../database/db');
const { NotFoundError, AuthorizationError } = require('../../common/middleware/error-handler');

/**
 * Get restaurant analytics
 */
const getRestaurantAnalytics = async (restaurantId, ownerId, period = '30d') => {
  // Verify ownership
  const restaurantResult = await query(
    `SELECT owner_id, name FROM restaurants WHERE id = \$1`,
    [restaurantId]
  );

  if (restaurantResult.rows.length === 0) {
    throw new NotFoundError('Restaurant not found');
  }

  if (restaurantResult.rows[0].owner_id !== ownerId) {
    throw new AuthorizationError('You do not own this restaurant');
  }

  // Calculate date range
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all reels for this restaurant
  const reelsResult = await query(
    `SELECT id FROM reels WHERE restaurant_id = \$1 AND is_active = true`,
    [restaurantId]
  );
  const reelIds = reelsResult.rows.map(r => r.id);

  // Get aggregate stats
  const statsResult = await query(
    `SELECT 
       COALESCE(SUM(views_count), 0) as total_views,
       COALESCE(SUM(likes_count), 0) as total_likes,
       COALESCE(SUM(comments_count), 0) as total_comments,
       COALESCE(SUM(total_watch_ms), 0) as total_watch_ms,
       COUNT(*) as total_reels
     FROM reels
     WHERE restaurant_id = \$1 AND is_active = true`,
    [restaurantId]
  );

  const stats = statsResult.rows[0];

  // Get orders stats
  const ordersResult = await query(
    `SELECT 
       COUNT(*) as total_orders,
       COALESCE(SUM(total_amount), 0) as total_revenue,
       COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders
     FROM orders
     WHERE restaurant_id = \$1 AND created_at >= \$2`,
    [restaurantId, startDate]
  );

  const orderStats = ordersResult.rows[0];

  // Get orders from reels (attribution)
  const reelOrdersResult = await query(
    `SELECT COUNT(*) as orders_from_reels
     FROM orders
     WHERE restaurant_id = \$1 AND reel_id IS NOT NULL AND created_at >= \$2`,
    [restaurantId, startDate]
  );

  const reelOrders = parseInt(reelOrdersResult.rows[0].orders_from_reels);

  // Calculate conversion rate
  const totalViews = parseInt(stats.total_views);
  const conversionRate = totalViews > 0 
    ? ((reelOrders / totalViews) * 100).toFixed(2) 
    : 0;

  // Get follower count
  const followersResult = await query(
    `SELECT COUNT(*) as followers FROM follows WHERE restaurant_id = \$1`,
    [restaurantId]
  );

  // Get views by day
  const viewsByDayResult = await query(
    `SELECT 
       DATE(watched_at) as date,
       COUNT(*) as views
     FROM watch_events
     WHERE reel_id = ANY(\$1::uuid[]) AND watched_at >= \$2
     GROUP BY DATE(watched_at)
     ORDER BY date`,
    [reelIds.length > 0 ? reelIds : ['00000000-0000-0000-0000-000000000000'], startDate]
  );

  // Get orders by day
  const ordersByDayResult = await query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as orders,
       SUM(total_amount) as revenue
     FROM orders
     WHERE restaurant_id = \$1 AND created_at >= \$2
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [restaurantId, startDate]
  );

  // Get top reels
  const topReelsResult = await query(
    `SELECT id, caption, thumbnail_url, views_count, likes_count, comments_count
     FROM reels
     WHERE restaurant_id = \$1 AND is_active = true
     ORDER BY (views_count + likes_count * 2) DESC
     LIMIT 5`,
    [restaurantId]
  );

  // Calculate average watch time
  const avgWatchTime = parseInt(stats.total_views) > 0
    ? Math.round(parseInt(stats.total_watch_ms) / parseInt(stats.total_views) / 1000)
    : 0;

  return {
    restaurantName: restaurantResult.rows[0].name,
    period,
    summary: {
      totalViews: parseInt(stats.total_views),
      totalLikes: parseInt(stats.total_likes),
      totalComments: parseInt(stats.total_comments),
      totalReels: parseInt(stats.total_reels),
      totalOrders: parseInt(orderStats.total_orders),
      completedOrders: parseInt(orderStats.completed_orders),
      totalRevenue: parseFloat(orderStats.total_revenue),
      ordersFromReels: reelOrders,
      conversionRate: parseFloat(conversionRate),
      avgWatchTimeSeconds: avgWatchTime,
      followers: parseInt(followersResult.rows[0].followers)
    },
    viewsByDay: viewsByDayResult.rows.map(row => ({
      date: row.date,
      views: parseInt(row.views)
    })),
    ordersByDay: ordersByDayResult.rows.map(row => ({
      date: row.date,
      orders: parseInt(row.orders),
      revenue: parseFloat(row.revenue)
    })),
    topReels: topReelsResult.rows.map(row => ({
      id: row.id,
      caption: row.caption,
      thumbnailUrl: row.thumbnail_url,
      viewsCount: row.views_count,
      likesCount: row.likes_count,
      commentsCount: row.comments_count
    }))
  };
};

/**
 * Get reel analytics
 */
const getReelAnalytics = async (reelId, ownerId) => {
  // Verify ownership
  const reelResult = await query(
    `SELECT r.*, res.owner_id, res.name as restaurant_name
     FROM reels r
     JOIN restaurants res ON r.restaurant_id = res.id
     WHERE r.id = \$1`,
    [reelId]
  );

  if (reelResult.rows.length === 0) {
    throw new NotFoundError('Reel not found');
  }

  if (reelResult.rows[0].owner_id !== ownerId) {
    throw new AuthorizationError('You do not own this reel');
  }

  const reel = reelResult.rows[0];

  // Get watch time distribution
  const watchTimeResult = await query(
    `SELECT 
       CASE 
         WHEN watch_ms < 5000 THEN '0-5s'
         WHEN watch_ms < 15000 THEN '5-15s'
         WHEN watch_ms < 30000 THEN '15-30s'
         ELSE '30s+'
       END as duration_bucket,
       COUNT(*) as count
     FROM watch_events
     WHERE reel_id = \$1
     GROUP BY duration_bucket
     ORDER BY duration_bucket`,
    [reelId]
  );

  // Get orders from this reel
  const ordersResult = await query(
    `SELECT COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue
     FROM orders
     WHERE reel_id = \$1`,
    [reelId]
  );

  // Get views over time (last 30 days)
  const viewsOverTimeResult = await query(
    `SELECT 
       DATE(watched_at) as date,
       COUNT(*) as views
     FROM watch_events
     WHERE reel_id = \$1 AND watched_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(watched_at)
     ORDER BY date`,
    [reelId]
  );

  // Calculate average watch time
  const avgWatchResult = await query(
    `SELECT AVG(watch_ms) as avg_watch_ms FROM watch_events WHERE reel_id = \$1`,
    [reelId]
  );

  const avgWatchMs = parseFloat(avgWatchResult.rows[0].avg_watch_ms) || 0;
  const completionRate = reel.duration_ms > 0
    ? ((avgWatchMs / reel.duration_ms) * 100).toFixed(2)
    : 0;

  return {
    reel: {
      id: reel.id,
      caption: reel.caption,
      thumbnailUrl: reel.thumbnail_url,
      videoUrl: reel.video_url,
      createdAt: reel.created_at,
      restaurantName: reel.restaurant_name
    },
    metrics: {
      viewsCount: reel.views_count,
      likesCount: reel.likes_count,
      commentsCount: reel.comments_count,
      totalWatchMs: parseInt(reel.total_watch_ms),
      avgWatchTimeSeconds: Math.round(avgWatchMs / 1000),
      completionRate: parseFloat(completionRate),
      orders: parseInt(ordersResult.rows[0].orders),
      revenue: parseFloat(ordersResult.rows[0].revenue)
    },
    watchTimeDistribution: watchTimeResult.rows.map(row => ({
      bucket: row.duration_bucket,
      count: parseInt(row.count)
    })),
    viewsOverTime: viewsOverTimeResult.rows.map(row => ({
      date: row.date,
      views: parseInt(row.views)
    }))
  };
};

module.exports = {
  getRestaurantAnalytics,
  getReelAnalytics
};