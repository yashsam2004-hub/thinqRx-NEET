"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ClipboardList,
  ArrowLeft,
  Plus,
  Upload,
  Eye,
  Trash2,
  Edit,
  FileJson,
  CheckCircle2,
  Clock,
  FileQuestion,
  AlertCircle,
  Loader2
} from "lucide-react";
import type { MockTest, MockTestData } from "@/types/mock-test";

export default function AdminMockTestsPage() {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2cc19159-9ff9-40a2-9212-cfabd14c46c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:36',message:'fetchMockTests called',data:{timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const res = await fetch("/api/admin/mock-tests");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2cc19159-9ff9-40a2-9212-cfabd14c46c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:39',message:'API response received',data:{status:res.status,ok:res.ok,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const data = await res.json();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2cc19159-9ff9-40a2-9212-cfabd14c46c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:40',message:'API data parsed',data:{dataOk:data.ok,testsCount:data.tests?.length,hasError:!!data.error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (data.ok) {
        setMockTests(data.tests || []);
      } else {
        toast.error("Failed to load mock tests");
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2cc19159-9ff9-40a2-9212-cfabd14c46c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:46',message:'fetchMockTests error',data:{errorMessage:error instanceof Error ? error.message : String(error),errorName:error instanceof Error ? error.name : 'Unknown'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
      // #endregion
      console.error("Error fetching mock tests:", error);
      toast.error("Failed to load mock tests");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSampleTests = async () => {
    if (mockTests.length > 0 && !confirm("This will add 15 sample tests. Continue?")) {
      return;
    }

    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-mock-tests", {
        method: "POST",
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Successfully seeded ${data.tests?.length || 15} mock tests!`);
        fetchMockTests();
      } else {
        toast.error(data.error || "Failed to seed mock tests");
      }
    } catch (error) {
      console.error("Error seeding tests:", error);
      toast.error("Failed to seed mock tests");
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;

    try {
      const res = await fetch(`/api/admin/mock-tests/${testId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete test");
        return;
      }
      
      toast.success("Test deleted successfully");
      fetchMockTests();
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("Failed to delete test");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
                <ClipboardList className="h-3.5 w-3.5 mr-1" />
                CBT Mock Tests
              </Badge>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Manage Mock Tests
              </h1>
              <p className="text-lg text-slate-600">
                Upload and manage CBT-style practice tests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSeedSampleTests}
                disabled={seeding}
                variant="outline"
                className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                {seeding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileJson className="h-4 w-4" />
                )}
                {seeding ? "Seeding..." : "Quick Seed (15 Tests)"}
              </Button>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2"
              >
                <Plus className="h-4 w-4" />
                Upload New Test
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Instructions */}
        <Card className="p-6 mb-8 border border-blue-200 bg-blue-50">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FileJson className="h-5 w-5 text-blue-600" />
            JSON Upload Format
          </h3>
          <div className="text-sm text-slate-700 space-y-2">
            <p>Upload mock tests as JSON files with the following structure:</p>
            <pre className="bg-white p-4 rounded-lg border border-slate-200 overflow-x-auto text-xs">
{`{
  "exam_name": "GPAT",
  "test_name": "GPAT Mock Test 1",
  "description": "Full-length practice test",
  "total_questions": 125,
  "total_marks": 500,
  "duration_minutes": 180,
  "negative_marking": true,
  "negative_marking_value": -1,
  "instructions": ["Read carefully", "No calculator allowed"],
  "questions": [
    {
      "question_id": "Q1",
      "subject": "Pharmacology",
      "topic": "Cardiovascular Drugs",
      "difficulty": "Medium",
      "question_text": "Which drug is a beta blocker?",
      "options": {
        "A": "Atenolol",
        "B": "Amlodipine", 
        "C": "Enalapril",
        "D": "Digoxin"
      },
      "correct_option": "A",
      "explanation": "Atenolol is a selective beta-1 blocker",
      "marks": 4,
      "negative_marks": -1
    }
  ]
}`}
            </pre>
          </div>
        </Card>

        {/* Mock Tests List */}
        {mockTests.length > 0 ? (
          <div className="grid gap-6">
            {mockTests.map((test) => (
              <Card key={test.id} className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-800">
                        {test.title}
                      </h3>
                      <Badge className={`border-0 ${
                        test.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : test.status === 'draft'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {test.status}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-0">
                        {test.exam_type}
                      </Badge>
                    </div>
                    {test.description && (
                      <p className="text-sm text-slate-600 mb-3">{test.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <FileQuestion className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">
                      {test.total_questions} Questions
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">
                      {test.total_marks} Marks
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">
                      {test.duration_minutes} Minutes
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">
                      {test.negative_marking ? `Negative: ${test.negative_marking_value}` : 'No Negative'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link href={`/admin/mock-tests/${test.id}/preview`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </Link>
                  <Link href={`/admin/mock-tests/${test.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTest(test.id)}
                    className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border border-slate-200 bg-white">
            <ClipboardList className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No mock tests yet
            </h3>
            <p className="text-slate-600 mb-6">
              Upload your first CBT-style practice test to get started
            </p>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Test
            </Button>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadTestModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            fetchMockTests();
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

// Upload Modal Component
function UploadTestModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<MockTestData | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json')) {
      toast.error("Please select a JSON file");
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
    setValidationWarnings([]);

    // Read and validate the file
    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);
      
      // Client-side validation
      const { validateMockTestData } = await import("@/lib/mock-test-validator");
      const validation = validateMockTestData(data);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast.error(`Validation failed: ${validation.errors.length} error(s) found`);
        return;
      }

      if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings);
        toast.warning(`${validation.warnings.length} warning(s) found`);
      }

      setPreview(data);
      toast.success("File validated successfully");
    } catch (error) {
      toast.error("Invalid JSON file");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !preview) return;

    setUploading(true);
    try {
      const res = await fetch("/api/admin/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success("Mock test uploaded successfully!");
        onSuccess();
      } else {
        toast.error(data.message || "Failed to upload test");
      }
    } catch (error) {
      console.error("Error uploading test:", error);
      toast.error("Failed to upload test");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 bg-white">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Upload Mock Test
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">
              Upload a JSON file containing your mock test questions
            </p>
          </div>

          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Validation Errors ({validationErrors.length})
              </h3>
              <ul className="space-y-1 text-sm text-red-700">
                {validationErrors.slice(0, 10).map((err, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{err.field}:</span> {err.message}
                  </li>
                ))}
                {validationErrors.length > 10 && (
                  <li className="text-red-600 italic">
                    ... and {validationErrors.length - 10} more errors
                  </li>
                )}
              </ul>
            </div>
          )}

          {validationWarnings.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">
                Warnings ({validationWarnings.length})
              </h3>
              <ul className="space-y-1 text-sm text-orange-700">
                {validationWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {preview && validationErrors.length === 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Validation Passed
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Test Name:</span>
                  <span className="font-medium text-slate-800">{preview.test_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Exam Type:</span>
                  <span className="font-medium text-slate-800">{preview.exam_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Questions:</span>
                  <span className="font-medium text-slate-800">{preview.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Duration:</span>
                  <span className="font-medium text-slate-800">{preview.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Marks:</span>
                  <span className="font-medium text-slate-800">{preview.total_marks}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || validationErrors.length > 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Test
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
          
          {validationErrors.length > 0 && (
            <p className="text-sm text-red-600 mt-2">
              Please fix validation errors before uploading
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
