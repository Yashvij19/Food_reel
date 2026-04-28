/**
 * Background job to clean up old data
 * Run this as a daily cron job
 */

const { query } = require('../database/db');
const logger = require('../common/logger/logger');

async function cleanupExpiredRefreshTokens() {
  logger.info('Cleaning up expired refresh tokens...');
  
  try {
    const result = await query(`
      DELETE FROM refresh_tokens
      WHERE expires_at < NOW() OR revoked_at IS NOT NULL
    `);

    logger.info(`Deleted ${result.rowCount} expired refresh tokens`);
  } catch (error) {
    logger.error('Error cleaning up refresh tokens:', error);
  }
}

async function cleanupOldWatchEvents() {
  logger.info('Cleaning up old watch events...');
  
  try {
    // Keep only last 30 days of watch events
    const result = await query(`
      DELETE FROM watch_events
      WHERE watched_at < NOW() - INTERVAL '30 days'
    `);

    logger.info(`Deleted ${result.rowCount} old watch events`);
  } catch (error) {
    logger.error('Error cleaning up watch events:', error);
  }
}

async function updateRestaurantStats() {
  logger.info('Updating restaurant follower counts cache...');
  
  try {
    // This could be used to update a denormalized followers_count column
    // For now, we'll just log the stats
    const result = await query(`
      SELECT 
        r.id,
        r.name,
        COUNT(DISTINCT f.id) as followers,
        COUNT(DISTINCT re.id) as reels,
        SUM(re.views_count) as total_views
      FROM restaurants r
      LEFT JOIN follows f ON r.id = f.restaurant_id
      LEFT JOIN reels re ON r.id = re.restaurant_id AND re.is_active = true
      WHERE r.is_active = true
      GROUP BY r.id, r.name
      ORDER BY followers DESC
      LIMIT 10
    `);

    logger.info('Top 10 restaurants by followers:');
    result.rows.forEach((row, index) => {
      logger.info(`${index + 1}. ${row.name}: ${row.followers} followers, ${row.reels} reels, ${row.total_views} views`);
    });
  } catch (error) {
    logger.error('Error updating restaurant stats:', error);
  }
}

async function run() {
  logger.info('=== Starting cleanup job ===');
  
  await cleanupExpiredRefreshTokens();
  await cleanupOldWatchEvents();
  await updateRestaurantStats();
  
  logger.info('=== Cleanup job completed ===');
}

// Run if called directly
if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Job failed:', error);
      process.exit(1);
    });
}

module.exports = { run, cleanupExpiredRefreshTokens, cleanupOldWatchEvents };