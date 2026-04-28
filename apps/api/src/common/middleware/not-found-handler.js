const { NotFoundError } = require('./error-handler');

const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
};

module.exports = { notFoundHandler };