import OpenAI from "openai";
import { env } from "@/lib/env";

export function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing from environment");
    throw new Error("OPENAI_API_KEY not configured. Please check your .env.local file.");
  }
  
  console.log("✅ OpenAI API key found, creating client...");
  return new OpenAI({ 
    apiKey: env.OPENAI_API_KEY,
    timeout: 300000, // 5 minutes timeout (increased for structure enhancement)
    maxRetries: 2, // OpenAI SDK will retry 2 times
  });
}

export function getOpenAIModel() {
  return env.OPENAI_MODEL ?? "gpt-4o-mini"; // Default to gpt-4o-mini if not configured
}


