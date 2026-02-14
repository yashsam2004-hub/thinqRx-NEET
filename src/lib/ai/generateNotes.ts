import { getOpenAIClient, getOpenAIModel } from "@/lib/ai/openai";
import { buildNotesPrompt, NOTES_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { buildMasterPrompt, MASTER_SYSTEM_PROMPT } from "@/lib/ai/masterPrompts";
import { buildQuickRevisionPrompt, QUICK_REVISION_SYSTEM_PROMPT } from "@/lib/ai/quickRevisionPrompts";
import { notesSchema, NotesData } from "@/lib/ai/schemas";
import { sanitizeNotesData } from "@/lib/ai/sanitize";
import { getChemicalStructureUrl } from "@/lib/chemistry/pubchem";

export async function generateNotes(params: {
  topicId: string;
  topicName: string;
  subjectName: string;
  outline: string[];
}): Promise<NotesData> {
  console.log("📝 Starting notes generation for:", params.topicName);
  console.log("🔍 Environment check:", {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyPrefix: process.env.OPENAI_API_KEY?.slice(0, 20),
    modelEnvVar: process.env.OPENAI_MODEL,
    nodeEnv: process.env.NODE_ENV,
  });
  
  const client = getOpenAIClient();
  const model = getOpenAIModel();
  console.log("🤖 Using model:", model);

  // Try Quick Revision first, fallback to Master if it fails
  const useQuickRevision = true; // Feature flag for gradual rollout
  
  let systemPrompt: string;
  let prompt: string;
  
  if (useQuickRevision) {
    // Use Quick Revision prompt system for outline-driven, GPAT-focused notes
    systemPrompt = QUICK_REVISION_SYSTEM_PROMPT;
    prompt = buildQuickRevisionPrompt({
      topicId: params.topicId,
      topicName: params.topicName,
      subjectName: params.subjectName,
      outline: params.outline,
    });
    console.log("📋 Quick Revision prompt built for", params.subjectName, "with", params.outline.length, "outline items");
  } else {
    // Fallback to master prompt
    systemPrompt = MASTER_SYSTEM_PROMPT;
    prompt = buildMasterPrompt({
      topicId: params.topicId,
      topicName: params.topicName,
      subjectName: params.subjectName,
      outline: params.outline,
    });
    console.log("📋 Master prompt built for", params.subjectName, "with", params.outline.length, "sections");
  }

  // GPT-5 models use max_completion_tokens, older models use max_tokens
  const isGPT5 = model.startsWith('gpt-5');
  
  let completion;
  
  
  try {
    console.log(`🔄 Calling OpenAI API (${useQuickRevision ? 'Quick Revision' : 'Master'} mode)...`);
    console.log(`📏 Prompt size: ${prompt.length} characters`);
    console.log(`⏱️ This may take 1-3 minutes for complex topics...`);
    
    // OpenAI SDK has built-in retries (maxRetries: 2) and 5-minute timeout
    // We add an additional timeout wrapper for safety (6 minutes = SDK timeout + buffer)
    const completionParams: any = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    };
    
    // Add parameters based on model
    if (isGPT5) {
      // GPT-5 models only support default temperature (1)
      // Do not set temperature parameter
      completionParams.max_completion_tokens = 16000; // GPT-5 supports up to 128K output tokens
    } else {
      // Other models support custom temperature
      completionParams.temperature = 0.7; // Slightly more creative for revision notes
    }
    // For non-GPT-5 models, we let OpenAI decide the output length
    
    completion = await Promise.race([
      client.chat.completions.create(completionParams),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Notes generation timeout (6 minutes). Topic may be too large or network may be slow.")), 360000)
      ),
    ]);
    console.log("✅ OpenAI API call successful");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("❌ OpenAI API call failed:", err.message);
    console.error("❌ Full error object:", JSON.stringify(error, null, 2));
    
    // Check if it's a model access error
    const errorStr = err.message.toLowerCase();
    const isModelError = errorStr.includes("model") || 
                        errorStr.includes("not found") || 
                        errorStr.includes("does not exist") ||
                        errorStr.includes("invalid");
    
    const isPermissionError = errorStr.includes("permission") ||
                             errorStr.includes("access") ||
                             errorStr.includes("tier") ||
                             errorStr.includes("quota") ||
                             errorStr.includes("rate limit");
    
    // Special handling for GPT-5 models
    if (model.startsWith("gpt-5") && (isModelError || isPermissionError)) {
      console.error(`❌ GPT-5 model access error! Model '${model}' requires a paid OpenAI API tier.`);
      console.error(`❌ GPT-5 mini is NOT available on free tier API keys.`);
      console.error(`❌ Solutions:`);
      console.error(`   1. Upgrade your OpenAI API to Tier 1+ (add $5+ to your OpenAI account)`);
      console.error(`   2. OR change OPENAI_MODEL to 'gpt-4o-mini' (works on free tier)`);
      throw new Error(
        `GPT-5 mini requires a paid OpenAI API tier. Either: (1) Add credits to your OpenAI account, or (2) Switch to 'gpt-4o-mini' in your .env.local and Vercel settings.`
      );
    }
    
    if (isModelError || isPermissionError) {
      console.error(`❌ Model access error! Model '${model}' may not exist or you don't have access.`);
      console.error(`❌ Try: gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo`);
      throw new Error(
        `OpenAI model '${model}' is not accessible. Check: (1) Model name is correct, (2) Your API key has access. Try 'gpt-4o-mini' instead.`
      );
    }
    
    // If Quick Revision failed and it's not an auth/network issue, try fallback
    if (useQuickRevision && !err.message.includes("API key") && !err.message.includes("ENOTFOUND") && !err.message.includes("fetch failed")) {
      console.log("⚠️ Quick Revision failed, trying Master prompt as fallback...");
      try {
        const fallbackPrompt = buildMasterPrompt({
          topicId: params.topicId,
          topicName: params.topicName,
          subjectName: params.subjectName,
          outline: params.outline,
        });
        
        const fallbackParams: any = {
          model,
          messages: [
            { role: "system", content: MASTER_SYSTEM_PROMPT },
            { role: "user", content: fallbackPrompt },
          ],
          response_format: { type: "json_object" },
        };
        
        // Add appropriate parameters for fallback
        if (isGPT5) {
          // GPT-5 only supports default temperature
          fallbackParams.max_completion_tokens = 16000;
        } else {
          // Other models support custom temperature
          fallbackParams.temperature = 0.7;
        }
        
        completion = await Promise.race([
          client.chat.completions.create(fallbackParams),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Fallback timeout")), 360000)
          ),
        ]);
        console.log("✅ Fallback to Master prompt successful");
      } catch (fallbackError) {
        console.error("❌ Both Quick Revision and Master prompt failed");
        console.error("❌ Fallback error:", fallbackError);
        // Will throw original error below
      }
    }
    
    // If still no completion after fallback attempt, throw error
    if (!completion) {
      // Better error diagnostics
      if (err.message.includes("timeout") || err.message.includes("ETIMEDOUT")) {
        throw new Error(
          "OpenAI API timeout. This usually indicates: (1) Network/VPN issues, (2) Firewall blocking api.openai.com, or (3) Very slow connection. Try disabling VPN or checking your network settings."
        );
      }
      
      if (err.message.includes("ENOTFOUND") || err.message.includes("fetch failed")) {
        throw new Error(
          "Cannot reach OpenAI API (api.openai.com). Check your internet connection, firewall, or VPN settings."
        );
      }
      
      if (err.message.includes("401") || err.message.includes("Incorrect API key")) {
        throw new Error(
          "Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local"
        );
      }
      
      throw new Error(`OpenAI API error: ${err.message}`);
    }
  }

  if (!completion) {
    throw new Error("No response received from OpenAI");
  }

  const content = completion.choices[0]?.message?.content ?? "";
  if (!content) {
    console.error("❌ OpenAI returned empty response");
    throw new Error("AI returned empty response");
  }
  console.log("📄 Response length:", content.length, "characters");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
    console.log("✅ JSON parsed successfully");
  } catch (parseError) {
    console.error("❌ Failed to parse JSON:", parseError);
    console.error("Content preview:", content.substring(0, 200));
    throw new Error("AI response was not valid JSON");
  }

  console.log("🔍 Validating against schema...");
  let data: NotesData;
  try {
    data = notesSchema.parse(parsed);
    console.log("✅ Schema validation passed");
    console.log("📊 Generated", data.sections.length, "sections with", 
      data.sections.reduce((sum, s) => sum + s.blocks.length, 0), "total blocks");
    
    sanitizeNotesData(data);
    console.log("✅ Data sanitized");
  } catch (schemaError: any) {
    console.error("❌ Schema validation failed!");
    console.error("❌ Error details:", schemaError);
    console.error("❌ AI response preview:", JSON.stringify(parsed, null, 2).substring(0, 1000));
    
    // Extract Zod error details if available
    let errorDetails = "Invalid format";
    if (schemaError?.errors && Array.isArray(schemaError.errors)) {
      const firstError = schemaError.errors[0];
      errorDetails = `${firstError.path.join('.')}: ${firstError.message}`;
    }
    
    throw new Error(`AI returned invalid format - ${errorDetails}. The response doesn't match our schema. Try regenerating or contact support.`);
  }

  // Fetch real chemical structure URLs from PubChem (with timeouts, non-blocking)
  console.log("🧪 Starting chemical structure enrichment...");
  enrichChemicalStructures(data).catch((err) => {
    console.warn("⚠️ Chemical structure enrichment failed:", err.message);
    // Don't block notes generation if chemical structures fail
  });

  console.log("✅ Notes generation complete!");
  return data;
}

