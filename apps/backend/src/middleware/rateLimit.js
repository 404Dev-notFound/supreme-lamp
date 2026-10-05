const {
  createRateLimiter,
  authRateLimiter,
} = require("./rateLimit.middleware");

module.exports = {
  createRateLimiter,
  authRateLimiter,
};
