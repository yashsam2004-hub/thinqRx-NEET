"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Course {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

type StatusState = { type: "success" | "error"; message: string } | null;

const DEFAULT_PAYLOAD = `{
  "subjects": [
    {
      "name": "Physical Chemistry",
      "order": 0,
      "topics": [
        { "name": "Thermodynamics", "order": 0, "is_free_preview": true },
        { "name": "Chemical Kinetics", "order": 1, "is_free_preview": false }
      ]
    },
    {
      "name": "Medicinal Chemistry",
      "order": 1,
      "topics": [
        { "name": "Drug Design", "order": 0, "is_free_preview": true }
      ]
    }
  ]
}`;

export default function AdminSyllabusPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>("");
  const [payload, setPayload] = React.useState(DEFAULT_PAYLOAD);
  const [status, setStatus] = React.useState<StatusState>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingCourses, setLoadingCourses] = React.useState(true);

  // Load courses on mount
  React.useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          const activeCourses = data.courses?.filter((c: Course & { isActive: boolean }) => c.isActive) || [];
          setCourses(activeCourses);
          if (activeCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(activeCourses[0].id);
          }
        }
      } catch (error) {
        toast.error("Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [selectedCourseId]);

  async function handleImport() {
    if (!selectedCourseId) {
      toast.error("Please select a course first");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const parsed = JSON.parse(payload);
      const res = await fetch("/api/admin/syllabus/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...parsed, courseId: selectedCourseId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus({
          type: "error",
          message: json.message || json.error || "Failed to import syllabus.",
        });
        toast.error(json.message || json.error || "Import failed");
        return;
      }
      setStatus({ 
        type: "success", 
        message: `Syllabus imported successfully for ${courses.find(c => c.id === selectedCourseId)?.name || 'course'}!` 
      });
      toast.success("Syllabus imported successfully!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid JSON payload.";
      setStatus({ type: "error", message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/syllabus/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus({
          type: "error",
          message: json.message || json.error || "Failed to seed syllabus.",
        });
        return;
      }
      setStatus({ type: "success", message: "Seed syllabus loaded." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Seed request failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Syllabus Management</h1>
        <p className="mt-2 text-slate-600">
          Upload subjects and topics JSON for each course independently
        </p>
      </header>

      {loadingCourses ? (
        <Card className="p-6">
          <p className="text-center text-slate-600">Loading courses...</p>
        </Card>
      ) : courses.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-slate-600">
            No GPAT course found in the database. Please ensure the course exists in the courses table.
          </p>
        </Card>
      ) : (
        <Card className="space-y-6 p-6">
          {/* Course Selector */}
          <div className="space-y-2">
            <Label htmlFor="course-select" className="text-base font-semibold">
              Select Course
            </Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger id="course-select" className="w-full max-w-md">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{course.name}</span>
                      <span className="text-xs text-slate-500">({course.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCourse && (
              <p className="text-sm text-slate-600">
                📚 Uploading syllabus for: <span className="font-semibold">{selectedCourse.name}</span>
              </p>
            )}
          </div>

          {/* JSON Editor */}
          <div className="space-y-2">
            <Label htmlFor="json-payload" className="text-base font-semibold">
              Syllabus JSON
            </Label>
            <Textarea
              id="json-payload"
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Paste your syllabus JSON here..."
            />
            <p className="text-xs text-slate-500">
              Format: {`{ "subjects": [{ "name": "...", "order": 0, "topics": [...] }] }`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button 
              onClick={handleImport} 
              disabled={loading || !selectedCourseId}
              size="lg"
            >
              {loading ? "Importing..." : "Import Syllabus"}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleSeed} 
              disabled={loading}
              size="lg"
            >
              {loading ? "Seeding..." : "Seed Default Syllabus"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setPayload(DEFAULT_PAYLOAD)}
              disabled={loading}
            >
              Reset to Template
            </Button>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`rounded-lg p-4 ${
              status.type === "success" 
                ? "bg-emerald-50 border border-emerald-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              <p className={status.type === "success" ? "text-emerald-800" : "text-red-800"}>
                {status.message}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-slate-50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">💡 JSON Format Guide</h3>
        <div className="space-y-2 text-sm text-slate-700">
          <p><strong>subjects:</strong> Array of subject objects</p>
          <p><strong>name:</strong> Subject name (e.g., "Physical Chemistry")</p>
          <p><strong>order:</strong> Display order (0, 1, 2...)</p>
          <p><strong>topics:</strong> Array of topic objects within each subject</p>
          <p><strong>is_free_preview:</strong> Boolean - true for free access, false for paid</p>
          <p><strong>guardrails:</strong> Optional - AI generation instructions</p>
        </div>
        <div className="mt-4 p-3 bg-white rounded border border-slate-200 font-mono text-xs overflow-x-auto">
          <pre>{DEFAULT_PAYLOAD}</pre>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          📄 See <code className="px-1 py-0.5 bg-slate-200 rounded text-xs">admin files/1_syllabus_template.json</code> for complete example
        </p>
      </Card>
    </div>
  );
}
