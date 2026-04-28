const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const logger = require('../common/logger/logger');

const runMigrations = async () => {
  const client = await pool.connect();
  
  try {
    // Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Get executed migrations
    const { rows: executed } = await client.query(
      'SELECT name FROM migrations'
    );
    const executedNames = executed.map(r => r.name);

    // Run pending migrations
    for (const file of files) {
      if (!executedNames.includes(file)) {
        logger.info(`Running migration: ${file}`);
        
        const sql = fs.readFileSync(
          path.join(migrationsDir, file),
          'utf8'
        );

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations (name) VALUES (\$1)',
            [file]
          );
          await client.query('COMMIT');
          logger.info(`✅ Migration completed: ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
    }

    logger.info('✅ All migrations completed');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations();