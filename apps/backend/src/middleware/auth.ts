import { Request, Response, NextFunction } from "express";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = await getToken({ req, secret });

    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Token missing or invalid." });
    }

    // Attach user to request
    (req as any).user = token;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !user.role || !roles.includes(user.role as string)) {
      return res
        .status(403)
        .json({ error: "Forbidden. Insufficient permissions." });
    }

    next();
  };
};
