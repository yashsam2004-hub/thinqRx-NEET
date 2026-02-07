/**
 * Production-Safe Logging Utility
 * 
 * Wraps console.log calls to prevent excessive logging in production.
 * Can be controlled via environment variables.
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === "true";

/**
 * Log a message (only in development or if debug is enabled)
 */
export function log(...args: any[]) {
  if (isDevelopment || isDebugEnabled) {
    console.log(...args);
  }
}

/**
 * Log an error (always logged, even in production)
 */
export function error(...args: any[]) {
  console.error(...args);
}

/**
 * Log a warning (always logged, even in production)
 */
export function warn(...args: any[]) {
  console.warn(...args);
}

/**
 * Log debug information (only in development or if debug is enabled)
 */
export function debug(...args: any[]) {
  if (isDevelopment || isDebugEnabled) {
    console.debug(...args);
  }
}

/**
 * Log info (only in development or if debug is enabled)
 */
export function info(...args: any[]) {
  if (isDevelopment || isDebugEnabled) {
    console.info(...args);
  }
}

/**
 * Always log (even in production) - use sparingly
 */
export function forceLog(...args: any[]) {
  console.log(...args);
}

export const logger = {
  log,
  error,
  warn,
  debug,
  info,
  forceLog,
};
