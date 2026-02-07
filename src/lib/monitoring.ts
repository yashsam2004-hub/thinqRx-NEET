/**
 * Monitoring and Performance Tracking
 * Placeholder for future integration with monitoring services
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count";
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
  url?: string;
}

/**
 * Track performance metrics
 */
export function trackPerformance(metric: PerformanceMetric) {
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Performance Metric:", metric);
  }

  // In production, send to monitoring service
  // Example: analytics.track('performance', metric);
}

/**
 * Track errors
 */
export function trackError(error: ErrorEvent) {
  if (process.env.NODE_ENV === "development") {
    console.error("🔴 Error Event:", error);
  }

  // In production, send to error tracking service
  // Example: Sentry.captureException(error);
}

/**
 * Track user events
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (process.env.NODE_ENV === "development") {
    console.log("📈 Event:", eventName, properties);
  }

  // In production, send to analytics service
  // Example: analytics.track(eventName, properties);
}

/**
 * Measure API response time
 */
export function measureApiTime(apiName: string) {
  const start = Date.now();

  return () => {
    const duration = Date.now() - start;
    trackPerformance({
      name: `api_${apiName}`,
      value: duration,
      unit: "ms",
      timestamp: Date.now(),
    });
  };
}

/**
 * Web Vitals tracking (client-side)
 */
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Web Vital:", metric);
  }

  // In production, send to analytics
  // Example: analytics.track('web_vital', metric);
}
