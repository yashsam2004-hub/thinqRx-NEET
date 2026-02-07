/**
 * AI-Powered Improvement Plan Generator
 * Generates personalized, actionable study recommendations
 */

import { getOpenAIClient, getOpenAIModel } from "@/lib/ai/openai";
import { TopicPerformance, DifficultyPerformance, AnalyticsData } from "./calculate";

// Simple rank prediction type (rank predictor feature removed)
interface RankPrediction {
  predictedRank: number;
  percentile: number;
  confidenceLevel: string;
}

export interface ImprovementPlan {
  summary: string;
  priorityTopics: Array<{
    topicName: string;
    subjectName: string;
    reason: string;
    actionItems: string[];
  }>;
  studyStrategy: {
    focusAreas: string[];
    timeAllocation: Array<{
      area: string;
      percentage: number;
      reason: string;
    }>;
  };
  accuracyImprovementTips: string[];
  timeManagementTips: string[];
  motivationalInsights: string[];
}

/**
 * Generate personalized improvement plan using AI
 */
export async function generateImprovementPlan(
  analyticsData: AnalyticsData,
  rankPrediction?: RankPrediction,
  targetRank?: number
): Promise<ImprovementPlan> {
  // Create fallback rank prediction if not provided
  if (!rankPrediction) {
    const avgAccuracy = analyticsData.overallStats.avgAccuracy;
    rankPrediction = {
      predictedRank: Math.round(10000 * (1 - avgAccuracy / 100)), // Simple estimate
      percentile: avgAccuracy,
      confidenceLevel: analyticsData.overallStats.totalAttempts >= 10 ? "medium" : "low",
    };
  }
  const client = getOpenAIClient();
  const model = getOpenAIModel();

  // Prepare context for AI
  const weakTopics = analyticsData.topicPerformance
    .filter((t) => t.isWeak)
    .slice(0, 5);
  
  const strongTopics = analyticsData.topicPerformance
    .filter((t) => !t.isWeak)
    .slice(-3);

  const prompt = buildImprovementPlanPrompt(
    analyticsData,
    rankPrediction,
    weakTopics,
    strongTopics,
    targetRank
  );

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: IMPROVEMENT_PLAN_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const aiResponse = JSON.parse(content);

    // Validate and structure the response
    return {
      summary: aiResponse.summary || "Continue practicing consistently to improve",
      priorityTopics: aiResponse.priorityTopics || generateFallbackPriorityTopics(weakTopics),
      studyStrategy: aiResponse.studyStrategy || generateFallbackStudyStrategy(analyticsData),
      accuracyImprovementTips: aiResponse.accuracyImprovementTips || FALLBACK_ACCURACY_TIPS,
      timeManagementTips: aiResponse.timeManagementTips || FALLBACK_TIME_TIPS,
      motivationalInsights: aiResponse.motivationalInsights || generateMotivationalInsights(rankPrediction),
    };
  } catch (error) {
    console.error("Error generating improvement plan:", error);
    // Return fallback plan if AI fails
    return generateFallbackPlan(analyticsData, rankPrediction, weakTopics);
  }
}

const IMPROVEMENT_PLAN_SYSTEM_PROMPT = `You are an expert GPAT (Graduate Pharmacy Aptitude Test) coach and data analyst. 
Your role is to analyze student performance data and create actionable, personalized improvement plans.

Guidelines:
- Be specific and actionable
- Prioritize weak areas but acknowledge strengths
- Provide realistic time allocations
- Focus on exam strategy, not just content
- Be encouraging but honest
- Consider difficulty patterns and time management
- Avoid generic advice - use the specific data provided

Output Format: JSON with the following structure:
{
  "summary": "2-3 sentence overview of current performance and key focus areas",
  "priorityTopics": [
    {
      "topicName": "Topic name",
      "subjectName": "Subject name",
      "reason": "Why this topic needs attention",
      "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"]
    }
  ],
  "studyStrategy": {
    "focusAreas": ["Area 1", "Area 2", "Area 3"],
    "timeAllocation": [
      {
        "area": "Weak topics revision",
        "percentage": 40,
        "reason": "Why this allocation"
      }
    ]
  },
  "accuracyImprovementTips": ["Tip 1", "Tip 2", "Tip 3"],
  "timeManagementTips": ["Tip 1", "Tip 2", "Tip 3"],
  "motivationalInsights": ["Insight 1", "Insight 2", "Insight 3"]
}`;

