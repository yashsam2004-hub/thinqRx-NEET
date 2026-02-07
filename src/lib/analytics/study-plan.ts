/**
 * Personalized Study Plan Generator
 * Creates daily/weekly goals based on user performance
 */

import { AnalyticsData, TopicPerformance } from "./calculate";

export interface DailyGoal {
  id: string;
  date: string;
  goals: Array<{
    type: "revision" | "practice" | "mock_test" | "analysis";
    topicId?: string;
    topicName?: string;
    subjectName?: string;
    target: string; // e.g., "Complete 20 questions with 80% accuracy"
    timeEstimate: number; // minutes
    priority: "high" | "medium" | "low";
    reason: string;
  }>;
  totalTimeEstimate: number;
  focus: string; // Main focus for the day
}

export interface WeeklyGoal {
  weekNumber: number;
  startDate: string;
  endDate: string;
  overallFocus: string;
  targetTopics: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    currentAccuracy: number;
    targetAccuracy: number;
    sessionsRequired: number;
  }>;
  mockTestsTarget: number;
  revisionsTarget: number;
  expectedImprovement: string;
}

export interface MistakePattern {
  category: string; // e.g., "Conceptual gaps", "Careless errors", "Time pressure"
  frequency: number;
  examples: string[];
  suggestions: string[];
}

export interface StudyPlan {
  currentDate: string;
  dailyGoals: DailyGoal[]; // Next 7 days
  weeklyGoals: WeeklyGoal[]; // Next 4 weeks
  weakSpots: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    accuracy: number;
    attemptsCount: number;
    lastAttempted: string;
    improvementNeeded: number; // percentage points
    estimatedHours: number;
    priority: number; // 1-5, 1 being highest
  }>;
  mistakePatterns: MistakePattern[];
  focusAreas: Array<{
    area: string;
    description: string;
    actionItems: string[];
    timeAllocation: number; // percentage
  }>;
  progressMilestones: Array<{
    milestone: string;
    targetDate: string;
    criteria: string;
    status: "pending" | "in_progress" | "completed";
  }>;
}

/**
 * Generate a comprehensive personalized study plan
 */
export function generateStudyPlan(
  analyticsData: AnalyticsData,
  daysToGenerate: number = 7
): StudyPlan {
  const currentDate = new Date().toISOString().split("T")[0];
  
  // Identify weak spots and prioritize
  const weakSpots = identifyWeakSpots(analyticsData);
  
  // Detect mistake patterns
  const mistakePatterns = detectMistakePatterns(analyticsData);
  
  // Generate daily goals for next N days
  const dailyGoals = generateDailyGoals(
    analyticsData,
    weakSpots,
    daysToGenerate
  );
  
  // Generate weekly goals for next 4 weeks
  const weeklyGoals = generateWeeklyGoals(
    analyticsData,
    weakSpots
  );
  
  // Define focus areas with time allocation
  const focusAreas = defineFocusAreas(analyticsData, weakSpots);
  
  // Create progress milestones
  const progressMilestones = createProgressMilestones(analyticsData, weakSpots);
  
  return {
    currentDate,
    dailyGoals,
    weeklyGoals,
    weakSpots,
    mistakePatterns,
    focusAreas,
    progressMilestones,
  };
}

/**
 * Identify and prioritize weak spots
 */
function identifyWeakSpots(analyticsData: AnalyticsData) {
  const weakTopics = analyticsData.topicPerformance
    .filter((t) => t.isWeak || t.avgAccuracy < 70)
    .map((topic, index) => {
      const improvementNeeded = Math.max(0, 75 - topic.avgAccuracy);
      const estimatedHours = Math.ceil(improvementNeeded / 10) * 2; // 2 hours per 10% improvement
      
      return {
        topicId: topic.topicId,
        topicName: topic.topicName,
        subjectName: topic.subjectName,
        accuracy: topic.avgAccuracy,
        attemptsCount: topic.totalAttempts,
        lastAttempted: topic.lastAttemptDate,
        improvementNeeded,
        estimatedHours,
        priority: calculatePriority(topic, index),
      };
    })
    .sort((a, b) => a.priority - b.priority);
  
  return weakTopics.slice(0, 10); // Top 10 weak spots
}

/**
 * Calculate priority score (1-5, 1 being highest)
 */
