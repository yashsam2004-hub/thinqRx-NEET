/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */

import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().optional(),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // App Config
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  ADMIN_ALLOWLIST: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

// Validate on module load (server-side only)
// Note: We don't use process.exit() here because it's not supported in Edge Runtime
let env: Env;

try {
  env = validateEnv();
  if (process.env.NODE_ENV !== "test") {
    console.log("✅ Environment variables validated");
  }
} catch (error) {
  console.error("Failed to validate environment variables:", error);
  // Throw error to prevent app from starting with invalid config
  // This will be caught by Next.js and show a proper error page
  throw error;
}

export { env };

/**
 * Get admin allowlist from environment
 * Returns array of admin email addresses
 */
export function getAdminAllowlist(): string[] {
  const allowlist = process.env.ADMIN_ALLOWLIST || "";
  return allowlist.split(",").map((email) => email.trim()).filter(Boolean);
}

/**
 * Get a client-safe subset of environment variables
 * These are safe to expose to the browser
 */
export function getPublicEnv() {
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };
}
