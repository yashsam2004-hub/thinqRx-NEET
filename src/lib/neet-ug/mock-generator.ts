/**
 * NEET UG Mock Test Generator
 * Generates NEET-compliant mock tests with proper subject weightage
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * NEET UG Official Scheme:
 * - Total Questions: 180 (200 with internal choice, 180 to attempt)
 * - Marking: +4 correct, -1 wrong
 * - Total Marks: 720
 * - Duration: 180 minutes (3 hours)
 * 
 * Subject Distribution:
 * - Physics: 45 questions
 * - Chemistry: 45 questions
 * - Biology (Botany): 45 questions
 * - Biology (Zoology): 45 questions
 */

export const NEET_SCHEME = {
  totalQuestions: 180,
  marksPerCorrect: 4,
  negativeMarks: 1,
  totalMarks: 720,
  durationMinutes: 180,
  subjectWeightage: {
    "Physics": 45,
    "Chemistry": 45,
    "Biology - Botany": 45,
    "Biology - Zoology": 45,
  },
} as const;

export interface NEETQuestion {
  id: string;
  subject: string;
  topic?: string;
  questionText: string;
  options: string[];
  answerKey: string; // "A", "B", "C", or "D"
  explanation?: string;
  marks: number;
  negative: number;
  order: number;
}

export interface NEETMockTest {
  id: string;
  title: string;
  type: "mock" | "grand";
  durationMinutes: number;
  questionCount: number;
  questions: NEETQuestion[];
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffle question options (except the answer)
 */
function shuffleOptions(question: NEETQuestion): NEETQuestion {
  const options = [...question.options];
  const answerIndex = ["A", "B", "C", "D"].indexOf(question.answerKey);
  
  if (answerIndex === -1) {
    console.error("Invalid answer key:", question.answerKey);
    return question;
  }

  const correctAnswer = options[answerIndex];
  const shuffled = shuffleArray(options);
  const newAnswerIndex = shuffled.indexOf(correctAnswer);
  const newAnswerKey = ["A", "B", "C", "D"][newAnswerIndex];

  return {
    ...question,
    options: shuffled,
    answerKey: newAnswerKey,
  };
}

/**
 * Generate a NEET mock test from question bank
 * Enforces NEET subject weightage and randomizes questions
 */
export async function generateNEETMockTest(
  testId: string,
  courseId: string,
  shuffleQuestions = true
): Promise<NEETMockTest | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Fetch test metadata
    const { data: testMeta, error: testError } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("id", testId)
      .eq("course_id", courseId)
      .single();

    if (testError || !testMeta) {
      console.error("Test not found:", testError);
      return null;
    }

    // Fetch all questions for this test
    const { data: allQuestions, error: questionsError } = await supabase
      .from("mock_questions")
      .select("*")
      .eq("test_id", testId)
      .order("order", { ascending: true });

    if (questionsError || !allQuestions || allQuestions.length === 0) {
      console.error("No questions found:", questionsError);
      return null;
    }

    // Group questions by subject
    const questionsBySubject = new Map<string, typeof allQuestions>();
    
    allQuestions.forEach((q) => {
      const subject = q.subject || "Others";
      if (!questionsBySubject.has(subject)) {
        questionsBySubject.set(subject, []);
      }
      questionsBySubject.get(subject)!.push(q);
    });

    // Select questions according to NEET weightage
    let selectedQuestions: typeof allQuestions = [];

    for (const [subject, count] of Object.entries(NEET_SCHEME.subjectWeightage)) {
      const availableQuestions = questionsBySubject.get(subject) || [];
      
      if (availableQuestions.length < count) {
        console.warn(
          `Not enough questions for ${subject}. Need ${count}, have ${availableQuestions.length}`
        );
        selectedQuestions.push(...availableQuestions);
      } else {
        const shuffled = shuffleQuestions 
          ? shuffleArray(availableQuestions)
          : availableQuestions;
        selectedQuestions.push(...shuffled.slice(0, count));
      }
    }

    // Ensure we have exactly 180 questions (or less if not enough in bank)
    if (selectedQuestions.length > NEET_SCHEME.totalQuestions) {
      selectedQuestions = selectedQuestions.slice(0, NEET_SCHEME.totalQuestions);
    }

