const http = require("http");
const { app } = require("./app");
const config = require("./config");
const { initSocket } = require("./realtime/socket");

const server = http.createServer(app);

// Initialize real-time Socket.IO server
initSocket(server);

server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing HTTP server cleanly...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Closing HTTP server cleanly...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

module.exports = server;
