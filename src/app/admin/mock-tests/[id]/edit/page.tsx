"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface MockTest {
  id: string;
  exam_name: string;
  test_name: string;
  description: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  negative_marking: boolean;
  negative_marking_value: number;
  instructions: string[];
  is_published: boolean;
  plan_restriction: string;
}

export default function EditMockTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mockTest, setMockTest] = useState<MockTest | null>(null);
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    fetchMockTest();
  }, []);

  const fetchMockTest = async () => {
    try {
      const response = await fetch(`/api/admin/mock-tests/${resolvedParams.id}`);
      if (!response.ok) throw new Error("Failed to fetch mock test");
      
      const data = await response.json();
      setMockTest(data);
      setInstructions(data.instructions?.join("\n") || "");
    } catch (error) {
      console.error("Error fetching mock test:", error);
      alert("Failed to load mock test");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockTest) return;

    setSaving(true);
    try {
      const instructionsArray = instructions
        .split("\n")
        .filter((line) => line.trim());

      const response = await fetch(`/api/admin/mock-tests/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...mockTest,
          instructions: instructionsArray,
        }),
      });

      if (!response.ok) throw new Error("Failed to update mock test");

      alert("Mock test updated successfully!");
      router.push("/admin/mock-tests");
    } catch (error) {
      console.error("Error updating mock test:", error);
      alert("Failed to update mock test");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!mockTest) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Mock Test Not Found
            </h2>
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/mock-tests">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-slate-800">
                Edit Mock Test
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="exam_name">Exam Name</Label>
                <Input
                  id="exam_name"
                  value={mockTest.exam_name}
                  onChange={(e) =>
                    setMockTest({ ...mockTest, exam_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="test_name">Test Name</Label>
                <Input
                  id="test_name"
                  value={mockTest.test_name}
                  onChange={(e) =>
                    setMockTest({ ...mockTest, test_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={mockTest.description}
                  onChange={(e) =>
                    setMockTest({ ...mockTest, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="instructions">
                  Instructions (one per line)
                </Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={5}
                  placeholder="Each line will be a separate instruction"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Test Configuration
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={mockTest.duration_minutes}
                  onChange={(e) =>
                    setMockTest({
                      ...mockTest,
                      duration_minutes: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="plan">Plan Restriction</Label>
                <select
                  id="plan"
                  value={mockTest.plan_restriction}
                  onChange={(e) =>
                    setMockTest({ ...mockTest, plan_restriction: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="free">Free</option>
                  <option value="plus">Plus</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Label htmlFor="negative_marking">Negative Marking</Label>
              <Switch
                id="negative_marking"
                checked={mockTest.negative_marking}
                onCheckedChange={(checked) =>
                  setMockTest({ ...mockTest, negative_marking: checked })
                }
              />
            </div>

            {mockTest.negative_marking && (
              <div className="mt-4">
                <Label htmlFor="negative_value">Negative Marking Value</Label>
                <Input
                  id="negative_value"
                  type="number"
                  step="0.1"
                  value={mockTest.negative_marking_value}
                  onChange={(e) =>
                    setMockTest({
                      ...mockTest,
                      negative_marking_value: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <Label htmlFor="is_published">Published</Label>
              <Switch
                id="is_published"
                checked={mockTest.is_published}
                onCheckedChange={(checked) =>
                  setMockTest({ ...mockTest, is_published: checked })
                }
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/admin/mock-tests">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
