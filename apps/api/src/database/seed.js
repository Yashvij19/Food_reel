const bcrypt = require('bcryptjs');
const { pool } = require('./db');
const logger = require('../common/logger/logger');

const seed = async () => {
  const client = await pool.connect();

  try {
    logger.info('🌱 Starting database seed...');

    await client.query('BEGIN');

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const adminResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Admin User', 'admin@foodreels.com', \$1, 'admin')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [adminPassword]
    );
    logger.info('Created admin user');

    // Create test customer
    const customerPassword = await bcrypt.hash('Customer123!', 12);
    const customerResult = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ('Test Customer', 'customer@test.com', '+1234567890', \$1, 'customer')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [customerPassword]
    );
    const customerId = customerResult.rows[0]?.id;
    logger.info('Created test customer');

    // Create user preferences for customer
    if (customerId) {
      await client.query(
        `INSERT INTO user_preferences (user_id, liked_categories, disliked_categories)
         VALUES (\$1, ARRAY['indian', 'fast_food']::text[], ARRAY[]::text[])
         ON CONFLICT (user_id) DO NOTHING`,
        [customerId]
      );
    }

    // Create test restaurant owner
    const ownerPassword = await bcrypt.hash('Owner123!', 12);
    const ownerResult = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ('Restaurant Owner', 'owner@test.com', '+1987654321', \$1, 'restaurant_owner')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [ownerPassword]
    );
    const ownerId = ownerResult.rows[0]?.id;
    logger.info('Created test restaurant owner');

    if (ownerId) {
      // Create user preferences for owner
      await client.query(
        `INSERT INTO user_preferences (user_id, liked_categories, disliked_categories)
         VALUES (\$1, ARRAY[]::text[], ARRAY[]::text[])
         ON CONFLICT (user_id) DO NOTHING`,
        [ownerId]
      );

      // Create test restaurants
      const restaurant1Result = await client.query(
        `INSERT INTO restaurants (owner_id, name, description, address, city, category, logo_url, cover_url)
         VALUES (\$1, 'Spice Garden', 'Authentic Indian cuisine with a modern twist', '123 Main Street', 'New York', 'indian',
                 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200', 
                 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [ownerId]
      );
      const restaurant1Id = restaurant1Result.rows[0]?.id;

      const restaurant2Result = await client.query(
        `INSERT INTO restaurants (owner_id, name, description, address, city, category, logo_url, cover_url)
         VALUES (\$1, 'Burger Barn', 'Best burgers in town!', '456 Oak Avenue', 'New York', 'fast_food',
                 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=200',
                 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [ownerId]
      );
      const restaurant2Id = restaurant2Result.rows[0]?.id;

      logger.info('Created test restaurants');

      // Create food items for restaurant 1
      if (restaurant1Id) {
        const foodItems1 = [
          { name: 'Butter Chicken', description: 'Creamy tomato-based curry with tender chicken', price: 16.99, category: 'main', isVeg: false },
          { name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 14.99, category: 'starter', isVeg: true },
          { name: 'Biryani', description: 'Fragrant rice dish with aromatic spices', price: 18.99, category: 'main', isVeg: false },
          { name: 'Samosa', description: 'Crispy pastry filled with spiced potatoes', price: 6.99, category: 'starter', isVeg: true },
          { name: 'Gulab Jamun', description: 'Sweet milk dumplings in sugar syrup', price: 5.99, category: 'dessert', isVeg: true },
          { name: 'Mango Lassi', description: 'Refreshing mango yogurt drink', price: 4.99, category: 'beverages', isVeg: true }
        ];

        for (const item of foodItems1) {
          await client.query(
            `INSERT INTO food_items (restaurant_id, name, description, price, category, is_veg, is_available)
             VALUES (\$1, \$2, \$3, \$4, \$5, \$6, true)`,
            [restaurant1Id, item.name, item.description, item.price, item.category, item.isVeg]
          );
        }

        // Create sample reels for restaurant 1
        const reels1 = [
          { videoUrl: 'https://sample-videos.com/video1.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', caption: 'Our famous Butter Chicken! 🍛 #IndianFood #ButterChicken' },
          { videoUrl: 'https://sample-videos.com/video2.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', caption: 'Fresh Paneer Tikka coming right up! 🧀 #Vegetarian #PaneerTikka' },
          { videoUrl: 'https://sample-videos.com/video3.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', caption: 'Biryani perfection! 🍚 #Biryani #Foodie' }
        ];

        for (const reel of reels1) {
          await client.query(
            `INSERT INTO reels (restaurant_id, uploader_id, video_url, thumbnail_url, caption, duration_ms, views_count, likes_count)
             VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8)`,
            [restaurant1Id, ownerId, reel.videoUrl, reel.thumbnailUrl, reel.caption, 15000, Math.floor(Math.random() * 1000), Math.floor(Math.random() * 100)]
          );
        }
      }

      // Create food items for restaurant 2
      if (restaurant2Id) {
        const foodItems2 = [
          { name: 'Classic Burger', description: 'Beef patty with lettuce, tomato, and special sauce', price: 12.99, category: 'main', isVeg: false },
          { name: 'Veggie Burger', description: 'Plant-based patty with fresh vegetables', price: 11.99, category: 'main', isVeg: true },
          { name: 'Cheese Fries', description: 'Crispy fries topped with melted cheese', price: 7.99, category: 'sides', isVeg: true },
          { name: 'Chicken Wings', description: 'Crispy wings with your choice of sauce', price: 10.99, category: 'starter', isVeg: false },
          { name: 'Milkshake', description: 'Creamy milkshake in various flavors', price: 5.99, category: 'beverages', isVeg: true },
          { name: 'Apple Pie', description: 'Warm apple pie with vanilla ice cream', price: 6.99, category: 'dessert', isVeg: true }
        ];

        for (const item of foodItems2) {
          await client.query(
            `INSERT INTO food_items (restaurant_id, name, description, price, category, is_veg, is_available)
             VALUES (\$1, \$2, \$3, \$4, \$5, \$6, true)`,
            [restaurant2Id, item.name, item.description, item.price, item.category, item.isVeg]
          );
        }

        // Create sample reels for restaurant 2
        const reels2 = [
          { videoUrl: 'https://sample-videos.com/video4.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', caption: 'Juicy burger time! 🍔 #BurgerLove #Foodie' },
          { videoUrl: 'https://sample-videos.com/video5.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400', caption: 'Loaded cheese fries! 🍟 #CheeseFries #Yummy' }
        ];

        for (const reel of reels2) {
          await client.query(
            `INSERT INTO reels (restaurant_id, uploader_id, video_url, thumbnail_url, caption, duration_ms, views_count, likes_count)
             VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8)`,
            [restaurant2Id, ownerId, reel.videoUrl, reel.thumbnailUrl, reel.caption, 12000, Math.floor(Math.random() * 1000), Math.floor(Math.random() * 100)]
          );
        }
      }

      logger.info('Created food items and reels');

      // Create customer address
      if (customerId) {
        await client.query(
          `INSERT INTO addresses (user_id, label, full_address, is_default)
           VALUES (\$1, 'Home', '789 Customer Street, Apt 4B, New York, NY 10001', true)`,
          [customerId]
        );
        logger.info('Created customer address');
      }
    }

    await client.query('COMMIT');
    logger.info('✅ Database seed completed successfully');

    // Log test credentials
    logger.info('');
    logger.info('=== Test Credentials ===');
    logger.info('Admin: admin@foodreels.com / Admin123!');
    logger.info('Customer: customer@test.com / Customer123!');
    logger.info('Owner: owner@test.com / Owner123!');
    logger.info('========================');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(console.error);