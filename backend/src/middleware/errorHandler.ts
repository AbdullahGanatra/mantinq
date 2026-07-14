import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response";
import { logger } from "../config/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  if (err.name === "ValidationError") {
    return errorResponse(res, "Validation Error", 400, err.errors);
  }

  if (err.name === "PrismaClientKnownRequestError") {
    if (err.code === "P2002") {
      return errorResponse(res, "Duplicate entry found", 409);
    }
    if (err.code === "P2025") {
      return errorResponse(res, "Record not found", 404);
    }
    return errorResponse(res, "Database error", 500);
  }

  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, "Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Token expired", 401);
  }

  return errorResponse(
    res,
    err.message || "Internal Server Error",
    err.statusCode || 500
  );
};
