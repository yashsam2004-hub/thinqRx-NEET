"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/contexts/CourseContext";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  topicCount: number;
}

interface MockTest {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  questionCount: number;
  requiredPlan: string;
}

export default function CourseDashboardPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const { currentCourse, enrollment } = useCourse();
  
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [mockTests, setMockTests] = React.useState<MockTest[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Load subjects
  React.useEffect(() => {
    const loadSubjects = async () => {
      if (!courseId) return;

      try {
        const res = await fetch(`/api/courses/${courseId}/subjects`);
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error("Failed to load subjects:", error);
      }
    };
    loadSubjects();
  }, [courseId]);

  // Load mock tests
  React.useEffect(() => {
    const loadMockTests = async () => {
      if (!courseId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/courses/${courseId}/mock-tests`);
        if (res.ok) {
          const data = await res.json();
          setMockTests(data.tests || []);
        }
      } catch (error) {
        console.error("Failed to load mock tests:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMockTests();
  }, [courseId]);

  const userPlan = enrollment?.plan || "free";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          {currentCourse?.name || "Course Dashboard"}
        </h1>
        <p className="text-slate-600">
          Your current plan: <span className="font-semibold capitalize">{userPlan}</span>
          {enrollment?.status !== "active" && enrollment?.validUntil && (
            <span className="ml-2 text-red-600">
              (Expires: {new Date(enrollment.validUntil).toLocaleDateString()})
            </span>
          )}
        </p>
      </header>

      <Tabs defaultValue="study" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="study">📚 Study Material</TabsTrigger>
          <TabsTrigger value="practice">🧪 Practice Tests</TabsTrigger>
          <TabsTrigger value="mock">📝 Mock Tests</TabsTrigger>
        </TabsList>

        {/* Tab 1: Study Material */}
        <TabsContent value="study" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Study by Subject</h2>
            {subjects.length === 0 ? (
              <p className="text-slate-500">No subjects available yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <Link key={subject.id} href={`/subjects/${subject.id}`}>
                    <Card className="cursor-pointer p-4 transition-all hover:border-indigo-300 hover:shadow-md">
                      <h3 className="font-semibold text-slate-900">{subject.name}</h3>
                      {subject.description && (
                        <p className="mt-1 text-sm text-slate-600">{subject.description}</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">{subject.topicCount} topics</p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Practice Tests (AI-Powered) */}
        <TabsContent value="practice" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">AI-Powered Practice Tests</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Select a topic, difficulty, and number of questions to generate a custom test
                </p>
              </div>
              <Link href={`/courses/${courseId}/practice-test/create`}>
                <Button>Create Practice Test</Button>
              </Link>
            </div>

            <div className="mt-6 rounded-lg bg-indigo-50 p-4">
              <h3 className="font-semibold text-indigo-900">Plan Limits</h3>
              <ul className="mt-2 space-y-1 text-sm text-indigo-700">
                <li>
                  <strong>Free:</strong> 3 tests/day, max 10 questions
                </li>
                <li>
                  <strong>Plus:</strong> 15 tests/day, max 20 questions
                </li>
                <li>
                  <strong>Pro:</strong> Unlimited tests, max 20 questions
                </li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Mock Tests (Admin-Fed) */}
        <TabsContent value="mock" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Full-Length Mock Tests</h2>
            {loading ? (
              <p className="text-slate-500">Loading mock tests...</p>
            ) : mockTests.length === 0 ? (
              <p className="text-slate-500">No mock tests available yet.</p>
            ) : (
              <div className="grid gap-4">
                {mockTests.map((test) => {
                  const hasAccess =
                    test.requiredPlan === "free" ||
                    (test.requiredPlan === "plus" && (userPlan === "plus" || userPlan === "pro")) ||
                    (test.requiredPlan === "pro" && userPlan === "pro");

                  return (
                    <Card
                      key={test.id}
                      className={`p-6 ${!hasAccess ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-slate-900">{test.title}</h3>
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                              {test.requiredPlan.toUpperCase()}
                            </span>
                            {!hasAccess && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                          {test.description && (
                            <p className="mt-2 text-sm text-slate-600">{test.description}</p>
                          )}
                          <div className="mt-3 flex gap-6 text-sm text-slate-600">
                            <span>{test.questionCount} questions</span>
                            <span>{test.totalMarks} marks</span>
                            <span>{test.duration} minutes</span>
                          </div>
                        </div>

                        {hasAccess ? (
                          <Link href={`/mock-tests/${test.id}`}>
                            <Button>Start Test</Button>
                          </Link>
                        ) : (
                          <Link href={`/courses/${courseId}/pricing`}>
                            <Button variant="outline">Upgrade to Access</Button>
                          </Link>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
