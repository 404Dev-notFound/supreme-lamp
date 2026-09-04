const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { initTelemetry } = require("./telemetry");
const { roadmapsRouter } = require("./routes/roadmaps");
const { requireAuth, requireRole } = require("./middleware/auth");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

dotenv.config();
initTelemetry();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Routes
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Welcome to flowCTRL API" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "flowCTRL API is running" });
});

// Roadmap Routes
app.use("/api/roadmaps", roadmapsRouter);

// Protected Route Example
app.get("/api/dashboard", requireAuth, (req, res) => {
  const user = req.user;
  res.status(200).json({
    message: "Welcome to your Mission Control Center",
    user,
  });
});

// Admin Route Example
app.get(
  "/api/admin",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  (req, res) => {
    res.status(200).json({
      message: "Welcome to the Admin Panel",
    });
  },
);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server if directly run
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = { app };
