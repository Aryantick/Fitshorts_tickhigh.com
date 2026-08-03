const apiResponse = require("../utils/apiResponse");

/**
 * Generic Express Request Validation Middleware using Zod schemas
 */
const validate = (schema) => async (req, res, next) => {
  try {
    if (schema.body) {
      req.body = await schema.body.parseAsync(req.body);
    }
    if (schema.query) {
      req.query = await schema.query.parseAsync(req.query);
    }
    if (schema.params) {
      req.params = await schema.params.parseAsync(req.params);
    }
    return next();
  } catch (error) {
    if (error.name === "ZodError" || error.issues) {
      const issueList = error.issues || error.errors || [];
      const formattedErrors = issueList.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return apiResponse(res, 400, "Input validation failed", formattedErrors);
    }
    return next(error);
  }
};

module.exports = validate;
