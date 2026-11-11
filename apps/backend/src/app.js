const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const { prisma } = require("./lib/prisma");
const { initTelemetry } = require("./telemetry");
const { requestIdMiddleware } = require("./middleware/requestId.middleware");
const { requestTimingMiddleware } = require("./middleware/requestTiming.middleware");
const { authRouter } = require("./routes/auth.routes");
const { usersRouter } = require("./routes/users.routes");
const { roadmapsRouter } = require("./routes/roadmaps.routes");
const { roadmapProgressRouter } = require("./routes/roadmapProgress.routes");
const { projectsRouter } = require("./routes/projects.routes");
const { jobsRouter } = require("./routes/jobs.routes");
const { mentorsRouter } = require("./routes/mentors.routes");
const { resumesRouter } = require("./routes/resumes.routes");
const { catalogRouter } = require("./routes/catalog.routes");
const { notificationsRouter } = require("./routes/notifications.routes");
const { announcementsRouter } = require("./routes/announcements.routes");
const { membershipRouter } = require("./routes/membership.routes");
const { premiumResourcesRouter } = require("./routes/premiumResources.routes");
const { adminRouter } = require("./routes/admin.routes");
const { gatewayRouter } = require("./routes/gateway.routes");
const { ragRouter } = require("./routes/rag.routes");
const { personalizedRoadmapsRouter } = require("./routes/personalizedRoadmaps.routes");
const { projectTutorialsRouter } = require("./routes/projectTutorials.routes");
const { dsaRouter } = require("./routes/dsa.routes");
const { coursesRouter } = require("./routes/courses.routes");
const { dashboardRouter } = require("./routes/dashboard.routes");
const { analyticsRouter } = require("./routes/analytics.routes");
const { csrfProtection } = require("./middleware/csrf");
const { requireAuth, requireRole } = require("./middleware/auth.middleware");
const {
  globalApiRateLimiter,
} = require("./middleware/rateLimit.middleware");
const {
  getRedisHealthReport,
  isRedisAvailable,
} = require("./lib/redis");
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

// Enable strong ETag generation for conditional caching and 304 Not Modified negotiation
app.set("etag", "strong");

// 3. Request ID & Request Timing Middleware for distributed tracing & metrics
app.use(requestIdMiddleware);
app.use(requestTimingMiddleware);

// 4. Host Header Injection Defense
app.use(hostHeaderGuard);

// 5. Production-grade Helmet Security Headers Configuration
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

// 6. Strict Cross-Origin Resource Sharing (CORS)
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
      "x-request-id",
      "If-None-Match",
      "If-Modified-Since",
      "Cache-Control",
    ],
    exposedHeaders: [
      "ETag",
      "Content-Length",
      "x-request-id",
      "x-response-time",
    ],
    maxAge: 86400, // 24 hours preflight cache
  }),
);

// 7. Slowloris & Request Timeout Guard (15 seconds)
app.use(requestTimeoutGuard(15000));

// 8. HTTP Logging (disabled during automated test runs)
if (!config.isTest) {
  app.use(morgan("combined"));
}

// 9. Strict Request Body Parsing with 500KB limits to prevent resource exhaustion / DoS
app.use(express.json({ limit: "500kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "500kb" }));

// 10. Prototype Pollution & Null-Byte Guard
app.use(prototypePollutionGuard);

// 11. HTTP Parameter Pollution (HPP) Guard
app.use(hppGuard({ whitelist: ["skills", "tags", "categories"] }));

// 12. Global API Rate Limiter
app.use("/api", globalApiRateLimiter);

// 13. Double-submit CSRF Protection on state-mutating API requests
app.use("/api", csrfProtection);

// 14. Root & Health Check Routes
app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({ status: "ok", message: "Welcome to flowCTRL API" });
});

const handleHealth = (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const redisAvailable = isRedisAvailable();
  res.status(200).json({
    status: redisAvailable ? "healthy" : "degraded",
    message: redisAvailable
      ? "flowCTRL API is running"
      : "flowCTRL API is running in resilient degraded mode (Redis offline)",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    redis: redisAvailable ? "connected" : "degraded_fallback",
    degraded: !redisAvailable,
  });
};

app.get("/health", handleHealth);
app.get("/api/health", handleHealth);

// Dedicated Redis Observability & Cache Health Diagnostic Route
const handleRedisHealth = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const report = await getRedisHealthReport();
  return res.status(200).json({
    success: true,
    data: report,
  });
};
app.get("/api/health/redis", handleRedisHealth);
app.get("/api/redis/health", handleRedisHealth);

