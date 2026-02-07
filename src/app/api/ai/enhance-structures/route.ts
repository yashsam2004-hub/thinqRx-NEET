/**
 * Structure Enhancement API Route
 * 
 * Non-destructive enhancement that ONLY adds chemical structures
 * to existing notes without modifying explanatory content.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getOpenAIClient, getOpenAIModel } from "@/lib/ai/openai";
import { buildStructureEnhancementPrompt, STRUCTURE_ENHANCEMENT_SYSTEM_PROMPT } from "@/lib/ai/structurePrompts";
import { notesSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  subjectName: z.string(),
  topicName: z.string(),
  existingNotes: z.any(), // The current notes data
});

export async function POST(request: NextRequest) {
  try {
    console.log("🎨 Structure enhancement request received");
    
    // Parse and validate request
    const body = await request.json();
    const { subjectName, topicName, existingNotes } = requestSchema.parse(body);
    
    console.log("📝 Enhancing structures for:", topicName, "in", subjectName);
    
    // Validate existing notes structure
    console.log("🔍 Existing notes metadata:", {
      hasTopicId: !!existingNotes.topicId,
      hasTopicName: !!existingNotes.topicName,
      hasSubjectName: !!existingNotes.subjectName,
      hasSections: !!existingNotes.sections,
      sectionsCount: existingNotes.sections?.length,
      topicId: existingNotes.topicId || 'MISSING',
      topicName: existingNotes.topicName || 'MISSING',
      subjectName: existingNotes.subjectName || 'MISSING',
    });
    
    // Build structure-specific prompt
    const prompt = buildStructureEnhancementPrompt({
      subjectName,
      topicName,
      existingNotes,
    });
    
    console.log("📏 Prompt size:", prompt.length, "characters");
    console.log("🔍 Analyzing existing blocks:", 
      existingNotes.sections?.reduce((sum: number, s: any) => sum + (s.blocks?.length || 0), 0));
    
    const client = getOpenAIClient();
    const model = getOpenAIModel();
    
    // Call OpenAI for structure enhancement
    console.log("🔄 Calling OpenAI for structure augmentation...");
    console.log("⏱️ This may take 1-3 minutes for large topics...");
    let completion;
    
    try {
      completion = await Promise.race([
        client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: STRUCTURE_ENHANCEMENT_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          // Note: temperature removed as some models (gpt-4o-mini, gpt-5-mini) only support default value
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Structure enhancement timeout (5 minutes)")), 300000) // Increased to 5 minutes
        ),
      ]);
      console.log("✅ Structure enhancement completed");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("❌ Structure enhancement failed:", err.message);
      
      if (err.message.includes("timeout")) {
        return NextResponse.json(
          { ok: false, error: "Structure enhancement timed out. Try with a smaller topic or check network." },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 500 }
      );
    }
    
    const content = completion.choices[0]?.message?.content ?? "";
    if (!content) {
      console.error("❌ OpenAI returned empty response");
      return NextResponse.json(
        { ok: false, error: "AI returned empty response for structure enhancement" },
        { status: 500 }
      );
    }
    
    console.log("📄 Response length:", content.length, "characters");
    
    // Parse and validate
    let enhancedNotes: any;
    try {
      enhancedNotes = JSON.parse(content);
      console.log("✅ JSON parsed successfully");
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      console.error("Content preview:", content.substring(0, 300));
      return NextResponse.json(
        { ok: false, error: "AI response was not valid JSON" },
        { status: 500 }
      );
    }
    
    // Validate against schema
    console.log("🔍 Validating enhanced notes against schema...");
    console.log("📊 Enhanced notes structure:", JSON.stringify({
      hasTopicId: !!enhancedNotes.topicId,
      hasTopicName: !!enhancedNotes.topicName,
      hasSubjectName: !!enhancedNotes.subjectName,
      hasSections: !!enhancedNotes.sections,
      sectionsCount: enhancedNotes.sections?.length,
      topLevelKeys: Object.keys(enhancedNotes),
    }, null, 2));
    
    try {
      const validatedNotes = notesSchema.parse(enhancedNotes);
      console.log("✅ Schema validation passed");
      
      // Count added structures
      const addedStructures = validatedNotes.sections.reduce((sum, section) => {
        return sum + section.blocks.filter((block: any) => 
          (block.type === 'reaction') && 
          block.enhancement_type === 'STRUCTURE_AUGMENTATION'
        ).length;
      }, 0);
      
      console.log("🎨 Added", addedStructures, "new structure blocks");
      
      return NextResponse.json({
        ok: true,
        data: validatedNotes,
        meta: {
          structuresAdded: addedStructures,
          enhancementType: 'STRUCTURE_AUGMENTATION',
        },
      });
    } catch (schemaError: any) {
      console.error("❌ Schema validation failed!");
      console.error("Full error:", JSON.stringify(schemaError, null, 2));
      
      // Log response preview for debugging
      console.error("❌ AI response preview:", JSON.stringify(enhancedNotes, null, 2).substring(0, 2000));
      
      // Extract detailed Zod error information
      let errorDetails = "Invalid format";
      if (schemaError?.errors && Array.isArray(schemaError.errors)) {
        const firstError = schemaError.errors[0];
        errorDetails = `${firstError.path.join('.')}: ${firstError.message}`;
        console.error("❌ First Zod error:", {
          path: firstError.path,
          message: firstError.message,
          received: firstError.received,
        });
        
        // Show first 3 errors for context
        if (schemaError.errors.length > 1) {
          console.error("❌ Additional errors:", schemaError.errors.slice(0, 3).map((e: any) => ({
            path: e.path.join('.'),
            message: e.message,
          })));
        }
      }
      
      return NextResponse.json(
        { ok: false, error: `Structure enhancement returned invalid format: ${errorDetails}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Structure enhancement error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
