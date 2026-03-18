/**
 * Analytics Calculation Engine
 * Provides data-driven insights for Pro users
 */

export interface UserAttempt {
  id: string;
  userId: string;
  courseId: string;
  kind: "ai_topic" | "mock_test";
  sourceId?: string; // topic_id for topic tests
  mockTestId?: string;
  score: number;
  maxScore?: number;
  timeTakenSeconds: number;
  responsesJson: {
    responses: Array<{
      questionId: string;
      selectedOption: number | null;
      flagged: boolean;
    }>;
    metadata: {
      correct: number;
      incorrect: number;
      unattempted: number;
      totalQuestions: number;
      difficulty?: string;
      accuracy?: number;
      total_marks?: number;
    };
  };
  createdAt: string;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  subjectName: string;
  totalAttempts: number;
  avgAccuracy: number;
  avgScore: number;
  avgTimeTaken: number;
  lastAttemptDate: string;
  trend: "improving" | "declining" | "stable";
  isWeak: boolean;
  weaknessReason?: string;
}

export interface DifficultyPerformance {
  difficulty: "easy" | "medium" | "hard";
  totalAttempts: number;
  avgAccuracy: number;
  avgScore: number;
  avgTimeTaken: number;
}

export interface AccuracyTrend {
  date: string;
  accuracy: number;
  score: number;
  attemptCount: number;
}

export interface TimeVsAccuracy {
  avgTimePerQuestion: number;
  accuracy: number;
  attemptCount: number;
}

export interface MockTestPerformance {
  testId: string;
  testTitle: string;
  examType: string;
  score: number;
  maxScore: number;
  accuracy: number;
  timeTaken: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalQuestions: number;
  subjectWisePerformance: Array<{
    subject: string;
    correct: number;
    incorrect: number;
    skipped: number;
    total: number;
    accuracy: number;
  }>;
  attemptDate: string;
}

export interface MockTestAnalytics {
  totalMockTests: number;
  avgScore: number;
  avgAccuracy: number;
  totalTimeSpent: number;
  bestPerformance: MockTestPerformance | null;
  recentTests: MockTestPerformance[];
  subjectWiseAggregated: Array<{
    subject: string;
    totalQuestions: number;
    correct: number;
    incorrect: number;
    skipped: number;
    accuracy: number;
    isWeak: boolean;
  }>;
  progressTrend: "improving" | "declining" | "stable";
}

export interface AnalyticsData {
  topicPerformance: TopicPerformance[];
  difficultyPerformance: DifficultyPerformance[];
  accuracyTrends: AccuracyTrend[];
  timeVsAccuracyCorrelation: number; // -1 to 1
  mockTestAnalytics: MockTestAnalytics;
  overallStats: {
    totalAttempts: number;
    avgAccuracy: number;
    avgScore: number;
    totalTimeSpent: number;
    strongTopics: number;
    weakTopics: number;
  };
}

/**
 * Calculate topic-wise performance
 */
