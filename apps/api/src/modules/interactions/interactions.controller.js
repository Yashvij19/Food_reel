const interactionsService = require('./interactions.service');

/**
 * POST /reels/:id/like
 */
const toggleLike = async (req, res, next) => {
  try {
    const result = await interactionsService.toggleLike(req.user.id, req.params.id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /reels/:id/save
 */
const toggleSave = async (req, res, next) => {
  try {
    const result = await interactionsService.toggleSave(req.user.id, req.params.id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /restaurants/:id/follow
 */
const toggleFollow = async (req, res, next) => {
  try {
    const result = await interactionsService.toggleFollow(req.user.id, req.params.id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /reels/:id/comments
 */
const getComments = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await interactionsService.getComments(req.params.id, page, limit);
    res.json({ data: result.comments, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /reels/:id/comments
 */
const createComment = async (req, res, next) => {
  try {
    const comment = await interactionsService.createComment(
      req.user.id,
      req.params.id,
      req.body.text
    );
    res.status(201).json({ data: comment });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /reels/:id/comments/:commentId
 */
const deleteComment = async (req, res, next) => {
  try {
    await interactionsService.deleteComment(
      req.user.id,
      req.params.id,
      req.params.commentId
    );
    res.json({ data: { message: 'Comment deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleLike,
  toggleSave,
  toggleFollow,
  getComments,
  createComment,
  deleteComment
};