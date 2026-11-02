/**
 * Users Router
 * ------------
 * Forwards to canonical users.routes.js architecture while maintaining
 * backwards compatibility across existing test suites and imports.
 */
const { usersRouter } = require("./users.routes");

module.exports = { usersRouter };
