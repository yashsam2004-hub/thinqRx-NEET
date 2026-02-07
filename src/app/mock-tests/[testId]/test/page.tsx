import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CBTTestInterface from "@/components/CBTTestInterface";

export default async function CBTTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { testId } = await params;
  const { attempt: attemptId } = await searchParams;

  if (!attemptId) {
    redirect(`/mock-tests/${testId}/instructions`);
  }

  const supabase = await createSupabaseServerClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get attempt details
  const { data: attempt, error: attemptError } = await supabase
    .from("mock_test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    redirect(`/mock-tests/${testId}/instructions`);
  }

  // If already submitted, redirect to results
  if (attempt.status !== "in_progress") {
    redirect(`/mock-tests/${testId}/result/${attemptId}`);
  }

  // Get mock test details
  const { data: mockTest } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (!mockTest) {
    redirect(`/mock-tests/${testId}/instructions`);
  }

  return (
    <CBTTestInterface
      attempt={attempt}
      mockTest={mockTest}
    />
  );
}
