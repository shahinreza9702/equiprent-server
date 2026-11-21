
import type { Response } from "express";

interface ApiResponseOptions<T> {
  statusCode?: number;
  message: string;
  data?: T;
}

const sendResponse = <T>(
  res: Response,
  options: ApiResponseOptions<T>,
): Response => {
  const { statusCode = 200, message, data } = options;

  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  });
};

export default sendResponse;
