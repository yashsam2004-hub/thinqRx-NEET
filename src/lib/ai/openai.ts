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
    "gpt-5",           // GPT-5 (requires Tier 1+)
    "gpt-5-mini",      // GPT-5 Mini (requires Tier 1+, released Aug 2025)
    "gpt-5-nano",      // GPT-5 Nano (budget option)
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k",
    "o1-mini",
    "o1-preview"
  ];
  
  // Special models that require paid API tier
  const paidTierModels = ["gpt-5", "gpt-5-mini", "gpt-5-nano", "o1-mini", "o1-preview"];
  
  if (paidTierModels.includes(model)) {
    console.log(`💎 Using premium model '${model}' (requires paid OpenAI API tier)`);
  } else {
    console.log(`✅ Using OpenAI model: ${model}`);
  }
  
  return model;
}