export function calculateTopicPerformance(
  attempts: UserAttempt[],
  topicMetadata: Map<string, { name: string; subjectName: string }>
): TopicPerformance[] {
  const topicMap = new Map<string, UserAttempt[]>();

  // Group attempts by topic
  attempts
    .filter((a) => a.kind === "ai_topic" && a.sourceId)
    .forEach((attempt) => {
      const topicId = attempt.sourceId!;
      if (!topicMap.has(topicId)) {
        topicMap.set(topicId, []);
      }
      topicMap.get(topicId)!.push(attempt);
    });

  // Calculate performance for each topic
  const performances: TopicPerformance[] = [];

  topicMap.forEach((topicAttempts, topicId) => {
    const metadata = topicMetadata.get(topicId);
    if (!metadata) return;

    const totalAttempts = topicAttempts.length;
    const accuracies = topicAttempts.map((a) => {
      const { correct, incorrect } = a.responsesJson.metadata;
      return correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;
    });

    const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / totalAttempts;
    const avgScore =
      topicAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts;
    const avgTimeTaken =
      topicAttempts.reduce((sum, a) => sum + a.timeTakenSeconds, 0) / totalAttempts;

    // Sort by date to detect trend
    const sortedAttempts = [...topicAttempts].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate trend: compare first half vs second half
    let trend: "improving" | "declining" | "stable" = "stable";
    if (totalAttempts >= 3) {
      const midPoint = Math.floor(totalAttempts / 2);
      const firstHalfAccuracy =
        accuracies.slice(0, midPoint).reduce((sum, acc) => sum + acc, 0) / midPoint;
      const secondHalfAccuracy =
        accuracies.slice(midPoint).reduce((sum, acc) => sum + acc, 0) /
        (totalAttempts - midPoint);

      const diff = secondHalfAccuracy - firstHalfAccuracy;
      if (diff > 5) trend = "improving";
      else if (diff < -5) trend = "declining";
    }

    // Detect weak topics
    const isWeak = avgAccuracy < 60 || trend === "declining";
    let weaknessReason: string | undefined;
    if (avgAccuracy < 60) {
      weaknessReason = `Low accuracy (${avgAccuracy.toFixed(1)}%)`;
    } else if (trend === "declining") {
      weaknessReason = "Accuracy declining over time";
    }

    performances.push({
      topicId,
      topicName: metadata.name,
      subjectName: metadata.subjectName,
      totalAttempts,
      avgAccuracy,
      avgScore,
      avgTimeTaken,
      lastAttemptDate: sortedAttempts[sortedAttempts.length - 1].createdAt,
      trend,
      isWeak,
      weaknessReason,
    });
  });

  // Sort by weakness (weak topics first), then by accuracy
  return performances.sort((a, b) => {
    if (a.isWeak && !b.isWeak) return -1;
    if (!a.isWeak && b.isWeak) return 1;
    return a.avgAccuracy - b.avgAccuracy;
  });
}

/**
 * Calculate difficulty-wise performance
 */
export function calculateDifficultyPerformance(
  attempts: UserAttempt[]
): DifficultyPerformance[] {
  const difficultyMap = new Map<
    "easy" | "medium" | "hard",
    { accuracies: number[]; scores: number[]; times: number[] }
  >();

  attempts
    .filter((a) => a.kind === "ai_topic")
    .forEach((attempt) => {
      const difficulty = (attempt.responsesJson.metadata.difficulty ||
        "medium") as "easy" | "medium" | "hard";

      if (!difficultyMap.has(difficulty)) {
        difficultyMap.set(difficulty, { accuracies: [], scores: [], times: [] });
      }

      const data = difficultyMap.get(difficulty)!;
      const { correct, incorrect } = attempt.responsesJson.metadata;
      const accuracy =
        correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;

      data.accuracies.push(accuracy);
      data.scores.push(attempt.score);
      data.times.push(attempt.timeTakenSeconds);
    });

  const performances: DifficultyPerformance[] = [];

  (["easy", "medium", "hard"] as const).forEach((difficulty) => {
    const data = difficultyMap.get(difficulty);
    if (!data || data.accuracies.length === 0) {
      performances.push({
        difficulty,
        totalAttempts: 0,
        avgAccuracy: 0,
        avgScore: 0,
        avgTimeTaken: 0,
      });
      return;
    }

    performances.push({
      difficulty,
      totalAttempts: data.accuracies.length,
      avgAccuracy:
        data.accuracies.reduce((sum, acc) => sum + acc, 0) / data.accuracies.length,
      avgScore: data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
      avgTimeTaken: data.times.reduce((sum, t) => sum + t, 0) / data.times.length,
    });
  });

  return performances;
}

/**
 * Calculate accuracy trends over time
 */
