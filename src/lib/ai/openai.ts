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
  const model = env.OPENAI_MODEL ?? "gpt-4o-mini";
  
  // Known working models as of Feb 2026
  const knownModels = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k",
    "o1-mini",
    "o1-preview"
  ];
  
  // If user specified a model not in our known list, allow it but warn
  // (in case they have beta access to new models like gpt-5-mini)
  if (!knownModels.includes(model)) {
    console.warn(`⚠️ Using unverified model '${model}' (not in known models list)`);
    console.warn(`⚠️ If this fails, try switching to: ${knownModels.slice(0, 3).join(', ')}`);
  }
  
  console.log(`✅ Using OpenAI model: ${model}`);
  return model;
}


