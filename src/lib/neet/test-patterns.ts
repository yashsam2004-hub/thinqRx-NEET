/**
 * NEET UG Test Patterns and Configuration
 * Official NEET exam structure for mock test generation
 */

export interface TestPattern {
  name: string;
  code: string;
  totalQuestions: number;
  totalMarks: number;
  duration: number; // minutes
  sections: TestSection[];
  negativeMarking: boolean;
  marksPerCorrect: number;
  marksPerIncorrect: number;
  instructions: string[];
}

export interface TestSection {
  sectionId: string;
  sectionName: string;
  subject: string;
  totalQuestions: number;
  marksPerQuestion: number;
  description?: string;
}

/**
 * Official NEET UG Test Pattern (2024-2027)
 * 180 questions, 720 marks, 3 hours
 */
export const NEET_UG_FULL_TEST: TestPattern = {
  name: "NEET UG Full Test",
  code: "NEET_UG_FULL",
  totalQuestions: 180,
  totalMarks: 720,
  duration: 180, // 3 hours
  negativeMarking: true,
  marksPerCorrect: 4,
  marksPerIncorrect: -1,
  sections: [
    {
      sectionId: "physics",
      sectionName: "Physics",
      subject: "Physics",
      totalQuestions: 45,
      marksPerQuestion: 4,
      description: "Physics questions based on Class 11 & 12 NCERT",
    },
    {
      sectionId: "chemistry",
      sectionName: "Chemistry",
      subject: "Chemistry",
      totalQuestions: 45,
      marksPerQuestion: 4,
      description: "Chemistry questions based on Class 11 & 12 NCERT",
    },
    {
      sectionId: "biology-botany",
      sectionName: "Biology - Botany",
      subject: "Biology - Botany",
      totalQuestions: 45,
      marksPerQuestion: 4,
      description: "Botany questions based on Class 11 & 12 NCERT",
    },
    {
      sectionId: "biology-zoology",
      sectionName: "Biology - Zoology",
      subject: "Biology - Zoology",
      totalQuestions: 45,
      marksPerQuestion: 4,
      description: "Zoology questions based on Class 11 & 12 NCERT",
    },
  ],
  instructions: [
    "Total duration: 180 minutes (3 hours)",
    "Total questions: 180 (45 each in Physics, Chemistry, Biology)",
    "Each correct answer: +4 marks",
    "Each incorrect answer: -1 mark (negative marking)",
    "Unattempted questions: 0 marks",
    "There is only ONE correct option for each question",
    "Choose answers carefully as negative marking is applicable",
    "You can navigate between sections anytime during the test",
    "You can mark questions for review and come back to them later",
    "Submit the test only when you have attempted all questions you want to attempt",
  ],
};

/**
 * Subject-Wise Practice Tests (Shorter duration)
 */
export const NEET_PHYSICS_TEST: TestPattern = {
  name: "NEET Physics Practice Test",
  code: "NEET_PHYSICS",
  totalQuestions: 45,
  totalMarks: 180,
  duration: 60, // 1 hour
  negativeMarking: true,
  marksPerCorrect: 4,
  marksPerIncorrect: -1,
  sections: [
    {
      sectionId: "physics",
      sectionName: "Physics",
      subject: "Physics",
      totalQuestions: 45,
      marksPerQuestion: 4,
      description: "Physics questions based on Class 11 & 12 NCERT",
    },
  ],
  instructions: [
    "Total duration: 60 minutes (1 hour)",
    "Total questions: 45",
    "Each correct answer: +4 marks",
    "Each incorrect answer: -1 mark",
    "Marking scheme same as NEET UG exam",
  ],
};

export const NEET_CHEMISTRY_TEST: TestPattern = {
  name: "NEET Chemistry Practice Test",
  code: "NEET_CHEMISTRY",
  totalQuestions: 45,
  totalMarks: 180,
  duration: 60,
  negativeMarking: true,
  marksPerCorrect: 4,
  marksPerIncorrect: -1,
  sections: [
    {
      sectionId: "chemistry",
      sectionName: "Chemistry",
      subject: "Chemistry",
      totalQuestions: 45,
      marksPerQuestion: 4,
      description: "Chemistry questions based on Class 11 & 12 NCERT",
    },
  ],
  instructions: [
    "Total duration: 60 minutes (1 hour)",
    "Total questions: 45",
    "Each correct answer: +4 marks",
    "Each incorrect answer: -1 mark",
    "Marking scheme same as NEET UG exam",
  ],
};

