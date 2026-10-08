const dotenv = require("dotenv");

// Load .env variables
dotenv.config();

const INSECURE_DEFAULT_SECRETS = [
  "super-secret-key-please-change_yes-sir-i-have-changed-it",
  "super-secret-refresh-key-please-change",
  "915b693d6ec72978dff75123dc5380fa57818c203cc7a1676d79aee95818235eb50d1d5c65db85e60d9954ee6c2eddb8",
];

const resolvedJwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
const resolvedRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (process.env.NODE_ENV === "production") {
  if (!resolvedJwtSecret || INSECURE_DEFAULT_SECRETS.includes(resolvedJwtSecret)) {
    throw new Error(
      "FATAL SECURITY CONFIGURATION: In production, JWT_SECRET / NEXTAUTH_SECRET must be set to a strong, uncommitted secret value.",
    );
  }
}

const config = {
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: parseInt(process.env.PORT || "5000", 10),

  db: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgrespassword9555@localhost:5432/flowCTRL",
  },

  jwt: {
    secret:
      resolvedJwtSecret ||
      "super-secret-key-please-change_yes-sir-i-have-changed-it",
    refreshSecret:
      resolvedRefreshSecret ||
      "super-secret-refresh-key-please-change",
    expiresIn: "15m",
    refreshExpiresIn: "30d",
  },

  cookies: {
    sessionName: "flowctrl_session",
    csrfName: "flowctrl_csrf",
    secure:
      process.env.COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production",
    sameSite: (process.env.COOKIE_SAME_SITE || "lax").toLowerCase(),
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },

  cors: {
    allowedOrigins: [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5000",
      process.env.APP_URL,
      process.env.FRONTEND_URL,
      process.env.NEXTAUTH_URL,
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
  },

  rateLimit: {
    authWindowMs: 15 * 60 * 1000, // 15 minutes
    authMaxAttempts: 15,
  },
};

module.exports = config;
