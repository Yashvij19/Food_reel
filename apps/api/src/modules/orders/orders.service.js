const { query, transaction } = require('../../database/db');
const { NotFoundError, ValidationError, AuthorizationError } = require('../../common/middleware/error-handler');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new order
 */
const createOrder = async (userId, data) => {
  const { restaurantId, items, deliveryAddress, reelId, notes } = data;

  return transaction(async (client) => {
    // Verify restaurant exists and is active
    const restaurantResult = await client.query(
      `SELECT id, name, is_active FROM restaurants WHERE id = \$1`,
      [restaurantId]
    );

    if (restaurantResult.rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    if (!restaurantResult.rows[0].is_active) {
      throw new ValidationError('Restaurant is currently not accepting orders');
    }

    // Fetch all food items and validate
    const foodItemIds = items.map(item => item.foodItemId);
    const foodItemsResult = await client.query(
      `SELECT id, name, price, is_available, restaurant_id
       FROM food_items
       WHERE id = ANY(\$1::uuid[])`,
      [foodItemIds]
    );

    // Create a map for easy lookup
    const foodItemMap = new Map();
    for (const item of foodItemsResult.rows) {
      foodItemMap.set(item.id, item);
    }

    // Validate all items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const foodItem = foodItemMap.get(item.foodItemId);

      if (!foodItem) {
        throw new NotFoundError(`Food item not found: ${item.foodItemId}`);
      }

      if (foodItem.restaurant_id !== restaurantId) {
        throw new ValidationError(`Food item ${foodItem.name} does not belong to this restaurant`);
      }

      if (!foodItem.is_available) {
        throw new ValidationError(`${foodItem.name} is currently unavailable`);
      }

      const subtotal = parseFloat(foodItem.price) * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        foodItemId: item.foodItemId,
        quantity: item.quantity,
        unitPrice: parseFloat(foodItem.price),
        subtotal,
        name: foodItem.name
      });
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders 
       (user_id, restaurant_id, total_amount, delivery_address, reel_id, notes, status, payment_status)
       VALUES (\$1, \$2, \$3, \$4, \$5, \$6, 'pending', 'pending')
       RETURNING *`,
      [userId, restaurantId, totalAmount, deliveryAddress, reelId, notes]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, food_item_id, quantity, unit_price, subtotal)
         VALUES (\$1, \$2, \$3, \$4, \$5)`,
        [order.id, item.foodItemId, item.quantity, item.unitPrice, item.subtotal]
      );
    }

    // Generate QR payload for payment
    const qrPayload = generateQRPayload(order.id, totalAmount);

    return {
      order: formatOrder(order, orderItems),
      qrPayload
    };
  });
};

/**
 * Get order by ID
 */
