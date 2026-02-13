import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ResultsClient from "./ResultsClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";

export default async function MockTestResultPage({
  params,
}: {
  params: Promise<{ testId: string; attemptId: string }>;
}) {
  const { testId, attemptId } = await params;
  const supabase = await createSupabaseServerClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("mock_test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    return (
      <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
        <Navigation />
        <div className="flex items-center justify-center px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Results not found
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This test attempt may not exist or you don&apos;t have access to it.
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

  // If not submitted yet, redirect to test
  if (attempt.status === "in_progress") {
    redirect(`/mock-tests/${testId}/test?attempt=${attemptId}`);
  }

  // Get mock test details
  const { data: mockTest } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (!mockTest) {
    return (
      <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
        <Navigation />
        <div className="flex items-center justify-center px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Test not found
            </h1>
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

  return (
    <ResultsClient
      attempt={attempt}
      mockTest={mockTest}
    />
  );
}