export const NEET_BIOLOGY_TEST: TestPattern = {
  name: "NEET Biology Practice Test",
  code: "NEET_BIOLOGY",
  totalQuestions: 90,
  totalMarks: 360,
  duration: 120, // 2 hours
  negativeMarking: true,
  marksPerCorrect: 4,
  marksPerIncorrect: -1,
  sections: [
    {
      sectionId: "biology-botany",
      sectionName: "Biology - Botany",
      subject: "Biology - Botany",
      totalQuestions: 45,
      marksPerQuestion: 4,
      description: "Botany questions based on Class 11 & 12 NCERT",
    },
    {
      sectionId: "biology-zoology",
      sectionName: "Biology - Zoology",
      subject: "Biology - Zoology",
      totalQuestions: 45,
      marksPerQuestion: 4,
      description: "Zoology questions based on Class 11 & 12 NCERT",
    },
  ],
  instructions: [
    "Total duration: 120 minutes (2 hours)",
    "Total questions: 90 (45 Botany + 45 Zoology)",
    "Each correct answer: +4 marks",
    "Each incorrect answer: -1 mark",
    "Marking scheme same as NEET UG exam",
  ],
};

/**
 * Topic-Wise Mini Tests (Quick practice)
 */
export const NEET_TOPIC_TEST_PATTERN = {
  small: {
    questions: 15,
    duration: 20, // minutes
    marks: 60,
  },
  medium: {
    questions: 30,
    duration: 40,
    marks: 120,
  },
  large: {
    questions: 50,
    duration: 60,
    marks: 200,
  },
};

/**
 * Get test pattern by code
 */
export function getTestPattern(code: string): TestPattern | null {
  const patterns: Record<string, TestPattern> = {
    NEET_UG_FULL: NEET_UG_FULL_TEST,
    NEET_PHYSICS: NEET_PHYSICS_TEST,
    NEET_CHEMISTRY: NEET_CHEMISTRY_TEST,
    NEET_BIOLOGY: NEET_BIOLOGY_TEST,
  };
  return patterns[code] || null;
}

/**
 * Calculate score based on NEET marking scheme
 */
export function calculateNEETScore(
  correct: number,
  incorrect: number,
  unattempted: number
): {
  totalScore: number;
  maxScore: number;
  accuracy: number;
  percentile: number; // approximate
} {
  const totalScore = correct * 4 - incorrect * 1;
  const totalQuestions = correct + incorrect + unattempted;
  const maxScore = totalQuestions * 4;
  const accuracy = totalQuestions > 0 ? (correct / (correct + incorrect)) * 100 : 0;
  
  // Rough percentile calculation (simplified)
  const percentile = Math.min((totalScore / maxScore) * 100, 100);

  return {
    totalScore,
    maxScore,
    accuracy: Math.round(accuracy * 100) / 100,
    percentile: Math.round(percentile * 100) / 100,
  };
}

/**
 * NEET cutoff percentiles (approximate, for reference)
 */
export const NEET_CUTOFF_PERCENTILES = {
  "Government Medical College (General)": 50,
  "Government Medical College (OBC)": 40,
  "Government Medical College (SC/ST)": 40,
  "Private Medical College": 50,
  "Deemed University": 45,
  "AIIMS": 99.5,
  "JIPMER": 99,
};

/**
 * Recommended target scores for different goals
 */
export const NEET_TARGET_SCORES = {
  "Top Government Medical College": {
    minScore: 600,
    targetPercentile: 99,
  },
  "Good Government Medical College": {
    minScore: 550,
    targetPercentile: 95,
  },
  "Any Government Medical College": {
    minScore: 500,
    targetPercentile: 85,
  },
  "Private Medical College": {
    minScore: 450,
    targetPercentile: 70,
  },
  "Qualifying Score (General)": {
    minScore: 360,
    targetPercentile: 50,
  },
};
