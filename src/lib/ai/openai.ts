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
  
  // Validate model name
  const validModels = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k"
  ];
  
  if (!validModels.includes(model)) {
    console.warn(`⚠️ Invalid OpenAI model '${model}'. Valid models: ${validModels.join(', ')}`);
    console.warn(`⚠️ Falling back to 'gpt-4o-mini'`);
    return "gpt-4o-mini";
  }
  
  console.log(`✅ Using OpenAI model: ${model}`);
  return model;
}