function buildImprovementPlanPrompt(
  analyticsData: AnalyticsData,
  rankPrediction: RankPrediction,
  weakTopics: TopicPerformance[],
  strongTopics: TopicPerformance[],
  targetRank?: number
): string {
  const { overallStats, difficultyPerformance, timeVsAccuracyCorrelation } = analyticsData;

  return `Analyze this GPAT student's performance and create a personalized improvement plan:

OVERALL PERFORMANCE:
- Total Attempts: ${overallStats.totalAttempts}
- Average Accuracy: ${overallStats.avgAccuracy.toFixed(1)}%
- Average Score: ${overallStats.avgScore.toFixed(1)}
- Total Study Time: ${Math.floor(overallStats.totalTimeSpent / 3600)} hours ${Math.floor((overallStats.totalTimeSpent % 3600) / 60)} minutes
- Weak Topics: ${overallStats.weakTopics}
- Strong Topics: ${overallStats.strongTopics}

RANK PREDICTION:
- Predicted Rank: ${rankPrediction.predictedRank}
- Percentile: ${rankPrediction.percentile.toFixed(1)}
- Confidence: ${rankPrediction.confidenceLevel}
${targetRank ? `- Target Rank: ${targetRank}` : ""}

WEAK TOPICS (Need Attention):
${weakTopics.map(t => `- ${t.topicName} (${t.subjectName}): ${t.avgAccuracy.toFixed(1)}% accuracy, ${t.totalAttempts} attempts, Trend: ${t.trend}`).join('\n')}

STRONG TOPICS (Maintaining Well):
${strongTopics.map(t => `- ${t.topicName} (${t.subjectName}): ${t.avgAccuracy.toFixed(1)}% accuracy`).join('\n')}

DIFFICULTY ANALYSIS:
${difficultyPerformance.map(d => `- ${d.difficulty.toUpperCase()}: ${d.avgAccuracy.toFixed(1)}% accuracy, ${d.totalAttempts} attempts`).join('\n')}

TIME VS ACCURACY:
- Correlation: ${timeVsAccuracyCorrelation.toFixed(2)} ${
  timeVsAccuracyCorrelation > 0.3 ? '(Slower = More Accurate)' :
  timeVsAccuracyCorrelation < -0.3 ? '(Faster = More Accurate)' :
  '(No strong correlation)'
}

Create a detailed, actionable improvement plan focusing on:
1. Top 3-5 priority topics to work on
2. Specific study strategy with time allocation
3. Accuracy improvement techniques
4. Time management strategies
5. Motivational insights based on progress

Make recommendations specific to this student's data. Be honest but encouraging.`;
}

function generateFallbackPriorityTopics(weakTopics: TopicPerformance[]) {
  return weakTopics.slice(0, 3).map((topic) => ({
    topicName: topic.topicName,
    subjectName: topic.subjectName,
    reason: topic.weaknessReason || `Low accuracy: ${topic.avgAccuracy.toFixed(1)}%`,
    actionItems: [
      "Review fundamental concepts thoroughly",
      "Practice 10-15 questions daily on this topic",
      "Identify common mistake patterns",
      "Take a focused test after 3 days of practice",
    ],
  }));
}

function generateFallbackStudyStrategy(analyticsData: AnalyticsData) {
  const weakPercentage = Math.min(50, analyticsData.overallStats.weakTopics * 5);
  return {
    focusAreas: [
      "Weak topic intensive revision",
      "Mock test practice",
      "Strong topic maintenance",
    ],
    timeAllocation: [
      {
        area: "Weak topics revision",
        percentage: weakPercentage,
        reason: "Address knowledge gaps in weak areas",
      },
      {
        area: "Mock tests and analysis",
        percentage: 30,
        reason: "Build exam temperament and identify patterns",
      },
      {
        area: "Strong topic practice",
        percentage: 20,
        reason: "Maintain proficiency in strong areas",
      },
    ],
  };
}

const FALLBACK_ACCURACY_TIPS = [
  "Read questions carefully before attempting",
  "Eliminate obviously wrong options first",
  "Don't rush - accuracy is more important than speed",
  "Review incorrect answers to understand mistakes",
  "Practice conceptual understanding, not memorization",
];

const FALLBACK_TIME_TIPS = [
  "Allocate time per question before starting",
  "Skip difficult questions and return later",
  "Practice with timer to build speed",
  "Focus on faster recall of frequently tested concepts",
];

function generateMotivationalInsights(rankPrediction: RankPrediction): string[] {
  const insights: string[] = [];
  
  if (rankPrediction.percentile >= 75) {
    insights.push("You're in the top 25%! Keep up the excellent work.");
    insights.push("Consistency is key - maintain your study schedule.");
  } else if (rankPrediction.percentile >= 50) {
    insights.push("You're making good progress. Focus on weak areas for improvement.");
    insights.push("Every practice session brings you closer to your goal.");
  } else {
    insights.push("There's significant room for improvement - stay committed.");
    insights.push("Many successful students started here - persistence pays off.");
  }
  
  insights.push("Regular practice and analysis lead to exponential growth.");
  
  return insights;
}

function generateFallbackPlan(
  analyticsData: AnalyticsData,
  rankPrediction: RankPrediction,
  weakTopics: TopicPerformance[]
): ImprovementPlan {
  return {
    summary: `Based on ${analyticsData.overallStats.totalAttempts} attempts, you have ${analyticsData.overallStats.weakTopics} weak topics to focus on. Current percentile: ${rankPrediction.percentile.toFixed(1)}%.`,
    priorityTopics: generateFallbackPriorityTopics(weakTopics),
    studyStrategy: generateFallbackStudyStrategy(analyticsData),
    accuracyImprovementTips: FALLBACK_ACCURACY_TIPS,
    timeManagementTips: FALLBACK_TIME_TIPS,
    motivationalInsights: generateMotivationalInsights(rankPrediction),
  };
}
