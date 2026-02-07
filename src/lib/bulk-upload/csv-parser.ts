/**
 * CSV/JSON Parser for Bulk Upload
 * Parses question files for mock tests
 */

export interface ParsedQuestion {
  question_id: string;
  subject: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Difficult";
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_option: "A" | "B" | "C" | "D";
  explanation: string;
  marks: number;
  negative_marks: number;
}

export interface ParseResult {
  success: boolean;
  questions?: ParsedQuestion[];
  error?: string;
  errors?: string[];
  warnings?: string[];
  stats?: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * Parse CSV content into questions array
 */
export function parseCSV(csvContent: string): ParseResult {
  try {
    const lines = csvContent.split("\n");
    const questions: ParsedQuestion[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(",");
      if (values.length < 12) continue;
      
      questions.push({
        question_id: values[0],
        subject: values[1],
        topic: values[2],
        difficulty: values[3] as "Easy" | "Medium" | "Difficult",
        question_text: values[4],
        options: {
          A: values[5],
          B: values[6],
          C: values[7],
          D: values[8],
        },
        correct_option: values[9] as "A" | "B" | "C" | "D",
        explanation: values[10],
        marks: parseInt(values[11]) || 4,
        negative_marks: parseInt(values[12]) || -1,
      });
    }
    
    return { success: true, questions };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse CSV",
    };
  }
}

/**
 * Parse JSON content into questions array
 */
export function parseJSON(jsonContent: string): ParseResult {
  try {
    const data = JSON.parse(jsonContent);
    
    let questions: ParsedQuestion[] = [];
    
    // If it's an object with a questions array
    if (data.questions && Array.isArray(data.questions)) {
      questions = data.questions;
    } else if (Array.isArray(data)) {
      // If it's directly an array
      questions = data;
    }
    
    if (questions.length === 0) {
      return {
        success: false,
        error: "No questions found in JSON",
        errors: ["No questions found in JSON"],
        warnings: [],
        stats: {
          total: 0,
          valid: 0,
          invalid: 0,
        },
      };
    }
    
    return {
      success: true,
      questions,
      stats: {
        total: questions.length,
        valid: questions.length,
        invalid: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
      errors: [error instanceof Error ? error.message : "Failed to parse JSON"],
      warnings: [],
      stats: {
        total: 0,
        valid: 0,
        invalid: 0,
      },
    };
  }
}
