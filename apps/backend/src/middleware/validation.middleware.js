/**
 * Validation Middleware Factory
 * -----------------------------
 * Intercepts requests, executes schema validation, attaches sanitized data,
 * and immediately halts invalid requests with standard 400 BAD_REQUEST.
 */

function validate(validatorFn) {
  return (req, res, next) => {
    const { isValid, errors, sanitized } = validatorFn(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: errors[0] || "Invalid request payload.",
        errors,
      });
    }

    req.validatedBody = sanitized;
    next();
  };
}

module.exports = { validate };
