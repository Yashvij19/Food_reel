const { ValidationError } = require('./error-handler');

/**
 * Middleware factory for request validation using Zod schemas
 * @param {Object} schemas - Object with body, params, query schemas
 */
const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      next();
    } catch (error) {
      const details = error.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      next(new ValidationError('Validation failed', details));
    }
  };
};

module.exports = { validate };