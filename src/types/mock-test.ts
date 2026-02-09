/**
 * ThinqRx Mock Test System - Type Definitions
 * Matches real CBT exam structure (Digialm / TCS iON style)
 */

export type ExamType = "GPAT" | "NIPER" | "PHARMACIST" | "OTHER";
export type QuestionDifficulty = "Easy" | "Medium" | "Difficult";
export type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked_for_review" | "answered_and_marked";

// Question structure as uploaded by admin
export interface MockTestQuestion {
  question_id: string;
  subject: string;
  topic: string;
  difficulty: QuestionDifficulty;
  question_text: string; // Supports HTML + images
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

// Section structure (optional grouping)
export interface MockTestSection {
  section_id: string;
  section_name: string;
  questions: MockTestQuestion[];
}

// Main mock test structure (uploaded as JSON)
export interface MockTestData {
  exam_name: ExamType;
  test_name: string;
  description?: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  negative_marking: boolean;
  negative_marking_value?: number; // e.g., -0.25 or -1
  sections?: MockTestSection[]; // Optional sections
  questions: MockTestQuestion[]; // All questions (flat array)
  instructions?: string[]; // Custom instructions
}

// Database mock_tests table structure
export interface MockTest {
  id: string;
  course_id: string;
  exam_type: ExamType;
  title: string;
  description?: string;
  questions_json: MockTestData; // JSONB column storing full test data
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  negative_marking: boolean;
  negative_marking_value: number;
  marks_per_question?: number; // Optional: marks per correct answer (default: 4)
  instructions?: string[];
  status: "draft" | "published" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Student's question response during test
export interface QuestionResponse {
  question_id: string;
  selected_option: "A" | "B" | "C" | "D" | null;
  is_marked_for_review: boolean;
  time_spent_seconds: number;
  visited_at?: string;
  answered_at?: string;
}

// Student's test attempt (stored in database)
export interface MockTestAttempt {
  id: string;
  user_id: string;
  mock_test_id: string;
  course_id: string;
  started_at: string;
  submitted_at?: string;
  time_spent_seconds: number;
  responses: QuestionResponse[]; // JSONB column
  score: number;
  max_score: number;
  accuracy_percentage: number;
  status: "in_progress" | "submitted" | "auto_submitted";
  metadata?: {
    correct_count: number;
    incorrect_count: number;
    skipped_count: number;
    subject_wise_performance: SubjectPerformance[];
  };
  session_state?: TestSession; // JSONB column for resume functionality
  created_at: string;
  updated_at: string;
}

// Subject-wise performance breakdown
export interface SubjectPerformance {
  subject: string;
  total_questions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
  time_spent_seconds: number;
}

// Question state for UI (local state during test)
export interface QuestionState {
  question_id: string;
  status: QuestionStatus;
  selected_option: "A" | "B" | "C" | "D" | null;
  is_marked_for_review: boolean;
  time_spent_seconds: number;
}

// Test session state (persisted to resume if page reloads)
export interface TestSession {
  attempt_id: string;
  current_question_index: number;
  time_remaining_seconds: number;
  question_states: QuestionState[];
  last_saved_at: string;
}

// Analytics data for review page
export interface TestReviewData {
  attempt: MockTestAttempt;
  test: MockTest;
  questions_with_responses: Array<{
    question: MockTestQuestion;
    response: QuestionResponse;
    is_correct: boolean;
    correct_option: string;
  }>;
  subject_performance: SubjectPerformance[];
  strengths: string[]; // Topics with >75% accuracy
  weaknesses: string[]; // Topics with <60% accuracy
}

// Color coding for question palette (matches real CBT exams)
export const QUESTION_STATUS_COLORS = {
  not_visited: "bg-slate-200 text-slate-700 border-slate-300", // Grey
  not_answered: "bg-red-100 text-red-700 border-red-300", // Red (visited but not answered)
  answered: "bg-emerald-100 text-emerald-700 border-emerald-300", // Green
  marked_for_review: "bg-purple-100 text-purple-700 border-purple-300", // Purple
  answered_and_marked: "bg-blue-100 text-blue-700 border-blue-300", // Blue
} as const;

// Status display names
export const QUESTION_STATUS_LABELS = {
  not_visited: "Not Visited",
  not_answered: "Not Answered",
  answered: "Answered",
  marked_for_review: "Marked for Review",
  answered_and_marked: "Answered & Marked",
} as const;
