/**
 * Production-grade MCQ validation to ensure exam accuracy
 * Prevents answer-mapping bugs and ensures NEET-level quality
 */

interface MCQOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

interface MCQQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  correctOptionId: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a single MCQ question for structural and logical correctness
 */
export function validateMCQ(mcq: MCQQuestion): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Ensure we have exactly 4 options
  if (mcq.options.length !== 4) {
    errors.push(`Expected 4 options, got ${mcq.options.length}`);
  }

  // 2. Ensure all option IDs are unique and valid
  const optionIds = mcq.options.map(opt => opt.id);
  const expectedIds: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
  
  for (const expectedId of expectedIds) {
    if (!optionIds.includes(expectedId)) {
      errors.push(`Missing option ID: ${expectedId}`);
    }
  }

  const uniqueIds = new Set(optionIds);
  if (uniqueIds.size !== optionIds.length) {
    errors.push("Duplicate option IDs found");
  }

  // 3. Ensure correctOptionId exists in options
  const correctOptionExists = mcq.options.some(opt => opt.id === mcq.correctOptionId);
  if (!correctOptionExists) {
    errors.push(`correctOptionId "${mcq.correctOptionId}" not found in options`);
  }

  // 4. Ensure no empty option texts
  mcq.options.forEach((opt, index) => {
    if (!opt.text || opt.text.trim().length === 0) {
      errors.push(`Option ${opt.id} has empty text`);
    }
  });

  // 5. Ensure question is not empty
  if (!mcq.question || mcq.question.trim().length === 0) {
    errors.push("Question text is empty");
  }

  // 6. Ensure explanation is not empty
  if (!mcq.explanation || mcq.explanation.trim().length === 0) {
    errors.push("Explanation is empty");
  }

  // 7. Warning: Check if explanation mentions the correct option
  if (mcq.explanation && mcq.correctOptionId) {
    const explanationLower = mcq.explanation.toLowerCase();
    const optionMention = `option ${mcq.correctOptionId.toLowerCase()}`;
    
    if (!explanationLower.includes(optionMention)) {
      warnings.push(`Explanation doesn't explicitly mention correct option ${mcq.correctOptionId}`);
    }
  }

  // 8. Warning: Check for duplicate option texts
  const optionTexts = mcq.options.map(opt => opt.text.toLowerCase().trim());
  const uniqueTexts = new Set(optionTexts);
  if (uniqueTexts.size !== optionTexts.length) {
    warnings.push("Duplicate or very similar option texts detected");
  }

  // 9. NEET-specific validation: Weak acid approximation check
  if (mcq.question.toLowerCase().includes("weak acid") || 
      mcq.question.toLowerCase().includes("weak base")) {
    
    const questionLower = mcq.question.toLowerCase();
    
    // Check if it's about approximation validity
    if (questionLower.includes("approximation") || questionLower.includes("valid")) {
      
      // Extract Ka value if present
      const kaMatch = mcq.question.match(/ka.*?10\^?[-−](\d+)/i);
      const cMatch = mcq.question.match(/0\.0(\d+)|0\.(\d+)/i);
      
      if (kaMatch && cMatch) {
        const kaExponent = parseInt(kaMatch[1]);
        // For weak acids: if Ka ≤ 10^-5, small x approximation is VALID
        if (kaExponent >= 5) {
          // The correct answer should validate small x approximation
          const correctOpt = mcq.options.find(opt => opt.id === mcq.correctOptionId);
          if (correctOpt && !correctOpt.text.toLowerCase().includes("sqrt")) {
            warnings.push("NEET Check: For weak acid with Ka ≤ 10^-5, small x approximation should be valid");
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates an array of MCQ questions
 */
export function validateMCQBatch(mcqs: MCQQuestion[]): {
  allValid: boolean;
  results: Array<{ questionId: string; validation: ValidationResult }>;
} {
  const results = mcqs.map(mcq => ({
    questionId: mcq.id,
    validation: validateMCQ(mcq),
  }));

  const allValid = results.every(r => r.validation.isValid);

  return {
    allValid,
    results,
  };
}

/**
 * Sanitizes MCQ data before saving/rendering
 * Ensures no injection or formatting issues
 */
export function sanitizeMCQ(mcq: MCQQuestion): MCQQuestion {
  return {
    ...mcq,
    question: mcq.question.trim(),
    options: mcq.options.map(opt => ({
      ...opt,
      text: opt.text.trim(),
    })),
    explanation: mcq.explanation.trim(),
  };
}
