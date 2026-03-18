/**
 * NEET UG Mock Test Generator
 * Generates NEET UG-compliant mock tests with proper subject weightage
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * NEET UG Official Scheme:
 * - Total Questions: 180
 * - Marking: +4 correct, -1 wrong
 * - Total Marks: 720
 * - Duration: 180 minutes (3 hours)
 * 
 * Subject Distribution:
 * - Physics: 45 questions (180 marks)
 * - Chemistry: 45 questions (180 marks)
 * - Biology (Botany): 45 questions (180 marks)
 * - Biology (Zoology): 45 questions (180 marks)
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
 * Generate a full NEET UG mock test from database questions
 */
export async function generateNEETMockTest(options: {
  courseId: string;
  shuffleQuestions?: boolean;
  shuffleOpts?: boolean;
}): Promise<NEETMockTest | null> {
  const supabase = await createSupabaseServerClient();
  
  try {
    // Fetch questions from mock_questions table by subject
    const { data: questions, error } = await supabase
      .from("mock_questions")
      .select("*")
      .order("order");

    if (error || !questions || questions.length < NEET_SCHEME.totalQuestions) {
      console.error("Insufficient questions for NEET mock test:", error?.message);
      return null;
    }

    // Group questions by subject
    const bySubject: Record<string, NEETQuestion[]> = {};
    for (const q of questions) {
      const subject = q.subject || "Physics";
      if (!bySubject[subject]) bySubject[subject] = [];
      bySubject[subject].push({
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        questionText: q.question_text,
        options: [
          q.options?.A || "",
          q.options?.B || "",
          q.options?.C || "",
          q.options?.D || "",
        ],
        answerKey: q.answer_key,
        explanation: q.explanation,
        marks: q.marks || NEET_SCHEME.marksPerCorrect,
        negative: q.negative || NEET_SCHEME.negativeMarks,
        order: q.order || 0,
      });
    }

    // Select questions per subject according to weightage
    let selectedQuestions: NEETQuestion[] = [];
    for (const [subject, count] of Object.entries(NEET_SCHEME.subjectWeightage)) {
      const available = bySubject[subject] || [];
      const selected = options.shuffleQuestions 
        ? shuffleArray(available).slice(0, count)
        : available.slice(0, count);
      selectedQuestions.push(...selected);
    }

    // Optionally shuffle all questions
    if (options.shuffleQuestions) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    // Optionally shuffle options
    if (options.shuffleOpts) {
      selectedQuestions = selectedQuestions.map(shuffleOptions);
    }

    // Re-number
    selectedQuestions = selectedQuestions.map((q, i) => ({
      ...q,
      order: i + 1,
    }));

    return {
      id: crypto.randomUUID(),
      title: `NEET UG Mock Test`,
      type: "mock",
      durationMinutes: NEET_SCHEME.durationMinutes,
      questionCount: selectedQuestions.length,
      questions: selectedQuestions,
    };
  } catch (error) {
    console.error("Error generating NEET mock test:", error);
    return null;
  }
}