function calculatePriority(topic: TopicPerformance, index: number): number {
  let score = 0;
  
  // Factor 1: Accuracy (lower = higher priority)
  if (topic.avgAccuracy < 50) score += 5;
  else if (topic.avgAccuracy < 60) score += 4;
  else if (topic.avgAccuracy < 70) score += 3;
  else score += 2;
  
  // Factor 2: Trend (declining = higher priority)
  if (topic.trend === "declining") score += 2;
  else if (topic.trend === "stable") score += 1;
  
  // Factor 3: Recency (older = higher priority)
  const daysSinceAttempt = Math.floor(
    (Date.now() - new Date(topic.lastAttemptDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceAttempt > 7) score += 2;
  else if (daysSinceAttempt > 3) score += 1;
  
  // Normalize to 1-5 scale
  return Math.min(5, Math.max(1, Math.ceil(score / 2)));
}

/**
 * Detect patterns with supportive framing
 */
function detectMistakePatterns(analyticsData: AnalyticsData): MistakePattern[] {
  const patterns: MistakePattern[] = [];
  
  // Pattern 1: Difficulty-based observations
  const diffPerf = analyticsData.difficultyPerformance;
  const hardAccuracy = diffPerf.find((d) => d.difficulty === "hard")?.avgAccuracy || 0;
  const mediumAccuracy = diffPerf.find((d) => d.difficulty === "medium")?.avgAccuracy || 0;
  
  if (hardAccuracy < 50 && hardAccuracy < mediumAccuracy - 20) {
    patterns.push({
      category: "Complex questions need more time",
      frequency: Math.round((100 - hardAccuracy) / 10),
      examples: ["Harder questions are naturally challenging - that's okay"],
      suggestions: [
        "Try breaking down complex problems into smaller parts",
        "It helps to practice with detailed explanations available",
        "Take your time with conceptual understanding - there's no rush",
      ],
    });
  }
  
  // Pattern 2: Pacing observations
  if (analyticsData.timeVsAccuracyCorrelation < -0.3) {
    patterns.push({
      category: "You might benefit from slowing down a bit",
      frequency: 7,
      examples: ["Your accuracy improves when you take more time"],
      suggestions: [
        "Try reading each question twice before answering",
        "The elimination method can help you feel more confident",
        "Remember: it's practice, not a race",
      ],
    });
  } else if (analyticsData.timeVsAccuracyCorrelation > 0.5) {
    patterns.push({
      category: "You're thorough - let's work on speed gently",
      frequency: 6,
      examples: ["You do well when you take your time"],
      suggestions: [
        "Try recalling key concepts without looking them up first",
        "Practice with topics you're comfortable with to build speed",
        "Gradually introduce time awareness, not pressure",
      ],
    });
  }
  
  // Pattern 3: Foundation observations
  const weakFoundationTopics = analyticsData.topicPerformance
    .filter((t) => t.avgAccuracy < 50 && t.totalAttempts >= 3)
    .slice(0, 3);
  
  if (weakFoundationTopics.length > 0) {
    patterns.push({
      category: "Some fundamentals could use a refresh",
      frequency: weakFoundationTopics.length,
      examples: weakFoundationTopics.map((t) => `${t.topicName} - let's strengthen this together`),
      suggestions: [
        "Start with the basics - it's perfectly fine to go back",
        "Textbooks can be great for building clarity",
        "Video lectures might offer a different perspective that clicks",
        "Creating simple concept maps can make things clearer",
      ],
    });
  }
  
  return patterns;
}

/**
 * Generate daily goals for the next N days with understanding and flexibility
 */
function generateDailyGoals(
  analyticsData: AnalyticsData,
  weakSpots: ReturnType<typeof identifyWeakSpots>,
  daysToGenerate: number
): DailyGoal[] {
  const dailyGoals: DailyGoal[] = [];
  const today = new Date();
  
  // Determine if student needs lighter load (high number of weak spots indicates overwhelm)
  const isOverwhelmed = weakSpots.length > 8;
  const baseTimePerDay = isOverwhelmed ? 60 : 90; // Shorter sessions if overwhelmed
  
  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    
    const dayGoals: DailyGoal["goals"] = [];
    let totalTime = 0;
    
    // Day 1-2: Gentle start with highest priority
    if (i < 2 && weakSpots.length > 0) {
      const priority1 = weakSpots[0];
      dayGoals.push({
        type: "revision",
        topicId: priority1.topicId,
        topicName: priority1.topicName,
        subjectName: priority1.subjectName,
        target: "Review key concepts at your own pace",
        timeEstimate: isOverwhelmed ? 40 : 60,
        priority: "high",
        reason: `This area could use some attention - currently at ${priority1.accuracy.toFixed(0)}%`,
      });
      dayGoals.push({
        type: "practice",
        topicId: priority1.topicId,
        topicName: priority1.topicName,
        subjectName: priority1.subjectName,
        target: "Try 10-15 practice questions",
        timeEstimate: isOverwhelmed ? 30 : 45,
        priority: "medium",
        reason: "Gentle practice to reinforce what you learned",
      });
      totalTime += isOverwhelmed ? 70 : 105;
    }
    
    // Day 3-4: Building confidence
    if (i >= 2 && i < 4 && weakSpots.length > 1) {
      const priority2 = weakSpots[Math.min(i - 1, weakSpots.length - 1)];
      dayGoals.push({
        type: "practice",
        topicId: priority2.topicId,
        topicName: priority2.topicName,
        subjectName: priority2.subjectName,
        target: "Work through 15-20 questions",
        timeEstimate: 45,
        priority: "high",
        reason: "Building on yesterday's progress",
      });
      totalTime += 45;
      
      // Add optional review
      if (weakSpots.length > 2) {
        const optional = weakSpots[2];
        dayGoals.push({
          type: "revision",
          topicId: optional.topicId,
          topicName: optional.topicName,
          subjectName: optional.subjectName,
          target: "Quick 20-minute topic review",
          timeEstimate: 20,
          priority: "low",
          reason: "Optional - only if you have energy left",
        });
        totalTime += 20;
      }
    }
    
    // Day 5: Lighter consolidation day
    if (i === 4) {
      dayGoals.push({
        type: "revision",
        target: "Review notes from this week",
        timeEstimate: 30,
        priority: "medium",
        reason: "Taking stock of your progress so far",
      });
      dayGoals.push({
        type: "practice",
        target: "Quick practice session on any topic you choose",
        timeEstimate: 30,
        priority: "low",
        reason: "Your choice - practice what you feel comfortable with",
      });
      totalTime += 60;
    }
    
    // Day 6: Mock test (only if student has practiced enough)
    if (i === 5 && analyticsData.overallStats.totalAttempts > 5) {
      dayGoals.push({
        type: "mock_test",
        target: "Take a practice test when you're ready",
        timeEstimate: 120,
        priority: "medium",
        reason: "See how far you've come - this is for learning, not judgment",
      });
      totalTime += 120;
    } else if (i === 5) {
      // Alternative for beginners
      dayGoals.push({
        type: "practice",
        target: "Practice session on topics you're comfortable with",
        timeEstimate: 45,
        priority: "high",
        reason: "Building confidence before attempting full tests",
      });
      totalTime += 45;
    }
    
    // Day 7: Reflection and light review
    if (i === 6) {
      dayGoals.push({
        type: "analysis",
        target: "Reflect on your week of learning",
        timeEstimate: 30,
        priority: "medium",
        reason: "Understanding what worked well for you",
      });
      dayGoals.push({
        type: "revision",
        target: "Light review of challenging concepts",
        timeEstimate: 40,
        priority: "low",
        reason: "Optional - rest is important too",
      });
      totalTime += 70;
    }
    
    // Ensure we have at least one low-priority optional item
    if (dayGoals.filter(g => g.priority === "low").length === 0 && weakSpots.length > 0) {
      const optionalTopic = weakSpots[Math.min(3, weakSpots.length - 1)];
      dayGoals.push({
        type: "practice",
        topicId: optionalTopic.topicId,
        topicName: optionalTopic.topicName,
        subjectName: optionalTopic.subjectName,
        target: "Quick 10-question practice",
        timeEstimate: 15,
        priority: "low",
        reason: "Only if you're feeling energetic today",
      });
      totalTime += 15;
    }
    
    dailyGoals.push({
      id: `day-${i + 1}`,
      date: dateStr,
      goals: dayGoals,
      totalTimeEstimate: totalTime,
      focus: i < 2
        ? "Getting started gently"
        : i < 4
        ? "Building momentum"
        : i === 4
        ? "Light consolidation"
        : i === 5
        ? "Progress check"
        : "Reflection and rest",
    });
  }
  
  return dailyGoals;
}

/**
 * Generate weekly goals with understanding and flexibility
 */
function generateWeeklyGoals(
  analyticsData: AnalyticsData,
  weakSpots: ReturnType<typeof identifyWeakSpots>
): WeeklyGoal[] {
  const weeklyGoals: WeeklyGoal[] = [];
  const today = new Date();
  
  // Adjust expectations based on current performance
  const isStruggling = analyticsData.overallStats.avgAccuracy < 50;
  const improvementRate = isStruggling ? 10 : 15; // More gentle targets if struggling
  
  for (let week = 0; week < 4; week++) {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + week * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    // Divide weak spots across weeks with some overlap for reinforcement
    const startIndex = week * 2; // Less aggressive pacing
    const targetTopicsForWeek = weakSpots.slice(startIndex, startIndex + 3);
    
    weeklyGoals.push({
      weekNumber: week + 1,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      overallFocus:
        week === 0
          ? "Getting comfortable with key areas"
          : week === 1
          ? "Building on what you've learned"
          : week === 2
          ? "Practicing with more confidence"
          : "Bringing it all together",
      targetTopics: targetTopicsForWeek.map((topic) => ({
        topicId: topic.topicId,
        topicName: topic.topicName,
        subjectName: topic.subjectName,
        currentAccuracy: topic.accuracy,
        targetAccuracy: Math.min(85, topic.accuracy + improvementRate),
        sessionsRequired: Math.ceil(topic.estimatedHours / 2),
      })),
      mockTestsTarget: week < 2 ? 0 : 1, // No pressure for mock tests early on
      revisionsTarget: 2, // Reasonable number of reviews
      expectedImprovement: isStruggling 
        ? `Steady progress - every bit counts`
        : `Building confidence in these areas`,
    });
  }
  
  return weeklyGoals;
}

/**
 * Define focus areas with supportive framing
 */
function defineFocusAreas(
  analyticsData: AnalyticsData,
  weakSpots: ReturnType<typeof identifyWeakSpots>
): StudyPlan["focusAreas"] {
  const focusAreas: StudyPlan["focusAreas"] = [];
  
  // Topics needing attention
  const weakTopicsPercentage = Math.min(40, weakSpots.length * 4); // More balanced allocation
  focusAreas.push({
    area: "Topics that need a little extra care",
    description: `Working through ${weakSpots.length} areas where you can grow`,
    actionItems: [
      "Review fundamental concepts at your own pace",
      "Jot down key points that make sense to you",
      "Practice 10-20 questions when you're ready",
      "Check in on your progress every few days",
    ],
    timeAllocation: weakTopicsPercentage,
  });
  
  // Practice and confidence
  focusAreas.push({
    area: "Building comfort through practice",
    description: "Getting familiar with different question types",
    actionItems: [
      "Try practice tests when you feel prepared",
      "Create a quiet space that feels comfortable",
      "Review your work without being hard on yourself",
      "Notice what approaches work best for you",
    ],
    timeAllocation: 25,
  });
  
  // Strong topics maintenance
  focusAreas.push({
    area: "Keeping your strengths sharp",
    description: "Maintaining what you already do well",
    actionItems: [
      "Quick refreshers on topics you're comfortable with",
      "Light practice to keep things fresh",
      "These can be your confidence boosters",
    ],
    timeAllocation: 20,
  });
  
  // Conceptual understanding
  focusAreas.push({
    area: "Deepening your understanding",
    description: "Making connections and building clarity",
    actionItems: [
      "Use whatever study materials work for you",
      "Try different learning methods - videos, reading, practice",
      "Make simple diagrams or notes that make sense to you",
      "Explain concepts out loud - it really helps",
    ],
    timeAllocation: 100 - weakTopicsPercentage - 45,
  });
  
  return focusAreas;
}

/**
 * Create encouraging progress milestones
 */
function createProgressMilestones(
  analyticsData: AnalyticsData,
  weakSpots: ReturnType<typeof identifyWeakSpots>
): StudyPlan["progressMilestones"] {
  const milestones: StudyPlan["progressMilestones"] = [];
  const today = new Date();
  
  // Week 1 milestone - gentle first step
  const week1Date = new Date(today);
  week1Date.setDate(week1Date.getDate() + 7);
  milestones.push({
    milestone: "First week of consistent practice",
    targetDate: week1Date.toISOString().split("T")[0],
    criteria: "Complete practice sessions on 3-4 days this week",
    status: "pending",
  });
  
  // Week 2 milestone - building comfort
  const week2Date = new Date(today);
  week2Date.setDate(week2Date.getDate() + 14);
  milestones.push({
    milestone: "Feeling more comfortable with challenging topics",
    targetDate: week2Date.toISOString().split("T")[0],
    criteria: "Notice improvement in at least 2 areas you've been working on",
    status: "pending",
  });
  
  // Week 3 milestone - seeing progress
  const week3Date = new Date(today);
  week3Date.setDate(week3Date.getDate() + 21);
  milestones.push({
    milestone: "Progress you can see",
    targetDate: week3Date.toISOString().split("T")[0],
    criteria: weakSpots.length > 5 
      ? `Feel more confident in ${Math.ceil(weakSpots.length / 3)} topics`
      : "Build confidence in the areas you've been practicing",
    status: "pending",
  });
  
  // Week 4 milestone - celebrating growth
  const week4Date = new Date(today);
  week4Date.setDate(week4Date.getDate() + 28);
  milestones.push({
    milestone: "A month of growth",
    targetDate: week4Date.toISOString().split("T")[0],
    criteria: "Reflect on how far you've come since you started",
    status: "pending",
  });
  
  return milestones;
}
