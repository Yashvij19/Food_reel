const restaurantsService = require('./restaurants.service');

/**
 * POST /restaurants
 */
const createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantsService.createRestaurant(req.user.id, req.body);
    res.status(201).json({ data: restaurant });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /restaurants/:id
 */
const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantsService.getRestaurantById(
      req.params.id,
      req.user?.id
    );
    res.json({ data: restaurant });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /restaurants/:id
 */
const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantsService.updateRestaurant(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json({ data: restaurant });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /restaurants/:id/menu
 */
const getMenu = async (req, res, next) => {
  try {
    const menu = await restaurantsService.getMenu(req.params.id);
    res.json({ data: menu });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /restaurants/:id/menu
 */
const addMenuItem = async (req, res, next) => {
  try {
    const item = await restaurantsService.addMenuItem(
      req.params.id,
      req.user.id,
      req.body
    );
    res.status(201).json({ data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /restaurants/:id/menu/:itemId
 */
const updateMenuItem = async (req, res, next) => {
  try {
    const item = await restaurantsService.updateMenuItem(
      req.params.id,
      req.params.itemId,
      req.user.id,
      req.body
    );
    res.json({ data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /restaurants/:id/menu/:itemId
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    await restaurantsService.deleteMenuItem(
      req.params.id,
      req.params.itemId,
      req.user.id
    );
    res.json({ data: { message: 'Menu item deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /restaurants/search
 */
const searchRestaurants = async (req, res, next) => {
  try {
    const result = await restaurantsService.searchRestaurants(req.query);
    res.json({ data: result.restaurants, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /restaurants/my
 */
const getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await restaurantsService.getMyRestaurants(req.user.id);
    res.json({ data: restaurants });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRestaurant,
  getRestaurant,
  updateRestaurant,
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  searchRestaurants,
  getMyRestaurants
};