    // Shuffle question order (if enabled)
    if (shuffleQuestions) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    // Convert to NEETQuestion format and shuffle options
    const formattedQuestions: NEETQuestion[] = selectedQuestions.map((q, index) => {
      const options = Array.isArray(q.options) 
        ? q.options 
        : typeof q.options === 'object'
          ? Object.values(q.options)
          : [];

      const question: NEETQuestion = {
        id: q.id,
        subject: q.subject || "Others",
        topic: q.topic || undefined,
        questionText: q.question_text,
        options: options as string[],
        answerKey: q.answer_key,
        explanation: q.explanation || undefined,
        marks: q.marks || NEET_SCHEME.marksPerCorrect,
        negative: q.negative || NEET_SCHEME.negativeMarks,
        order: index + 1,
      };

      return shuffleQuestions ? shuffleOptions(question) : question;
    });

    return {
      id: testMeta.id,
      title: testMeta.title,
      type: testMeta.type,
      durationMinutes: testMeta.duration_minutes || NEET_SCHEME.durationMinutes,
      questionCount: formattedQuestions.length,
      questions: formattedQuestions,
    };
  } catch (error) {
    console.error("Error generating NEET mock test:", error);
    return null;
  }
}

/**
 * Calculate NEET score with proper marking scheme
 */
export function calculateNEETScore(
  questions: NEETQuestion[],
  answers: Map<string, number | null>
): {
  score: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  maxScore: number;
  percentage: number;
  subjectWise: Record<string, { correct: number; incorrect: number; unattempted: number }>;
} {
  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  const subjectWise: Record<string, { correct: number; incorrect: number; unattempted: number }> = {};

  questions.forEach((question) => {
    const userAnswer = answers.get(question.id);
    const correctAnswerIndex = ["A", "B", "C", "D"].indexOf(question.answerKey);

    if (!subjectWise[question.subject]) {
      subjectWise[question.subject] = { correct: 0, incorrect: 0, unattempted: 0 };
    }

    if (userAnswer === null || userAnswer === undefined) {
      unattempted++;
      subjectWise[question.subject].unattempted++;
    } else if (userAnswer === correctAnswerIndex) {
      correct++;
      score += question.marks; // +4
      subjectWise[question.subject].correct++;
    } else {
      incorrect++;
      score -= question.negative; // -1
      subjectWise[question.subject].incorrect++;
    }
  });

  const maxScore = questions.length * NEET_SCHEME.marksPerCorrect;
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    score,
    correct,
    incorrect,
    unattempted,
    maxScore,
    percentage,
    subjectWise,
  };
}

/**
 * Validate if question bank meets NEET requirements
 */
export async function validateNEETQuestionBank(
  testId: string
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  subjectCounts: Record<string, number>;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const subjectCounts: Record<string, number> = {};

  try {
    const supabase = await createSupabaseServerClient();

    const { data: questions } = await supabase
      .from("mock_questions")
      .select("subject")
      .eq("test_id", testId);

    if (!questions || questions.length === 0) {
      errors.push("No questions found for this test");
      return { valid: false, errors, warnings, subjectCounts };
    }

    // Count questions by subject
    questions.forEach((q) => {
      const subject = q.subject || "Others";
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    // Validate against NEET scheme
    for (const [subject, required] of Object.entries(NEET_SCHEME.subjectWeightage)) {
      const available = subjectCounts[subject] || 0;
      
      if (available < required) {
        errors.push(
          `Insufficient questions for ${subject}: need ${required}, have ${available}`
        );
      } else if (available === required) {
        warnings.push(
          `Exactly ${required} questions for ${subject}. Consider adding more for randomization.`
        );
      }
    }

    const totalQuestions = Object.values(subjectCounts).reduce((a, b) => a + b, 0);
    if (totalQuestions < NEET_SCHEME.totalQuestions) {
      errors.push(
        `Total questions (${totalQuestions}) less than required (${NEET_SCHEME.totalQuestions})`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      subjectCounts,
    };
  } catch (error) {
    errors.push("Failed to validate question bank");
    return { valid: false, errors, warnings, subjectCounts };
  }
}
