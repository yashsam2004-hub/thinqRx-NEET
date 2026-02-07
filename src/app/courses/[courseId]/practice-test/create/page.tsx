"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCourse } from "@/contexts/CourseContext";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
}

export default function CreatePracticeTestPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const { currentCourse, enrollment } = useCourse();

  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [selectedSubject, setSelectedSubject] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = React.useState(10);

  const userPlan = enrollment?.plan || "free";

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
        toast.error("Failed to load subjects");
      }
    };
    loadSubjects();
  }, [courseId]);

  // Load topics when subject changes
  React.useEffect(() => {
    const loadTopics = async () => {
      if (!selectedSubject) {
        setTopics([]);
        return;
      }

      try {
        const res = await fetch(`/api/subjects/${selectedSubject}/topics`);
        if (res.ok) {
          const data = await res.json();
          setTopics(data.topics || []);
        }
      } catch (error) {
        toast.error("Failed to load topics");
      }
    };
    loadTopics();
  }, [selectedSubject]);

  // Get max questions based on plan
  const getMaxQuestions = () => {
    if (userPlan === "free") return 10;
    if (userPlan === "plus") return 20;
    return 20; // pro
  };

  const maxQuestions = getMaxQuestions();

  // Generate test
  const handleGenerate = async () => {
    if (!selectedTopic) {
      toast.error("Please select a topic");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic,
          courseId,
          difficulty,
          count: questionCount,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.message || data.error || "Failed to generate test");
        return;
      }

      toast.success("Practice test generated!");
      router.push(`/test/${selectedTopic}`);
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Generate Practice Test</h1>
        <p className="text-slate-600">
          Create an AI-generated practice test for {currentCourse?.name}
        </p>
      </header>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Select Subject *</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Select Topic *</Label>
            <Select
              value={selectedTopic}
              onValueChange={setSelectedTopic}
              disabled={!selectedSubject}
            >
              <SelectTrigger id="topic">
                <SelectValue placeholder={selectedSubject ? "Choose a topic" : "Select subject first"} />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level *</Label>
            <Select
              value={difficulty}
              onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionCount">Number of Questions *</Label>
            <Input
              id="questionCount"
              type="number"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              min="1"
              max={maxQuestions}
            />
            <p className="text-xs text-slate-500">
              Your plan allows up to {maxQuestions} questions
            </p>
          </div>

          <div className="rounded-lg bg-indigo-50 p-4">
            <h3 className="font-semibold text-indigo-900">Rate Limits</h3>
            <ul className="mt-2 space-y-1 text-sm text-indigo-700">
              <li>
                <strong>Free:</strong> 3 tests/day
              </li>
              <li>
                <strong>Plus:</strong> 15 tests/day
              </li>
              <li>
                <strong>Pro:</strong> Unlimited
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/courses/${courseId}`)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading || !selectedTopic}>
              {loading ? "Generating..." : "Generate Test"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
