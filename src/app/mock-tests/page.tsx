import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/enrollments";
import { 
  ClipboardList, 
  ArrowRight,
  Clock,
  FileQuestion,
  Lock,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function MockTestsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get GPAT course (default for now)
  const { data: gpatCourse } = await supabase
    .from("courses")
    .select("id")
    .ilike("code", "gpat")
    .single();

  const courseId = gpatCourse?.id;

  // Get user's plan
  const userPlan = courseId ? await getUserPlan(user.id, courseId) : "free";

  // Get mock tests
  const { data: mockTests } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  // Get user's attempts for these tests (from mock_test_attempts table)
  const { data: userAttempts } = await supabase
    .from("mock_test_attempts")
    .select("id, mock_test_id, score, max_score, accuracy_percentage, submitted_at, status")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .in("mock_test_id", mockTests?.map(t => t.id) || [])
    .order("submitted_at", { ascending: false });

  const getAttemptsForTest = (testId: string) => {
    return userAttempts?.filter(a => a.mock_test_id === testId) || [];
  };

  const getBestAttempt = (testId: string) => {
    const attempts = getAttemptsForTest(testId);
    if (attempts.length === 0) return null;
    return attempts.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  // Count unique tests attempted (for Plus users)
  const uniqueTestsAttempted = new Set(
    userAttempts?.map(a => a.mock_test_id) || []
  ).size;

  const canAccessTest = (testId: string) => {
    // Free users: NO access
    if (userPlan === "free") return false;
    
    // Pro users: ALL tests
    if (userPlan === "pro") return true;
    
    // Plus users: Can attempt 2 tests only
    if (userPlan === "plus") {
      // Can access if they haven't reached the 2-test limit yet
      if (uniqueTestsAttempted < 2) return true;
      
      // Can access only tests they've already attempted (for retake)
      const hasAttemptedThisTest = userAttempts?.some(a => a.mock_test_id === testId);
      return hasAttemptedThisTest;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F2' }}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <Badge className="mb-4 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-950/70 flex items-center gap-1.5 w-fit border-0">
                <ClipboardList className="h-3.5 w-3.5" />
                Full-Length Practice
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-3">
                GPAT Practice Tests
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl">
                Build comfort with exam format through full-length practice sessions
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/50">
                  <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Available tests</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{mockTests?.length || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <FileQuestion className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Questions each</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">200</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Clock className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Suggested time</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">3 hours</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Plan Access Info */}
          <Card className="p-6 border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-slate-50/50 dark:from-blue-950/30 dark:to-slate-900/50 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/50">
                  {userPlan === "pro" ? (
                    <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
                    Your Plan: {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                  </h3>
                  {userPlan === "free" && (
                    <>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                        Practice tests are available for Plus and Pro members. Upgrade to start practicing!
                      </p>
                      <Link href="/upgrade">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 border-0">
                          <Sparkles className="h-4 w-4" />
                          View Plans
                        </Button>
                      </Link>
                    </>
                  )}
                  {userPlan === "plus" && (
                    <>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                        <strong>Mock Tests:</strong> {uniqueTestsAttempted} / 2 used
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        Plus members can attempt 2 practice tests. Upgrade to Pro for unlimited access to all tests.
                      </p>
                      <Link href="/upgrade">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 border-0">
                          <Sparkles className="h-4 w-4" />
                          Upgrade to Pro
                        </Button>
                      </Link>
                    </>
                  )}
                  {userPlan === "pro" && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Unlimited access to all practice tests ✨
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Mock Tests Grid */}
        {mockTests && mockTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTests.map((test: any, index: number) => {
              const hasAccess = canAccessTest(test.id);
              const attempts = getAttemptsForTest(test.id);
              const bestAttempt = getBestAttempt(test.id);
              const isPlus = userPlan === "plus";
              const plusLimitReached = isPlus && uniqueTestsAttempted >= 2 && attempts.length === 0;

              return (
                <Card
                  key={test.id}
                  className={`p-6 border transition-all ${
                    hasAccess 
                      ? "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg dark:bg-slate-800/50" 
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {test.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
                        <FileQuestion className="h-4 w-4" />
                        <span>{test.total_questions || 0} Questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Clock className="h-4 w-4" />
                        <span>{test.duration_minutes || 180} minutes</span>
                      </div>
                    </div>

                    {!hasAccess && (
                      <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-0 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Pro
                      </Badge>
                    )}
                  </div>

                  {/* Show attempt history */}
                  {bestAttempt && attempts.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                              Best Score
                            </span>
                          </div>
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                            {attempts.length} attempt{attempts.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                          {bestAttempt.accuracy_percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {bestAttempt.score} / {bestAttempt.max_score} marks
                        </div>
                      </div>
                      
                      {/* Show latest attempts */}
                      {attempts.length > 1 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                            View all attempts ({attempts.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {attempts.slice(0, 5).map((att, idx) => (
                              <Link key={att.id} href={`/mock-tests/${test.id}/result/${att.id}`}>
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {new Date(att.submitted_at!).toLocaleDateString()}
                                    </span>
                                    <span className="font-semibold text-slate-800 dark:text-white">
                                      {att.accuracy_percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                  {/* Plus limit warning */}
                  {plusLimitReached && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-800">
                        <strong>Plus Plan Limit:</strong> You've used both test attempts. 
                        <Link href="/upgrade" className="underline ml-1">Upgrade to Pro</Link> for unlimited access.
                      </p>
                    </div>
                  )}

                  {hasAccess ? (
                    <Link href={`/mock-tests/${test.id}/instructions`}>
                      <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all">
                        <ClipboardList className="h-4 w-4" />
                        {attempts.length > 0 ? "Practice again" : "Start practice"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  ) : (
                    <button 
                      disabled
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-700 px-6 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    >
                      <Lock className="h-4 w-4" />
                      {userPlan === "free" 
                        ? "Upgrade to access" 
                        : plusLimitReached 
                        ? "Plus: 2 tests used" 
                        : "Upgrade to Pro"}
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 dark:bg-slate-800/30">
            <div className="mx-auto w-fit p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <ClipboardList className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Mock Tests Available</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Mock tests will be added soon by the admin</p>
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
