const ordersService = require('./orders.service');

/**
 * POST /orders
 */
const createOrder = async (req, res, next) => {
  try {
    const result = await ordersService.createOrder(req.user.id, req.body);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/history
 */
const getOrderHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await ordersService.getOrderHistory(req.user.id, page, limit);
    res.json({ data: result.orders, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/:id
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /orders/:id/address
 */
const updateAddress = async (req, res, next) => {
  try {
    await ordersService.updateOrderAddress(
      req.params.id,
      req.user.id,
      req.body.deliveryAddress
    );
    res.json({ data: { message: 'Address updated successfully' } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /orders/:id/status
 */
const updateStatus = async (req, res, next) => {
  try {
    const result = await ordersService.updateOrderStatus(
      req.params.id,
      req.user.id,
      req.body.status
    );
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /orders/:id/payment-confirm
 */
const confirmPayment = async (req, res, next) => {
  try {
    const result = await ordersService.confirmPayment(req.params.id, req.user.id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/restaurant/:restaurantId
 */
const getRestaurantOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await ordersService.getRestaurantOrders(
      req.params.restaurantId,
      req.user.id,
      { page, limit, status }
    );
    res.json({ data: result.orders, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderHistory,
  getOrder,
  updateAddress,
  updateStatus,
  confirmPayment,
  getRestaurantOrders
};