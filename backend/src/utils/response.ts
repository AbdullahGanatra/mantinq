import { Response } from "express";

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: any;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: ApiResponse["meta"]
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  errors?: any
) => {
  const response: ApiResponse = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};
