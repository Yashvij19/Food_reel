const usersService = require('./users.service');

/**
 * GET /users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await usersService.getProfile(req.user.id);
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const profile = await usersService.updateProfile(req.user.id, req.body);
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/saved-reels
 */
const getSavedReels = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await usersService.getSavedReels(req.user.id, page, limit);
    res.json({ data: result.reels, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/addresses
 */
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await usersService.getAddresses(req.user.id);
    res.json({ data: addresses });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /users/addresses
 */
const createAddress = async (req, res, next) => {
  try {
    const address = await usersService.createAddress(req.user.id, req.body);
    res.status(201).json({ data: address });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /users/addresses/:id
 */
const updateAddress = async (req, res, next) => {
  try {
    const address = await usersService.updateAddress(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json({ data: address });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /users/addresses/:id
 */
const deleteAddress = async (req, res, next) => {
  try {
    await usersService.deleteAddress(req.user.id, req.params.id);
    res.json({ data: { message: 'Address deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/following
 */
const getFollowedRestaurants = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await usersService.getFollowedRestaurants(req.user.id, page, limit);
    res.json({ data: result.restaurants, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getSavedReels,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getFollowedRestaurants
};