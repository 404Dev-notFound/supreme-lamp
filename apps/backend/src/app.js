const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const { initTelemetry } = require("./telemetry");
const { authRouter } = require("./routes/auth.routes");
const { usersRouter } = require("./routes/users");
const { roadmapsRouter } = require("./routes/roadmaps");
const { csrfProtection } = require("./middleware/csrf");
const { requireAuth, requireRole } = require("./middleware/auth.middleware");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");

initTelemetry();

const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Origin not allowed."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-flowctrl-csrf",
      "x-requested-with",
    ],
  }),
);

// HTTP Logging (disabled during tests)
if (!config.isTest) {
  app.use(morgan("dev"));
}

// Request Body Parsing with sensible size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Double-submit CSRF Protection on state-mutating requests
app.use("/api", csrfProtection);

// Health Check Routes
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Welcome to flowCTRL API" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "flowCTRL API is running" });
});

// Authentication & Identity Routes
app.use("/api/auth", authRouter);

// User & Profile Management Routes
app.use("/api/users", usersRouter);

// Roadmaps Catalog & Progress Routes
app.use("/api/roadmaps", roadmapsRouter);

// Protected Mission Control Route
app.get("/api/dashboard", requireAuth, (req, res) => {
  res.status(200).json({
    message: "Welcome to your Mission Control Center",
    user: req.user,
  });
});

// Protected Admin Panel Route
app.get(
  "/api/admin",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  (req, res) => {
    res.status(200).json({
      message: "Welcome to the Admin Panel",
      user: req.user,
    });
  },
);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
