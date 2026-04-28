/**
 * Background job to flush Redis counters to PostgreSQL
 * Run this as a cron job every 5 minutes
 */

const { redis } = require('../cache/redis');
const { query } = require('../database/db');
const logger = require('../common/logger/logger');

const BATCH_SIZE = 100;

async function flushViewCounts() {
  logger.info('Starting view count flush...');
  
  try {
    // Get all view count keys
    const keys = await redis.keys('reel:views:*');
    
    if (keys.length === 0) {
      logger.info('No view counts to flush');
      return;
    }

    // Process in batches
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      
      for (const key of batch) {
        const reelId = key.replace('reel:views:', '');
        const count = await redis.getdel(key);
        
        if (count && parseInt(count) > 0) {
          await query(
            `UPDATE reels SET views_count = views_count + \$1 WHERE id = \$2`,
            [parseInt(count), reelId]
          );
        }
      }
    }

    logger.info(`Flushed ${keys.length} view count keys`);
  } catch (error) {
    logger.error('Error flushing view counts:', error);
  }
}

async function flushLikeCounts() {
  logger.info('Starting like count flush...');
  
  try {
    // Get all like count keys
    const keys = await redis.keys('reel:likes:*');
    
    if (keys.length === 0) {
      logger.info('No like counts to flush');
      return;
    }

    // Process in batches
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      
      for (const key of batch) {
        const reelId = key.replace('reel:likes:', '');
        const count = await redis.getdel(key);
        
        if (count && parseInt(count) > 0) {
          await query(
            `UPDATE reels SET likes_count = likes_count + \$1 WHERE id = \$2`,
            [parseInt(count), reelId]
          );
        }
      }
    }

    logger.info(`Flushed ${keys.length} like count keys`);
  } catch (error) {
    logger.error('Error flushing like counts:', error);
  }
}

async function aggregateWatchTime() {
  logger.info('Starting watch time aggregation...');
  
  try {
    // Aggregate watch time from watch_events to reels
    const result = await query(`
      WITH aggregated AS (
        SELECT 
          reel_id,
          SUM(watch_ms) as total_ms
        FROM watch_events
        WHERE watched_at > NOW() - INTERVAL '1 hour'
        GROUP BY reel_id
      )
      UPDATE reels r
      SET total_watch_ms = r.total_watch_ms + a.total_ms
      FROM aggregated a
      WHERE r.id = a.reel_id
      RETURNING r.id
    `);

    logger.info(`Aggregated watch time for ${result.rowCount} reels`);
  } catch (error) {
    logger.error('Error aggregating watch time:', error);
  }
}

async function run() {
  logger.info('=== Starting Redis flush job ===');
  
  await flushViewCounts();
  await flushLikeCounts();
  await aggregateWatchTime();
  
  logger.info('=== Redis flush job completed ===');
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

module.exports = { run, flushViewCounts, flushLikeCounts, aggregateWatchTime };