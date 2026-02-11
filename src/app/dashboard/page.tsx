import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserEnrollments } from "@/lib/enrollments";
import { 
  GraduationCap, 
  BookOpen, 
  FileQuestion, 
  ClipboardList,
  Crown,
  Zap,
  Sparkles,
  ArrowRight,
  Calendar,
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  Home,
  LogOut,
  Shield,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  const user = session.user;

  // CRITICAL FIX: Get user's profile with proper error handling for missing profile
  // This handles race conditions where auth user exists but profile hasn't been created yet
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle missing profile gracefully

  if (profileError) {
    console.error("[Dashboard] Profile query error:", profileError);
  }

  // SAFETY: If profile doesn't exist (race condition), create it now
  if (!profile) {
    console.warn("[Dashboard] Profile not found for user, creating now:", user.id);
    
    const { error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email || "",
        created_at: new Date().toISOString(),
      });
    
    if (createError) {
      console.error("[Dashboard] Failed to create profile:", createError);
      // Continue anyway - use user.email as fallback
    }
  }

  console.log("[Dashboard] User profile:", {
    userId: user.id,
    email: profile?.email || user.email,
    role: profile?.role,
    hasProfile: !!profile,
    error: profileError?.message,
  });

  // Get user's enrollments with course details
  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id,
      plan,
      status,
      valid_until,
      created_at,
      courses (
        id,
        code,
        name,
        is_active
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Get mock tests count
  const { count: mockTestsCount } = await supabase
    .from("mock_tests")
    .select("*", { count: "exact", head: true });

  // Get user's test attempts stats
  const { data: attempts } = await supabase
    .from("user_attempts")
    .select("score, max_score")
    .eq("user_id", user.id);

  const totalAttempts = attempts?.length || 0;
  const averageScore = attempts && attempts.length > 0
    ? Math.round((attempts.reduce((sum, a) => {
        // Handle null or zero max_score
        if (!a.max_score || a.max_score === 0) return sum;
        return sum + (a.score / a.max_score) * 100;
      }, 0) / attempts.filter(a => a.max_score && a.max_score > 0).length) || 0)
    : 0;

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "pro":
        return <Crown className="h-4 w-4" />;
      case "plus":
        return <Zap className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "pro":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "plus":
        return "bg-gradient-to-r from-sky-400 to-sky-500";
      default:
        return "bg-gradient-to-r from-slate-500 to-slate-600";
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "pro":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "plus":
        return "bg-sky-100 text-sky-700 border-sky-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="min-h-screen gradient-sky-radial dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {profile?.role === "admin" && (
              <Link href="/admin">
                <Button className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white border-0 gap-2 shadow-lg">
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {/* SAFETY: Fallback to user.email if profile doesn't exist */}
              {profile?.email || user.email || "User"}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/50">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Practice sessions</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalAttempts}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/30 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Current average</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{averageScore}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <ClipboardList className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Practice tests</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{mockTestsCount || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Enrolled Courses */}
          <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              Your Courses
            </h2>
            
            {enrollments && enrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment: any) => (
                  <Card 
                    key={enrollment.id}
                    className="p-6 gradient-sky-card dark:bg-slate-800/50 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-sky-200 dark:border-sky-800"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                          {enrollment.courses.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{enrollment.courses.code}</p>
                      </div>
                      <Badge className={`${getPlanBadgeColor(enrollment.plan)} border flex items-center gap-1`}>
                        {getPlanIcon(enrollment.plan)}
                        {enrollment.plan.charAt(0).toUpperCase() + enrollment.plan.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Enrolled {new Date(enrollment.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className={`h-1 rounded-full ${getPlanColor(enrollment.plan)} mb-4`} />

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {enrollment.valid_until ? `Valid until ${new Date(enrollment.valid_until).toLocaleDateString()}` : "Lifetime Access"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-2 border-dashed border-sky-300 dark:border-sky-800 glass-morphism-sky dark:bg-slate-800/30">
                <div className="mx-auto w-fit p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <GraduationCap className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Active Courses</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Enroll in a course to start your learning journey</p>
                <Link href="/pricing">
                  <Badge className="bg-gradient-to-r from-sky-500 to-sky-600 text-white px-6 py-2 text-sm font-semibold cursor-pointer inline-flex items-center gap-2 shadow-md">
                    View Plans
                    <ArrowRight className="h-4 w-4" />
                  </Badge>
                </Link>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Study Material Card */}
          <Card className="p-8 border-2 border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50/50 via-white to-white dark:from-sky-950/30 dark:via-slate-800/50 dark:to-slate-800/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-sky-400/10 to-transparent rounded-full -ml-12 -mb-12" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/50 dark:to-sky-900/50 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-10 w-10 text-sky-600 dark:text-sky-400" />
                </div>
                <Badge className="bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Study Mode
                </Badge>
              </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
              Study Material
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Browse subjects, explore topics, and access AI-generated notes for focused learning
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span>AI-powered notes and explanations</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span>Organized by subjects and topics</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span>Visual aids and chemical structures</span>
              </div>
            </div>

            <Link href="/subjects">
              <Button className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white flex items-center justify-center gap-2 py-6 text-base font-semibold border-0 shadow-lg hover:shadow-xl transition-all">
                <BookOpen className="h-5 w-5" />
                Quick Revision
              </Button>
            </Link>
            </div>
          </Card>

          {/* Mock Tests Card */}
          <Card className="p-8 border-2 border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50/50 via-white to-white dark:from-sky-950/30 dark:via-slate-800/50 dark:to-slate-800/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-sky-400/10 to-transparent rounded-full -ml-12 -mb-12" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/50 dark:to-sky-900/50 group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-10 w-10 text-sky-600 dark:text-sky-400" />
                </div>
                <Badge className="bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Practice Mode
                </Badge>
              </div>

              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                Full-Length Practice Tests
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Build exam confidence with comprehensive CBT-style practice tests for pharma competitive exams
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-white dark:bg-slate-800 border border-sky-100 dark:border-sky-900">
                  <div className="text-3xl font-bold text-sky-600 dark:text-sky-400 mb-1">
                    {mockTestsCount || 0}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">Tests</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-3xl font-bold text-slate-700 dark:text-white mb-1">125</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">Questions</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-3xl font-bold text-slate-700 dark:text-white mb-1">3h</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">Duration</div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span>Real CBT exam experience</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span>Detailed performance analytics</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span>Subject-wise breakdown & insights</span>
                </div>
              </div>

              {mockTestsCount && mockTestsCount > 0 ? (
                <Link href="/mock-tests">
                  <Button className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white flex items-center justify-center gap-2 py-6 text-base font-semibold border-0 shadow-lg hover:shadow-xl transition-all">
                    <ClipboardList className="h-5 w-5" />
                    Practice Mock Tests
                  </Button>
                </Link>
              ) : (
                <div className="text-center py-6 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <ClipboardList className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tests Coming Soon</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">We're preparing comprehensive practice tests</p>
                </div>
              )}
            </div>
          </Card>

          {/* Analytics Card */}
          <Card className="p-8 border-2 border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50/50 via-white to-white dark:from-sky-950/30 dark:via-slate-800/50 dark:to-slate-800/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-sky-400/10 to-transparent rounded-full -ml-12 -mb-12" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/50 dark:to-sky-900/50 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-10 w-10 text-sky-600 dark:text-sky-400" />
                </div>
                <Badge className="bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Analytics
                </Badge>
              </div>

              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                Performance Analytics
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Track your progress with AI-powered insights and personalized recommendations
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span>Mock test performance tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span>Subject-wise strength analysis</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span>Progress trends and improvement areas</span>
                </div>
              </div>

              {totalAttempts > 0 ? (
                <Link href="/analytics">
                  <Button className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white flex items-center justify-center gap-2 py-6 text-base font-semibold border-0 shadow-lg hover:shadow-xl transition-all">
                    <BarChart3 className="h-5 w-5" />
                    Analyze Performance
                  </Button>
                </Link>
              ) : (
                <div className="text-center py-6 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <BarChart3 className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No Data Yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Take tests to see your analytics</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
