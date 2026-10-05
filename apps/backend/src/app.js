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
  globalApiRateLimiter,
} = require("./middleware/rateLimit.middleware");
const {
  prototypePollutionGuard,
  hppGuard,
  hostHeaderGuard,
  requestTimeoutGuard,
} = require("./middleware/security.middleware");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");

initTelemetry();

const app = express();

// 1. Trust reverse proxy for correct client IP detection in rate limiting and secure cookies
app.set("trust proxy", 1);

// 2. Disable X-Powered-By header to prevent technology fingerprinting
app.disable("x-powered-by");

// 3. Host Header Injection Defense
app.use(hostHeaderGuard);

// 4. Production-grade Helmet Security Headers Configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);

// 5. Strict Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, mobile apps, or local curl in test)
      if (!origin) {
        return callback(null, true);
      }

      if (config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS policy violation: Origin '${origin}' is not authorized.`),
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-flowctrl-csrf",
      "x-requested-with",
      "x-test-rate-limit",
    ],
    maxAge: 86400, // 24 hours preflight cache
  }),
);

// 6. Slowloris & Request Timeout Guard (15 seconds)
app.use(requestTimeoutGuard(15000));

// 7. HTTP Logging (disabled during automated test runs)
if (!config.isTest) {
  app.use(morgan("combined"));
}

// 8. Strict Request Body Parsing with 500KB limits to prevent resource exhaustion / DoS
app.use(express.json({ limit: "500kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "500kb" }));

// 9. Prototype Pollution & Null-Byte Guard
app.use(prototypePollutionGuard);

// 10. HTTP Parameter Pollution (HPP) Guard
app.use(hppGuard({ whitelist: ["skills", "tags", "categories"] }));

// 11. Global API Rate Limiter
app.use("/api", globalApiRateLimiter);

// 12. Double-submit CSRF Protection on state-mutating API requests
app.use("/api", csrfProtection);

// 13. Health Check Routes
app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({ status: "ok", message: "Welcome to flowCTRL API" });
});

app.get("/api/health", (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({ status: "ok", message: "flowCTRL API is running" });
});

// 14. Authentication & Identity Routes
app.use("/api/auth", authRouter);

// 15. User & Profile Management Routes
app.use("/api/users", usersRouter);

// 16. Roadmaps Catalog & Progress Routes
app.use("/api/roadmaps", roadmapsRouter);

// 17. Protected Mission Control Route
app.get("/api/dashboard", requireAuth, (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({
    message: "Welcome to your Mission Control Center",
    user: req.user,
  });
});

// 18. Protected Admin Panel Route
app.get(
  "/api/admin",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  (req, res) => {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).json({
      message: "Welcome to the Admin Panel",
      user: req.user,
    });
  },
);

// 19. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
