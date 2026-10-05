const { app } = require("./app");
const config = require("./config");

// Start server if directly executed
if (process.env.NODE_ENV !== "test") {
  require("./server");
}

module.exports = { app };
