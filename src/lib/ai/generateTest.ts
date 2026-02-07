import { getOpenAIClient, getOpenAIModel } from "@/lib/ai/openai";
import { buildTestPrompt, NOTES_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { testSchema, TestData } from "@/lib/ai/schemas";
import { sanitizeNotesData } from "@/lib/ai/sanitize";
import { validateMCQBatch, sanitizeMCQ } from "@/lib/ai/validateMCQ";

export async function generateTest(params: {
  topicId: string;
  topicName: string;
  subjectName: string;
  difficulty?: "easy" | "medium" | "hard";
  count: number;
}): Promise<TestData> {
  const client = getOpenAIClient();
  const model = getOpenAIModel();

  const prompt = buildTestPrompt({
    topicId: params.topicId,
    topicName: params.topicName,
    subjectName: params.subjectName,
    difficulty: params.difficulty || "medium",
    count: params.count,
  });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: NOTES_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("AI returned empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const data = testSchema.parse(parsed);

  // Validate MCQ integrity
  const validation = validateMCQBatch(data.questions);
  
  if (!validation.allValid) {
    const errorDetails = validation.results
      .filter(r => !r.validation.isValid)
      .map(r => `Q${r.questionId}: ${r.validation.errors.join(", ")}`)
      .join("; ");
    
    throw new Error(`MCQ validation failed: ${errorDetails}`);
  }

  // Log warnings for review (non-blocking)
  validation.results.forEach(result => {
    if (result.validation.warnings.length > 0) {
      console.warn(`MCQ ${result.questionId} warnings:`, result.validation.warnings);
    }
  });

  // Sanitize all questions
  const sanitizedQuestions = data.questions.map(q => sanitizeMCQ(q));

  // Reuse note sanitizer for string scans.
  sanitizeNotesData({
    topicId: data.topicId,
    topicName: data.topicName,
    subjectName: params.subjectName,
    sections: sanitizedQuestions.map((question) => ({
      id: question.id,
      title: "MCQ",
      blocks: [
        {
          type: "mcq",
          question: question.question,
          options: question.options,
          correctOptionId: question.correctOptionId,
          explanation: question.explanation,
        },
      ],
    })),
  });

  return {
    ...data,
    questions: sanitizedQuestions,
  };
}