export function calculateAccuracyTrends(attempts: UserAttempt[]): AccuracyTrend[] {
  // Group attempts by date (day)
  const dateMap = new Map<string, { accuracies: number[]; scores: number[] }>();

  attempts.forEach((attempt) => {
    const date = new Date(attempt.createdAt).toISOString().split("T")[0];

    if (!dateMap.has(date)) {
      dateMap.set(date, { accuracies: [], scores: [] });
    }

    const data = dateMap.get(date)!;
    const { correct, incorrect } = attempt.responsesJson.metadata;
    const accuracy =
      correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;

    data.accuracies.push(accuracy);
    data.scores.push(attempt.score);
  });

  // Convert to array and sort by date
  const trends: AccuracyTrend[] = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      accuracy:
        data.accuracies.reduce((sum, acc) => sum + acc, 0) / data.accuracies.length,
      score: data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
      attemptCount: data.accuracies.length,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return trends;
}

/**
 * Calculate time vs accuracy correlation
 * Returns Pearson correlation coefficient (-1 to 1)
 */
export function calculateTimeVsAccuracyCorrelation(
  attempts: UserAttempt[]
): number {
  if (attempts.length < 2) return 0;

  const data = attempts
    .filter((a) => a.kind === "ai_topic")
    .map((attempt) => {
      const { correct, incorrect, totalQuestions } =
        attempt.responsesJson.metadata;
      const accuracy =
        correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;
      const timePerQuestion = attempt.timeTakenSeconds / totalQuestions;
      return { timePerQuestion, accuracy };
    });

  if (data.length < 2) return 0;

  // Calculate Pearson correlation coefficient
  const n = data.length;
  const sumX = data.reduce((sum, d) => sum + d.timePerQuestion, 0);
  const sumY = data.reduce((sum, d) => sum + d.accuracy, 0);
  const sumXY = data.reduce((sum, d) => sum + d.timePerQuestion * d.accuracy, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.timePerQuestion ** 2, 0);
  const sumY2 = data.reduce((sum, d) => sum + d.accuracy ** 2, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calculate mock test analytics
 */
export function calculateMockTestAnalytics(attempts: UserAttempt[]): MockTestAnalytics {
  const mockTestAttempts = attempts.filter((a) => a.kind === "mock_test");

  if (mockTestAttempts.length === 0) {
    return {
      totalMockTests: 0,
      avgScore: 0,
      avgAccuracy: 0,
      totalTimeSpent: 0,
      bestPerformance: null,
      recentTests: [],
      subjectWiseAggregated: [],
      progressTrend: "stable",
    };
  }

  // Parse mock test performances
  const performances: MockTestPerformance[] = mockTestAttempts.map((attempt) => {
    const metadata = attempt.responsesJson.metadata;
    const testTitle = (attempt.responsesJson as any).test_title || "Mock Test";
    const examType = (attempt.responsesJson as any).exam_type || "NEET_UG";
    const subjectWisePerformance = (attempt.responsesJson as any).subject_wise_performance || [];

    const accuracy = metadata.accuracy || 
      (metadata.correct + metadata.incorrect > 0
        ? (metadata.correct / (metadata.correct + metadata.incorrect)) * 100
        : 0);

    return {
      testId: attempt.mockTestId || attempt.id,
      testTitle,
      examType,
      score: attempt.score,
      maxScore: attempt.maxScore || metadata.total_marks || 0,
      accuracy,
      timeTaken: attempt.timeTakenSeconds,
      correctCount: metadata.correct,
      incorrectCount: metadata.incorrect,
      skippedCount: metadata.unattempted,
      totalQuestions: metadata.totalQuestions,
      subjectWisePerformance: subjectWisePerformance.map((s: any) => ({
        subject: s.subject,
        correct: s.correct || 0,
        incorrect: s.incorrect || 0,
        skipped: s.skipped || 0,
        total: s.total_questions || 0,
        accuracy: s.accuracy || 0,
      })),
      attemptDate: attempt.createdAt,
    };
  });

  // Calculate aggregated stats
  const totalMockTests = performances.length;
  const avgScore = performances.reduce((sum, p) => sum + p.score, 0) / totalMockTests;
  const avgAccuracy = performances.reduce((sum, p) => sum + p.accuracy, 0) / totalMockTests;
  const totalTimeSpent = performances.reduce((sum, p) => sum + p.timeTaken, 0);

  // Find best performance
  const bestPerformance = performances.reduce((best, current) => {
    return current.accuracy > best.accuracy ? current : best;
  }, performances[0]);

  // Get recent tests (last 5)
  const recentTests = [...performances]
    .sort((a, b) => new Date(b.attemptDate).getTime() - new Date(a.attemptDate).getTime())
    .slice(0, 5);

  // Aggregate subject-wise performance
  const subjectMap = new Map<string, {
    totalQuestions: number;
    correct: number;
    incorrect: number;
    skipped: number;
  }>();

  performances.forEach((perf) => {
    perf.subjectWisePerformance.forEach((subject) => {
      if (!subjectMap.has(subject.subject)) {
        subjectMap.set(subject.subject, {
          totalQuestions: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
        });
      }
      const data = subjectMap.get(subject.subject)!;
      data.totalQuestions += subject.total;
      data.correct += subject.correct;
      data.incorrect += subject.incorrect;
      data.skipped += subject.skipped;
    });
  });

  const subjectWiseAggregated = Array.from(subjectMap.entries()).map(([subject, data]) => {
    const accuracy = data.correct + data.incorrect > 0
      ? (data.correct / (data.correct + data.incorrect)) * 100
      : 0;
    return {
      subject,
      totalQuestions: data.totalQuestions,
      correct: data.correct,
      incorrect: data.incorrect,
      skipped: data.skipped,
      accuracy,
      isWeak: accuracy < 60,
    };
  }).sort((a, b) => a.accuracy - b.accuracy);

  // Calculate progress trend
  let progressTrend: "improving" | "declining" | "stable" = "stable";
  if (performances.length >= 3) {
    const sortedPerf = [...performances].sort(
      (a, b) => new Date(a.attemptDate).getTime() - new Date(b.attemptDate).getTime()
    );
    const midPoint = Math.floor(sortedPerf.length / 2);
    const firstHalfAccuracy = sortedPerf.slice(0, midPoint)
      .reduce((sum, p) => sum + p.accuracy, 0) / midPoint;
    const secondHalfAccuracy = sortedPerf.slice(midPoint)
      .reduce((sum, p) => sum + p.accuracy, 0) / (sortedPerf.length - midPoint);

    const diff = secondHalfAccuracy - firstHalfAccuracy;
    if (diff > 5) progressTrend = "improving";
    else if (diff < -5) progressTrend = "declining";
  }

  return {
    totalMockTests,
    avgScore,
    avgAccuracy,
    totalTimeSpent,
    bestPerformance,
    recentTests,
    subjectWiseAggregated,
    progressTrend,
  };
}

/**
 * Calculate overall analytics
 */
export function calculateOverallAnalytics(
  attempts: UserAttempt[],
  topicMetadata: Map<string, { name: string; subjectName: string }>
): AnalyticsData {
  const topicPerformance = calculateTopicPerformance(attempts, topicMetadata);
  const difficultyPerformance = calculateDifficultyPerformance(attempts);
  const accuracyTrends = calculateAccuracyTrends(attempts);
  const timeVsAccuracyCorrelation = calculateTimeVsAccuracyCorrelation(attempts);
  const mockTestAnalytics = calculateMockTestAnalytics(attempts);

  const totalAttempts = attempts.length;
  const allAccuracies = attempts.map((a) => {
    const { correct, incorrect } = a.responsesJson.metadata;
    return correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;
  });
  const avgAccuracy =
    allAccuracies.reduce((sum, acc) => sum + acc, 0) / totalAttempts || 0;
  const avgScore = attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts || 0;
  const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeTakenSeconds, 0);

  const weakTopics = topicPerformance.filter((t) => t.isWeak).length;
  const strongTopics = topicPerformance.filter((t) => !t.isWeak).length;

  return {
    topicPerformance,
    difficultyPerformance,
    accuracyTrends,
    timeVsAccuracyCorrelation,
    mockTestAnalytics,
    overallStats: {
      totalAttempts,
      avgAccuracy,
      avgScore,
      totalTimeSpent,
      strongTopics,
      weakTopics,
    },
  };
}
