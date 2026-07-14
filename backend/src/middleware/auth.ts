import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/generateTokens";
import { prisma } from "../config/database";
import { errorResponse } from "../utils/response";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Access token required", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return errorResponse(res, "User not found or inactive", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Invalid or expired token", 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, "Authentication required", 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, "Insufficient permissions", 403);
    }
    next();
  };
};
