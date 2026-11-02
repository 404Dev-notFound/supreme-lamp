/**
 * Roadmaps Router
 * ---------------
 * Forwards to canonical roadmaps.routes.js architecture while maintaining
 * backwards compatibility across existing test suites and imports.
 */
const { roadmapsRouter } = require("./roadmaps.routes");

module.exports = { roadmapsRouter };
