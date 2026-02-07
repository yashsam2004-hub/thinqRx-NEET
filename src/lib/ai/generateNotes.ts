import { getOpenAIClient, getOpenAIModel } from "@/lib/ai/openai";
import { buildNotesPrompt, NOTES_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { buildMasterPrompt, MASTER_SYSTEM_PROMPT } from "@/lib/ai/masterPrompts";
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
  
  const client = getOpenAIClient();
  const model = getOpenAIModel();
  console.log("🤖 Using model:", model);

  // Use new master prompt system for better subject-aware generation
  const prompt = buildMasterPrompt({
    topicId: params.topicId,
    topicName: params.topicName,
    subjectName: params.subjectName,
    outline: params.outline,
  });
  console.log("📋 Master prompt built for", params.subjectName, "with", params.outline.length, "sections");

  let completion;
  
  try {
    console.log(`🔄 Calling OpenAI API (with 5 min timeout + SDK retries)...`);
    console.log(`📏 Prompt size: ${prompt.length} characters`);
    console.log(`⏱️ This may take 1-3 minutes for complex topics...`);
    
    // OpenAI SDK has built-in retries (maxRetries: 2) and 5-minute timeout
    // We add an additional timeout wrapper for safety (6 minutes = SDK timeout + buffer)
    completion = await Promise.race([
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: MASTER_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Notes generation timeout (6 minutes). Topic may be too large or network may be slow.")), 360000)
      ),
    ]);
    console.log("✅ OpenAI API call successful");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("❌ OpenAI API call failed:", err.message);
    
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
