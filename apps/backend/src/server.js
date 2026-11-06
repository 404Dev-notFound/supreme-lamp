const http = require("http");
const { app } = require("./app");
const config = require("./config");
const { prisma, pool } = require("./lib/prisma");
const { initSocket } = require("./realtime/socket");
const { closeRedisConnections, queues } = require("./lib/redis");

const server = http.createServer(app);

// Initialize real-time Socket.IO server
const io = initSocket(server);

// Graceful shutdown handling
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received. Initiating graceful shutdown...`);

  // Force shutdown timeout after 10s if hanging
  const forceExitTimeout = setTimeout(() => {
    console.error("Shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  // 1. Close HTTP server (stop accepting new connections)
  server.close(async (err) => {
    if (err) {
      console.error("Error closing HTTP server:", err);
    } else {
      console.log("HTTP server closed.");
    }

    // 2. Close Socket.IO connections
    if (io && typeof io.close === "function") {
      try {
        io.close();
        console.log("Socket.IO connections closed.");
      } catch (ioErr) {
        console.error("Error closing Socket.IO:", ioErr);
      }
    }

    // 3. Disconnect Prisma and Postgres pool
    try {
      await prisma.$disconnect();
      console.log("Prisma client disconnected.");
    } catch (dbErr) {
      console.error("Error disconnecting Prisma:", dbErr);
    }

    try {
      if (pool && typeof pool.end === "function") {
        await pool.end();
        console.log("PostgreSQL connection pool closed.");
      }
    } catch (poolErr) {
      console.error("Error ending PostgreSQL pool:", poolErr);
    }

    // 4. Disconnect Redis and close background queues
    try {
      if (queues && typeof queues.closeQueuesAndWorkers === "function") {
        await queues.closeQueuesAndWorkers();
        console.log("BullMQ queues and workers closed.");
      }
      if (typeof closeRedisConnections === "function") {
        await closeRedisConnections();
        console.log("Redis connections closed.");
      }
    } catch (redisErr) {
      console.error("Error closing Redis connections:", redisErr);
    }

    clearTimeout(forceExitTimeout);
    console.log("Graceful shutdown complete.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Server startup with database verification
async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection verified successfully.");
  } catch (err) {
    console.error("Database connection verification:", err.message);
    if (config.isProduction) {
      console.error("FATAL: Database connection failed in production. Server startup aborted.");
      process.exit(1);
    }
  }

  server.listen(config.port, () => {
    console.log(`flowCTRL API server running in ${config.env} mode on port ${config.port}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

module.exports = server;
