"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StatusState = { type: "success" | "error"; message: string } | null;

const DEFAULT_OUTLINE = `[
  "Introduction",
  "Key Concepts",
  "Detailed Explanation",
  "Comparison Table",
  "Exam-Oriented Points",
  "Summary"
]`;

export default function AdminOutlinesPage() {
  const [courseCode, setCourseCode] = React.useState("gpat");
  const [outlineVersion, setOutlineVersion] = React.useState("v1");
  const [subjectName, setSubjectName] = React.useState("");
  const [topicName, setTopicName] = React.useState("");
  const [outlineJson, setOutlineJson] = React.useState(DEFAULT_OUTLINE);
  const [description, setDescription] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);
  const [status, setStatus] = React.useState<StatusState>(null);
  const [loading, setLoading] = React.useState(false);
  const [courses, setCourses] = React.useState<{ id: string; code: string; name: string }[]>([]);

  React.useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => { if (d.ok && d.courses?.length) setCourses(d.courses); });
  }, []);

  async function handleSave() {
    setLoading(true);
    setStatus(null);
    try {
      const outline = JSON.parse(outlineJson);
      if (!Array.isArray(outline) || outline.length === 0) {
        setStatus({ type: "error", message: "Outline must be a non-empty JSON array." });
        return;
      }
      const cleaned = outline.map((item) => String(item).trim()).filter(Boolean);
      if (!cleaned.length) {
        setStatus({ type: "error", message: "Outline entries cannot be empty." });
        return;
      }

      const res = await fetch("/api/admin/outlines", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          course_code: courseCode || "gpat",
          outline_version: outlineVersion || "v1",
          subject_name: subjectName,
          topic_name: topicName.trim() || "_default",
          outline: cleaned,
          description: description || undefined,
          is_default: isDefault || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus({
          type: "error",
          message: json.message || json.error || "Failed to save outline.",
        });
        return;
      }
      setStatus({ type: "success", message: "Outline saved successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Invalid JSON for outline.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Outlines Admin</h1>
        <p className="mt-2 text-slate-600">
          Define the section structure used to generate JSON notes.
        </p>
      </header>

      <Card className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseCode} onValueChange={setCourseCode}>
              <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.code}>{c.name} ({c.code})</SelectItem>
                ))}
                {courses.length === 0 && <SelectItem value="gpat">GPAT (gpat)</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="outlineVersion">Outline version</Label>
            <Input
              id="outlineVersion"
              value={outlineVersion}
              onChange={(e) => setOutlineVersion(e.target.value)}
              placeholder="v1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjectName">Subject</Label>
            <Input
              id="subjectName"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Pharmacology"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topicName">Topic (blank = subject default)</Label>
            <Input
              id="topicName"
              value={topicName}
              onChange={(event) => setTopicName(event.target.value)}
              placeholder="e.g. Endocrine System or leave blank"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outlineJson">Outline JSON (array of headings)</Label>
          <Textarea
            id="outlineJson"
            value={outlineJson}
            onChange={(event) => setOutlineJson(event.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Optional description</Label>
          <Input
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short summary of this outline"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-700">
          <Checkbox checked={isDefault} onCheckedChange={(value) => setIsDefault(Boolean(value))} />
          Use as default outline for the subject
        </label>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Outline"}
          </Button>
        </div>

        {status && (
          <p className={status.type === "success" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
            {status.message}
          </p>
        )}
      </Card>
    </div>
  );
}
