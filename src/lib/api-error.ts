/**
 * Standardized API Error Handling
 * Provides consistent error responses across all API routes
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "DATABASE_ERROR"
  | "VALIDATION_ERROR"
  | "EXTERNAL_API_ERROR";

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorCode;
  message: string;
  details?: any;
}

export interface ApiSuccessResponse<T = any> {
  ok: true;
  data?: T;
  [key: string]: any;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: ApiErrorCode,
  message: string,
  status: number,
  details?: any
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    ok: false,
    error,
    message,
  };

  if (details && process.env.NODE_ENV === "development") {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T = any>(
  data?: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ ok: true, ...data } as any, { status });
}

/**
 * Handle API errors with consistent formatting
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error("API Error:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Invalid request data",
      400,
      error.issues
    );
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return createErrorResponse(error.code, error.message, error.status, error.details);
  }

  // Generic errors
  if (error instanceof Error) {
    return createErrorResponse(
      "SERVER_ERROR",
      process.env.NODE_ENV === "development"
        ? error.message
        : "An unexpected error occurred",
      500,
      process.env.NODE_ENV === "development" ? error.stack : undefined
    );
  }

  // Unknown errors
  return createErrorResponse(
    "SERVER_ERROR",
    "An unexpected error occurred",
    500
  );
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError("FORBIDDEN", message, 403);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError("NOT_FOUND", message, 404);
  }

  static invalidRequest(message = "Invalid request", details?: any): ApiError {
    return new ApiError("INVALID_REQUEST", message, 400, details);
  }

  static rateLimited(message = "Rate limit exceeded", details?: any): ApiError {
    return new ApiError("RATE_LIMITED", message, 429, details);
  }

  static serverError(message = "Internal server error", details?: any): ApiError {
    return new ApiError("SERVER_ERROR", message, 500, details);
  }

  static databaseError(message = "Database error", details?: any): ApiError {
    return new ApiError("DATABASE_ERROR", message, 500, details);
  }

  static externalApiError(message = "External API error", details?: any): ApiError {
    return new ApiError("EXTERNAL_API_ERROR", message, 502, details);
  }
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Log error to monitoring service (placeholder for future implementation)
 */
export function logError(error: Error, context?: Record<string, any>) {
  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === "production") {
    // Example: Sentry.captureException(error, { extra: context });
    console.error("Production Error:", error, context);
  } else {
    console.error("Development Error:", error, context);
  }
}
