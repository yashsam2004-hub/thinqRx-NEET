import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/enrollments";
import InstructionsClient from "./InstructionsClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";

export default async function MockTestInstructionsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const supabase = await createSupabaseServerClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get mock test details
  const { data: mockTest, error: testError } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("id", testId)
    .eq("status", "published")
    .single();

  if (testError || !mockTest) {
    return (
      <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
        <Navigation />
        <div className="flex items-center justify-center px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Test not found
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This practice test may not exist or is not published yet.
            </p>
            <Link href="/mock-tests">
              <Button variant="outline">
                Go to Practice Tests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check user's plan
  const userPlan = await getUserPlan(user.id, mockTest.course_id);
  
  // Free users: NO access
  if (userPlan === "free") {
    return (
      <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
        <Navigation />
        <div className="flex items-center justify-center px-6 py-16">
          <div className="max-w-2xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
              <svg className="h-10 w-10 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
              Plus or Pro Plan Required
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              Practice tests are available for Plus and Pro members
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/pricing">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                  View Plans
                </Button>
              </Link>
              <Link href="/mock-tests">
                <Button variant="outline">
                  Practice Tests
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Plus users: Check if they've reached their limit
  if (userPlan === "plus") {
    const { data: previousAttempts } = await supabase
      .from("mock_test_attempts")
      .select("mock_test_id")
      .eq("user_id", user.id)
      .neq("mock_test_id", testId);

    const uniqueTests = new Set(previousAttempts?.map(a => a.mock_test_id) || []);
    
    if (uniqueTests.size >= 1) {
      return (
        <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
          <Navigation />
          <div className="flex items-center justify-center px-6 py-16">
            <div className="max-w-2xl text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
                <svg className="h-10 w-10 text-orange-600 dark:text-orange-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
                Plus Plan Limit Reached
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                Plus members can attempt 1 practice test. You&apos;ve already attempted a different test. 
                Upgrade to Pro for unlimited access to all tests.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/upgrade">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                    Upgrade to Pro
                  </Button>
                </Link>
                <Link href="/mock-tests">
                  <Button variant="outline">
                    Practice Tests
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Pro users: Full access (no additional checks)

  // Check for existing attempt
  const { data: existingAttempt } = await supabase
    .from("mock_test_attempts")
    .select("id, status, started_at")
    .eq("user_id", user.id)
    .eq("mock_test_id", testId)
    .eq("status", "in_progress")
    .single();

  return (
    <InstructionsClient
      mockTest={mockTest}
      existingAttempt={existingAttempt}
    />
  );
}
