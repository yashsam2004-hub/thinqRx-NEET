/**
 * Mock Test Data Validation
 * Security: Ensure uploaded JSON is valid and safe
 */

import type { MockTestData, MockTestQuestion } from "@/types/mock-test";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate mock test JSON structure
 */
export function validateMockTestData(data: any): {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
} {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check required top-level fields
  if (!data.test_name || typeof data.test_name !== "string") {
    errors.push({ field: "test_name", message: "Test name is required" });
  }

  if (!data.exam_name || typeof data.exam_name !== "string") {
    errors.push({ field: "exam_name", message: "Exam name is required (e.g., GPAT, NIPER)" });
  }

  if (!data.questions || !Array.isArray(data.questions)) {
    errors.push({ field: "questions", message: "Questions array is required" });
    return { isValid: false, errors, warnings };
  }

  if (data.questions.length === 0) {
    errors.push({ field: "questions", message: "At least one question is required" });
  }

  // Validate duration
  if (!data.duration_minutes || typeof data.duration_minutes !== "number") {
    errors.push({ field: "duration_minutes", message: "Duration in minutes is required" });
  } else if (data.duration_minutes < 1 || data.duration_minutes > 600) {
    warnings.push("Duration should be between 1 and 600 minutes");
  }

  // Validate negative marking
  if (data.negative_marking && data.negative_marking_value) {
    if (data.negative_marking_value > 0) {
      warnings.push("Negative marking value should be negative (e.g., -1)");
    }
  }

  // Validate each question
  data.questions.forEach((q: any, index: number) => {
    const prefix = `Question ${index + 1}`;

    // Required fields
    if (!q.question_id) {
      errors.push({ field: `${prefix}.question_id`, message: "Question ID is required" });
    }

    if (!q.subject || typeof q.subject !== "string") {
      errors.push({ field: `${prefix}.subject`, message: "Subject is required" });
    }

    if (!q.question_text || typeof q.question_text !== "string") {
      errors.push({ field: `${prefix}.question_text`, message: "Question text is required" });
    }

    // Validate options
    if (!q.options || typeof q.options !== "object") {
      errors.push({ field: `${prefix}.options`, message: "Options object is required" });
    } else {
      const requiredOptions = ["A", "B", "C", "D"];
      for (const opt of requiredOptions) {
        if (!q.options[opt] || typeof q.options[opt] !== "string") {
          errors.push({ field: `${prefix}.options.${opt}`, message: `Option ${opt} is required` });
        }
      }
    }

    // Validate correct option
    if (!q.correct_option || !["A", "B", "C", "D"].includes(q.correct_option)) {
      errors.push({ field: `${prefix}.correct_option`, message: "Correct option must be A, B, C, or D" });
    }

    // Validate marks
    if (typeof q.marks !== "number" || q.marks <= 0) {
      errors.push({ field: `${prefix}.marks`, message: "Marks must be a positive number" });
    }

    // Validate difficulty (optional field, just warn if invalid)
    if (q.difficulty && !["Easy", "Medium", "Difficult", "Hard", "easy", "medium", "difficult", "hard"].includes(q.difficulty)) {
      warnings.push(`${prefix}: Difficulty should be Easy, Medium, Difficult, or Hard (case-insensitive)`);
    }

    // Check for duplicate question IDs
    const duplicates = data.questions.filter((other: any) => other.question_id === q.question_id);
    if (duplicates.length > 1) {
      errors.push({ field: `${prefix}.question_id`, message: `Duplicate question ID: ${q.question_id}` });
    }
  });

  // Check total marks calculation
  const calculatedTotalMarks = data.questions.reduce((sum: number, q: any) => sum + (q.marks || 4), 0);
  if (data.total_marks && data.total_marks !== calculatedTotalMarks) {
    warnings.push(`Total marks in data (${data.total_marks}) doesn't match calculated (${calculatedTotalMarks})`);
  }

  // Check total questions
  if (data.total_questions && data.total_questions !== data.questions.length) {
    warnings.push(`Total questions in data (${data.total_questions}) doesn't match actual (${data.questions.length})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize HTML in question text (prevent XSS)
 */
export function sanitizeQuestionHTML(html: string): string {
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

/**
 * Calculate max score for a test
 */
export function calculateMaxScore(questions: MockTestQuestion[]): number {
  return questions.reduce((sum, q) => sum + q.marks, 0);
}

/**
 * Validate response data (prevent client manipulation)
 */
export function validateResponses(
  responses: any[],
  questions: MockTestQuestion[]
): boolean {
  // Check if response count doesn't exceed question count
  if (responses.length > questions.length) {
    return false;
  }

  // Check each response
  for (const response of responses) {
    // Validate question_id exists
    const question = questions.find(q => q.question_id === response.question_id);
    if (!question) {
      return false;
    }

    // Validate selected_option is valid
    if (response.selected_option && !["A", "B", "C", "D", null].includes(response.selected_option)) {
      return false;
    }
  }

  return true;
}
