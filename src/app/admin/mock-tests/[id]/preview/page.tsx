import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Clock, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface Question {
  question_id: string;
  subject: string;
  topic: string;
  difficulty?: string;
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_option: string;
  explanation?: string;
  marks: number;
  negative_marks?: number;
}

export default async function MockTestPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch the mock test
  const { data: mockTest, error } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !mockTest) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Mock Test Not Found
            </h2>
            <p className="text-slate-600 mb-6">
              The mock test you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/admin/mock-tests">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mock Tests
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const questions: Question[] = mockTest.questions_json?.questions || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/mock-tests">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {mockTest.test_name}
                </h1>
                <p className="text-sm text-slate-600">{mockTest.exam_name}</p>
              </div>
            </div>
            <Badge
              variant={mockTest.is_published ? "default" : "secondary"}
              className="text-sm"
            >
              {mockTest.is_published ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Published
                </>
              ) : (
                "Draft"
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Test Info */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-slate-600">Questions</p>
                <p className="text-xl font-bold text-slate-800">
                  {mockTest.total_questions}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-slate-600">Duration</p>
                <p className="text-xl font-bold text-slate-800">
                  {mockTest.duration_minutes} mins
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-slate-600">Total Marks</p>
                <p className="text-xl font-bold text-slate-800">
                  {mockTest.total_marks}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-slate-600">Negative</p>
                <p className="text-xl font-bold text-slate-800">
                  {mockTest.negative_marking ? mockTest.negative_marking_value : "No"}
                </p>
              </div>
            </div>
          </div>

          {mockTest.description && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">{mockTest.description}</p>
            </div>
          )}

          {mockTest.instructions && mockTest.instructions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Instructions:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {mockTest.instructions.map((instruction: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-600">
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">
            Questions ({questions.length})
          </h2>

          {questions.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <p className="text-slate-600">No questions found in this test.</p>
            </Card>
          ) : (
            questions.map((question, index) => (
              <Card key={question.question_id} className="p-6">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Q{index + 1}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {question.subject}
                      </Badge>
                      {question.topic && (
                        <Badge variant="secondary" className="text-xs">
                          {question.topic}
                        </Badge>
                      )}
                      {question.difficulty && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            question.difficulty.toLowerCase() === "easy"
                              ? "border-green-300 text-green-700"
                              : question.difficulty.toLowerCase() === "medium"
                              ? "border-yellow-300 text-yellow-700"
                              : "border-red-300 text-red-700"
                          }`}
                        >
                          {question.difficulty}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-800 font-medium">
                      {question.question_text}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-slate-600">
                      +{question.marks} marks
                    </p>
                    {question.negative_marks && question.negative_marks !== 0 && (
                      <p className="text-sm text-red-600">
                        {question.negative_marks} marks
                      </p>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {Object.entries(question.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border ${
                        key === question.correct_option
                          ? "bg-green-50 border-green-300"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{key}.</span>
                        <span className="text-slate-800">{value}</span>
                        {key === question.correct_option && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Explanation:
                    </p>
                    <p className="text-sm text-slate-600">{question.explanation}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
