const { getToken } = require("next-auth/jwt");

const secret = process.env.NEXTAUTH_SECRET;

const requireAuth = async (req, res, next) => {
  try {
    let token = await getToken({ req, secret });

    // Fallback: check Authorization header if raw Bearer token was passed
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      const rawToken = req.headers.authorization.split(" ")[1];
      try {
        const jwt = require("jsonwebtoken");
        token = jwt.verify(rawToken, secret);
      } catch {}
    }

    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Token missing or invalid." });
    }

    // Attach user to request
    req.user = token;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.role || !roles.includes(user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden. Insufficient permissions." });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
