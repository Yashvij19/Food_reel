const analyticsService = require('./analytics.service');

/**
 * GET /analytics/restaurant/:id
 */
const getRestaurantAnalytics = async (req, res, next) => {
  try {
    const { period } = req.query;
    const analytics = await analyticsService.getRestaurantAnalytics(
      req.params.id,
      req.user.id,
      period
    );
    res.json({ data: analytics });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /analytics/reels/:id
 */
const getReelAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getReelAnalytics(
      req.params.id,
      req.user.id
    );
    res.json({ data: analytics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurantAnalytics,
  getReelAnalytics
};