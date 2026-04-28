const { query, transaction } = require('../../database/db');
const { cache } = require('../../cache/redis');
const { 
  NotFoundError, 
  AuthorizationError,
  ValidationError 
} = require('../../common/middleware/error-handler');

/**
 * Create a new restaurant
 */
const createRestaurant = async (ownerId, data) => {
  const {
    name, description, address, city,
    locationLat, locationLng, category, logoUrl, coverUrl
  } = data;

  const result = await query(
    `INSERT INTO restaurants 
     (owner_id, name, description, address, city, location_lat, location_lng, category, logo_url, cover_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [ownerId, name, description, address, city, locationLat, locationLng, category, logoUrl, coverUrl]
  );

  const restaurant = result.rows[0];

  return formatRestaurant(restaurant);
};

/**
 * Get restaurant by ID with details
 */
const getRestaurantById = async (restaurantId, userId = null) => {
  const result = await query(
    `SELECT r.*,
            u.name as owner_name,
            (SELECT COUNT(*) FROM follows WHERE restaurant_id = r.id) as followers_count,
            (SELECT COUNT(*) FROM reels WHERE restaurant_id = r.id AND is_active = true) as reels_count
     FROM restaurants r
     JOIN users u ON r.owner_id = u.id
     WHERE r.id = $1`,
    [restaurantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Restaurant not found');
  }

  const restaurant = result.rows[0];

  // Check if user is following
  let isFollowing = false;
  if (userId) {
    const followResult = await query(
      `SELECT id FROM follows WHERE user_id = $1 AND restaurant_id = $2`,
      [userId, restaurantId]
    );
    isFollowing = followResult.rows.length > 0;
  }

  // Get recent reels
  const reelsResult = await query(
    `SELECT r.*, fi.name as food_item_name, fi.price as food_item_price
     FROM reels r
     LEFT JOIN food_items fi ON r.food_item_id = fi.id
     WHERE r.restaurant_id = $1 AND r.is_active = true
     ORDER BY r.created_at DESC
     LIMIT 10`,
    [restaurantId]
  );

  return {
    ...formatRestaurant(restaurant),
    ownerName: restaurant.owner_name,
    followersCount: parseInt(restaurant.followers_count),
    reelsCount: parseInt(restaurant.reels_count),
    isFollowing,
    recentReels: reelsResult.rows.map(formatReel)
  };
};

/**
 * Update restaurant
 */
const updateRestaurant = async (restaurantId, ownerId, data) => {
  // Verify ownership
  await verifyOwnership(restaurantId, ownerId);

  const updateFields = [];
  const values = [];
  let paramCount = 0;

  const fieldMap = {
    name: 'name',
    description: 'description',
    address: 'address',
    city: 'city',
    locationLat: 'location_lat',
    locationLng: 'location_lng',
    category: 'category',
    logoUrl: 'logo_url',
    coverUrl: 'cover_url'
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      paramCount++;
      updateFields.push(`${column} =
$$
{paramCount}`);
      values.push(data[key]);
    }
  }

  if (updateFields.length === 0) {
    return getRestaurantById(restaurantId);
  }

  paramCount++;
  values.push(restaurantId);

  const result = await query(
    `UPDATE restaurants SET ${updateFields.join(', ')}
     WHERE id = 
$$
{paramCount}
     RETURNING *`,
    values
  );

  return formatRestaurant(result.rows[0]);
};

/**
 * Get restaurant menu (food items)
 */
const getMenu = async (restaurantId) => {
  // Verify restaurant exists
  const restaurantResult = await query(
    `SELECT id FROM restaurants WHERE id = $1`,
    [restaurantId]
  );

  if (restaurantResult.rows.length === 0) {
    throw new NotFoundError('Restaurant not found');
  }

  const result = await query(
    `SELECT * FROM food_items
     WHERE restaurant_id = $1
     ORDER BY category, name`,
    [restaurantId]
  );

  // Group by category
  const grouped = {};
  for (const item of result.rows) {
    const cat = item.category || 'Other';
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push(formatFoodItem(item));
  }

  return {
    items: result.rows.map(formatFoodItem),
    groupedByCategory: grouped
  };
};

/**
 * Add food item to menu
 */
const addMenuItem = async (restaurantId, ownerId, data) => {
  await verifyOwnership(restaurantId, ownerId);

  const { name, description, price, category, isVeg, imageUrl, isAvailable } = data;

  const result = await query(
    `INSERT INTO food_items 
     (restaurant_id, name, description, price, category, is_veg, image_url, is_available)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [restaurantId, name, description, price, category, isVeg, imageUrl, isAvailable]
  );

  return formatFoodItem(result.rows[0]);
};

/**
 * Update food item
 */