// 15. Readiness Probe (checks database connection)
const handleReady = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisAvailable = isRedisAvailable();
    return res.status(200).json({
      status: "ready",
      database: "connected",
      redis: redisAvailable ? "connected" : "degraded_fallback",
      degraded: !redisAvailable,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
    });
  } catch (err) {
    return res.status(503).json({
      status: "not_ready",
      database: "disconnected",
      error: "Database connectivity check failed.",
    });
  }
};

app.get("/ready", handleReady);
app.get("/api/ready", handleReady);

// 16. OpenAPI Documentation Route
const openapiSpecPath = path.resolve(__dirname, "./docs/openapi.json");
app.get("/api/docs/openapi.json", (req, res) => {
  if (fs.existsSync(openapiSpecPath)) {
    res.setHeader("Content-Type", "application/json");
    res.sendFile(openapiSpecPath);
  } else {
    res.status(404).json({ error: "Documentation not found" });
  }
});

app.get("/api/docs", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).json({
    message: "flowCTRL API Documentation",
    specUrl: "/api/docs/openapi.json",
  });
});

// 17. Authentication & Identity Routes
app.use("/api/auth", authRouter);

// 18. User & Profile Management Routes
app.use("/api/users", usersRouter);
app.use("/api/user", usersRouter);

// 19. Roadmaps Catalog & Progress Routes
app.use("/api/roadmaps", roadmapsRouter);
app.use("/api/roadmaps", roadmapProgressRouter);

// 20. Projects & Collaboration Routes
app.use("/api/projects", projectsRouter);

// 21. Jobs, Companies & Applications Routes
app.use("/api/jobs", jobsRouter);

// 22. Mentors & Mentorship Routes
app.use("/api/mentors", mentorsRouter);

// 23. Resumes & ATS Analysis Routes
app.use("/api/resumes", resumesRouter);

// 24. Skills, Categories & Career Paths Catalog
app.use("/api/catalog", catalogRouter);

// 25. Membership Management & Subscription Routes
app.use("/api/membership", membershipRouter);

// 26. Curated Premium Learning Resources Routes
app.use("/api/resources", premiumResourcesRouter);

// 27. Notifications Routes
app.use("/api/notifications", notificationsRouter);
app.use("/api/announcements", announcementsRouter);

// 28. Admin Management Routes
app.use("/api/admin", adminRouter);

// 29. Internal Microservice Gateway Routes
app.use("/api/services", gatewayRouter);

// 30. RAG Personalized Roadmap & Recommendation Routes
app.use("/api/rag", ragRouter);
app.use("/api/personalized-roadmaps", personalizedRoadmapsRouter);

// 31. Project-Building Tutorials Discovery & Progress Routes
app.use("/api/project-tutorials", projectTutorialsRouter);

// 32. Data Structures & Algorithms (DSA) Knowledge Engine
app.use("/api/dsa", dsaRouter);

// 33. Premium Engineering Courses & Syllabi
app.use("/api/courses", coursesRouter);

// 34. Protected Mission Control Dashboard Route
app.use("/api/dashboard", dashboardRouter);

// 35. Platform Analytics & Interaction Event Engine
app.use("/api/analytics", analyticsRouter);

// 29. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