const getOrderById = async (orderId, userId, userRole) => {
  const orderResult = await query(
    `SELECT o.*, 
            r.name as restaurant_name,
            r.logo_url as restaurant_logo,
            r.owner_id as restaurant_owner_id,
            u.name as user_name,
            u.email as user_email,
            u.phone as user_phone
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN users u ON o.user_id = u.id
     WHERE o.id = \$1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    throw new NotFoundError('Order not found');
  }

  const order = orderResult.rows[0];

  // Check authorization
  const isOwner = order.user_id === userId;
  const isRestaurantOwner = order.restaurant_owner_id === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isRestaurantOwner && !isAdmin) {
    throw new AuthorizationError('You are not authorized to view this order');
  }

  // Get order items
  const itemsResult = await query(
    `SELECT oi.*, fi.name as food_item_name, fi.image_url as food_item_image, fi.is_veg
     FROM order_items oi
     JOIN food_items fi ON oi.food_item_id = fi.id
     WHERE oi.order_id = \$1`,
    [orderId]
  );

  return {
    id: order.id,
    status: order.status,
    totalAmount: parseFloat(order.total_amount),
    deliveryAddress: order.delivery_address,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    restaurant: {
      id: order.restaurant_id,
      name: order.restaurant_name,
      logoUrl: order.restaurant_logo
    },
    customer: {
      id: order.user_id,
      name: order.user_name,
      email: order.user_email,
      phone: order.user_phone
    },
    items: itemsResult.rows.map(item => ({
      id: item.id,
      foodItemId: item.food_item_id,
      name: item.food_item_name,
      imageUrl: item.food_item_image,
      isVeg: item.is_veg,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      subtotal: parseFloat(item.subtotal)
    })),
    reelId: order.reel_id
  };
};

/**
 * Get order history for user
 */
const getOrderHistory = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [ordersResult, countResult] = await Promise.all([
    query(
      `SELECT o.*, r.name as restaurant_name, r.logo_url as restaurant_logo
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.user_id = \$1
       ORDER BY o.created_at DESC
       LIMIT \$2 OFFSET \$3`,
      [userId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) FROM orders WHERE user_id = \$1`,
      [userId]
    )
  ]);

  const total = parseInt(countResult.rows[0].count);

  // Get items for all orders
  const orderIds = ordersResult.rows.map(o => o.id);
  
  let itemsMap = new Map();
  if (orderIds.length > 0) {
    const itemsResult = await query(
      `SELECT oi.*, fi.name as food_item_name
       FROM order_items oi
       JOIN food_items fi ON oi.food_item_id = fi.id
       WHERE oi.order_id = ANY(\$1::uuid[])`,
      [orderIds]
    );

    for (const item of itemsResult.rows) {
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, []);
      }
      itemsMap.get(item.order_id).push(item);
    }
  }

  return {
    orders: ordersResult.rows.map(order => ({
      id: order.id,
      status: order.status,
      totalAmount: parseFloat(order.total_amount),
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      restaurant: {
        id: order.restaurant_id,
        name: order.restaurant_name,
        logoUrl: order.restaurant_logo
      },
      itemCount: (itemsMap.get(order.id) || []).length,
      itemsSummary: (itemsMap.get(order.id) || [])
        .slice(0, 3)
        .map(i => i.food_item_name)
        .join(', ')
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
 * Get orders for restaurant
 */
const getRestaurantOrders = async (restaurantId, ownerId, filters = {}) => {
  const { page = 1, limit = 10, status } = filters;
  const offset = (page - 1) * limit;

  // Verify ownership
  const restaurantResult = await query(
    `SELECT owner_id FROM restaurants WHERE id = \$1`,
    [restaurantId]
  );

  if (restaurantResult.rows.length === 0) {
    throw new NotFoundError('Restaurant not found');
  }

  if (restaurantResult.rows[0].owner_id !== ownerId) {
    throw new AuthorizationError('You do not own this restaurant');
  }

  let whereClause = 'WHERE o.restaurant_id = \$1';
  const params = [restaurantId];
  let paramCount = 1;

  if (status) {
    paramCount++;
    whereClause += ` AND o.status = 
$$
{paramCount}`;
    params.push(status);
  }

  paramCount++;
  params.push(limit);
  paramCount++;
  params.push(offset);

  const [ordersResult, countResult] = await Promise.all([
    query(
      `SELECT o.*, u.name as user_name, u.phone as user_phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT
$$
{paramCount - 1} OFFSET $${paramCount}`,
      params
    ),
    query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      params.slice(0, -2)
    )
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    orders: ordersResult.rows.map(order => ({
      id: order.id,
      status: order.status,
      totalAmount: parseFloat(order.total_amount),
      deliveryAddress: order.delivery_address,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      customer: {
        name: order.user_name,
        phone: order.user_phone
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
 * Update order address (only when pending)
 */
const updateOrderAddress = async (orderId, userId, deliveryAddress) => {
  const orderResult = await query(
    `SELECT id, user_id, status FROM orders WHERE id = \$1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    throw new NotFoundError('Order not found');
  }

  const order = orderResult.rows[0];

  if (order.user_id !== userId) {
    throw new AuthorizationError('You can only update your own orders');
  }

  if (order.status !== 'pending') {
    throw new ValidationError('Address can only be changed for pending orders');
  }

  await query(
    `UPDATE orders SET delivery_address = \$1 WHERE id = \$2`,
    [deliveryAddress, orderId]
  );

  return { updated: true };
};

/**
 * Update order status (restaurant owner only)
 */
const updateOrderStatus = async (orderId, ownerId, newStatus) => {
  const orderResult = await query(
    `SELECT o.id, o.status, r.owner_id
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     WHERE o.id = \$1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    throw new NotFoundError('Order not found');
  }

  const order = orderResult.rows[0];

  if (order.owner_id !== ownerId) {
    throw new AuthorizationError('You can only update orders for your own restaurant');
  }

  // Validate status transition
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivered'],
    delivered: [],
    cancelled: []
  };

  if (!validTransitions[order.status].includes(newStatus)) {
    throw new ValidationError(
      `Cannot change status from '${order.status}' to '${newStatus}'`
    );
  }

  await query(
    `UPDATE orders SET status = \$1 WHERE id = \$2`,
    [newStatus, orderId]
  );

  return { status: newStatus };
};

/**
 * Confirm payment (mock)
 */
const confirmPayment = async (orderId, userId) => {
  const orderResult = await query(
    `SELECT id, user_id, payment_status FROM orders WHERE id = \$1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    throw new NotFoundError('Order not found');
  }

  const order = orderResult.rows[0];

  if (order.user_id !== userId) {
    throw new AuthorizationError('You can only confirm payment for your own orders');
  }

  if (order.payment_status === 'paid') {
    throw new ValidationError('Payment already confirmed');
  }

  await query(
    `UPDATE orders SET payment_status = 'paid' WHERE id = \$1`,
    [orderId]
  );

  return { paymentStatus: 'paid' };
};

// Helper functions
const generateQRPayload = (orderId, amount) => {
  // In production, this would integrate with a payment gateway
  // For MVP, we generate a mock payload
  return JSON.stringify({
    type: 'foodreels_payment',
    orderId,
    amount: parseFloat(amount).toFixed(2),
    timestamp: Date.now(),
    ref: uuidv4().substring(0, 8).toUpperCase()
  });
};

const formatOrder = (order, items) => ({
  id: order.id,
  status: order.status,
  totalAmount: parseFloat(order.total_amount),
  deliveryAddress: order.delivery_address,
  paymentMethod: order.payment_method,
  paymentStatus: order.payment_status,
  notes: order.notes,
  createdAt: order.created_at,
  items: items.map(item => ({
    foodItemId: item.foodItemId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal
  }))
});

module.exports = {
  createOrder,
  getOrderById,
  getOrderHistory,
  getRestaurantOrders,
  updateOrderAddress,
  updateOrderStatus,
  confirmPayment
};