const updateMenuItem = async (restaurantId, itemId, ownerId, data) => {
  await verifyOwnership(restaurantId, ownerId);

  // Verify item belongs to restaurant
  const itemResult = await query(
    `SELECT id FROM food_items WHERE id = $1 AND restaurant_id = $2`,
    [itemId, restaurantId]
  );

  if (itemResult.rows.length === 0) {
    throw new NotFoundError('Food item not found');
  }

  const updateFields = [];
  const values = [];
  let paramCount = 0;

  const fieldMap = {
    name: 'name',
    description: 'description',
    price: 'price',
    category: 'category',
    isVeg: 'is_veg',
    imageUrl: 'image_url',
    isAvailable: 'is_available'
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      paramCount++;
      updateFields.push(`${column} =
$$
{paramCount}`);
      values.push(data[key]);
    }
  }

  if (updateFields.length === 0) {
    const current = await query(`SELECT * FROM food_items WHERE id = \$1`, [itemId]);
    return formatFoodItem(current.rows[0]);
  }

  paramCount++;
  values.push(itemId);

  const result = await query(
    `UPDATE food_items SET ${updateFields.join(', ')}
     WHERE id = 
$$
{paramCount}
     RETURNING *`,
    values
  );

  return formatFoodItem(result.rows[0]);
};

/**
 * Delete food item
 */
const deleteMenuItem = async (restaurantId, itemId, ownerId) => {
  await verifyOwnership(restaurantId, ownerId);

  const result = await query(
    `DELETE FROM food_items WHERE id = $1 AND restaurant_id = $2 RETURNING id`,
    [itemId, restaurantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Food item not found');
  }

  return { deleted: true };
};

/**
 * Search restaurants
 */
const searchRestaurants = async (filters) => {
  const { q, category, city, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE r.is_active = true';
  const params = [];
  let paramCount = 0;

  if (q) {
    paramCount++;
    whereClause += ` AND (r.name ILIKE
$$
{paramCount} OR r.description ILIKE 
$$
{paramCount})`;
    params.push(`%${q}%`);
  }

  if (category) {
    paramCount++;
    whereClause += ` AND r.category =
$$
{paramCount}`;
    params.push(category);
  }

  if (city) {
    paramCount++;
    whereClause += ` AND r.city ILIKE 
$$
{paramCount}`;
    params.push(`%${city}%`);
  }

  const countQuery = `SELECT COUNT(*) FROM restaurants r ${whereClause}`;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  paramCount++;
  params.push(limit);
  paramCount++;
  params.push(offset);

  const dataQuery = `
    SELECT r.*,
           (SELECT COUNT(*) FROM follows WHERE restaurant_id = r.id) as followers_count,
           (SELECT COUNT(*) FROM reels WHERE restaurant_id = r.id AND is_active = true) as reels_count
    FROM restaurants r
    ${whereClause}
    ORDER BY followers_count DESC, r.created_at DESC
    LIMIT
$$
{paramCount - 1} OFFSET $${paramCount}
  `;

  const result = await query(dataQuery, params);

  return {
    restaurants: result.rows.map(row => ({
      ...formatRestaurant(row),
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

/**
 * Get restaurants owned by user
 */
const getMyRestaurants = async (ownerId) => {
  const result = await query(
    `SELECT r.*,
            (SELECT COUNT(*) FROM follows WHERE restaurant_id = r.id) as followers_count,
            (SELECT COUNT(*) FROM reels WHERE restaurant_id = r.id AND is_active = true) as reels_count,
            (SELECT COUNT(*) FROM orders WHERE restaurant_id = r.id) as orders_count
     FROM restaurants r
     WHERE r.owner_id = \$1
     ORDER BY r.created_at DESC`,
    [ownerId]
  );

  return result.rows.map(row => ({
    ...formatRestaurant(row),
    followersCount: parseInt(row.followers_count),
    reelsCount: parseInt(row.reels_count),
    ordersCount: parseInt(row.orders_count)
  }));
};

// Helper functions
const verifyOwnership = async (restaurantId, ownerId) => {
  const result = await query(
    `SELECT owner_id FROM restaurants WHERE id = \$1`,
    [restaurantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Restaurant not found');
  }

  if (result.rows[0].owner_id !== ownerId) {
    throw new AuthorizationError('You do not own this restaurant');
  }
};

const formatRestaurant = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  name: row.name,
  description: row.description,
  address: row.address,
  city: row.city,
  locationLat: row.location_lat ? parseFloat(row.location_lat) : null,
  locationLng: row.location_lng ? parseFloat(row.location_lng) : null,
  category: row.category,
  logoUrl: row.logo_url,
  coverUrl: row.cover_url,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const formatFoodItem = (row) => ({
  id: row.id,
  restaurantId: row.restaurant_id,
  name: row.name,
  description: row.description,
  price: parseFloat(row.price),
  category: row.category,
  isVeg: row.is_veg,
  imageUrl: row.image_url,
  isAvailable: row.is_available,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const formatReel = (row) => ({
  id: row.id,
  videoUrl: row.video_url,
  thumbnailUrl: row.thumbnail_url,
  caption: row.caption,
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
  createRestaurant,
  getRestaurantById,
  updateRestaurant,
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  searchRestaurants,
  getMyRestaurants,
  verifyOwnership
};