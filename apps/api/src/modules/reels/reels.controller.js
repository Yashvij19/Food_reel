const reelsService = require('./reels.service');
const feedService = require('./feed.service');

/**
 * GET /reels/feed
 */
const getFeed = async (req, res, next) => {
  try {
    const { page, limit, cursor } = req.query;
    
    let result;
    if (req.user) {
      result = await feedService.getFeed(req.user.id, { page, limit, cursor });
    } else {
      result = await feedService.getExploreFeed(page, limit);
    }
    
    res.json({ data: result.reels, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /reels
 */
const createReel = async (req, res, next) => {
  try {
    const reel = await reelsService.createReel(req.user.id, req.body);
    res.status(201).json({ data: reel });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /reels/:id
 */
const getReel = async (req, res, next) => {
  try {
    const reel = await reelsService.getReelById(req.params.id, req.user?.id);
    res.json({ data: reel });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /reels/:id
 */
const deleteReel = async (req, res, next) => {
  try {
    await reelsService.deleteReel(req.params.id, req.user.id);
    res.json({ data: { message: 'Reel deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /reels/:id/view
 */
const recordView = async (req, res, next) => {
  try {
    const { watchMs } = req.body;
    await reelsService.recordView(req.params.id, req.user.id, watchMs);
    res.json({ data: { recorded: true } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeed,
  createReel,
  getReel,
  deleteReel,
  recordView
};