/**
 * Fetch real chemical structure images from PubChem with timeout protection
 */
async function enrichChemicalStructures(data: NotesData) {
  const MAX_ENRICHMENT_TIME = 10000; // 10 seconds max for all chemical structures
  
  const enrichmentPromise = (async () => {
    for (const section of data.sections) {
      for (const block of section.blocks) {
        if (block.type === "chemicals") {
          // Fetch URLs for each chemical in parallel with individual timeouts
          const urlPromises = block.items.map(async (item) => {
            if (!item.imageUrl) {
              try {
                const url = await getChemicalStructureUrl(item.name);
                if (url) {
                  item.imageUrl = url;
                }
              } catch (error) {
                // Silently fail for individual chemicals
                console.warn(`Failed to load structure for ${item.name}`);
              }
            }
          });

          // Wait for all in this block, but don't let it hang
          await Promise.race([
            Promise.allSettled(urlPromises),
            new Promise((resolve) => setTimeout(resolve, 5000)), // 5 sec per block
          ]);
        }
      }
    }
  })();

  // Apply overall timeout to entire enrichment process
  try {
    await Promise.race([
      enrichmentPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Chemical structure fetch timeout")), MAX_ENRICHMENT_TIME)
      ),
    ]);
  } catch (error) {
    // If timeout, just continue without structures - don't fail notes generation
    console.warn("Chemical structure enrichment timed out, continuing without some structures");
  }
}
