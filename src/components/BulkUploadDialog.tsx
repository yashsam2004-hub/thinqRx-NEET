"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  FileJson,
} from "lucide-react";

interface BulkUploadDialogProps {
  testId: string;
  testTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParseStats {
  total: number;
  valid: number;
  invalid: number;
  inserted?: number;
  duplicates?: number;
  bySubject: Record<string, number>;
}

interface ParseError {
  row: number;
  field?: string;
  message: string;
}

export default function BulkUploadDialog({
  testId,
  testTitle,
  open,
  onOpenChange,
  onSuccess,
}: BulkUploadDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileContent, setFileContent] = React.useState<string>("");
  const [fileType, setFileType] = React.useState<"csv" | "json" | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState(false);
  const [stats, setStats] = React.useState<ParseStats | null>(null);
  const [errors, setErrors] = React.useState<ParseError[]>([]);
  const [warnings, setWarnings] = React.useState<ParseError[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setFileContent("");
      setFileType(null);
      setPreview(false);
      setStats(null);
      setErrors([]);
      setWarnings([]);
    }
  }, [open]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    let type: "csv" | "json" | null = null;

    if (fileName.endsWith(".csv")) {
      type = "csv";
    } else if (fileName.endsWith(".json")) {
      type = "json";
    } else {
      toast.error("Invalid file type. Please upload CSV or JSON file.");
      return;
    }

    setFile(selectedFile);
    setFileType(type);
    setPreview(false);
    setStats(null);
    setErrors([]);
    setWarnings([]);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(selectedFile);
  };

  const handlePreview = async () => {
    if (!fileContent || !fileType) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      const res = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          fileContent,
          fileType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStats(data.stats || null);
        setErrors(data.errors || []);
        setWarnings(data.warnings || []);
        setPreview(true);
        
        if (data.error === "NO_NEW_QUESTIONS") {
          toast.warning("All questions already exist in this test");
        } else if (data.error === "PARSE_FAILED") {
          toast.error("File contains errors. Review the errors below.");
        } else {
          toast.error(data.message || "Upload failed");
        }
        return;
      }

      setStats(data.stats);
      setWarnings(data.warnings || []);
      setErrors([]);
      setPreview(true);
      toast.success(data.message || "Questions uploaded successfully!");
      
      // Close dialog and refresh after success
      setTimeout(() => {
        onOpenChange(false);
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/api/admin/bulk-upload?action=template";
    link.download = "question_template.csv";
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Questions</DialogTitle>
          <p className="text-sm text-slate-600">Upload CSV or JSON file to {testTitle}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <Card className="border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Need a template?</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Download our CSV template with example questions and correct formatting.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </Card>

          {/* File Upload */}
          <div className="space-y-3">
            <Label>Upload File (CSV or JSON)</Label>
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              {file && (
                <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                  {fileType === "csv" ? (
                    <FileText className="h-4 w-4 text-slate-500" />
                  ) : (
                    <FileJson className="h-4 w-4 text-slate-500" />
                  )}
                  <span className="truncate text-sm text-slate-700">{file.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {fileType?.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Expected Format */}
          <Card className="border-slate-200 p-4">
            <h4 className="mb-2 font-semibold text-slate-900">Expected Columns:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
              <div>
                • <code className="rounded bg-slate-100 px-1">subject</code> (required)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">topic</code> (optional)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">difficulty</code> (optional)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">question</code> (required)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">optionA</code> (required)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">optionB</code> (required)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">optionC</code> (required)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">optionD</code> (required)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">correctOption</code> (required: A/B/C/D)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">explanation</code> (optional)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">marks</code> (optional, default 4)
              </div>
              <div>
                • <code className="rounded bg-slate-100 px-1">negative</code> (optional, default 1)
              </div>
            </div>
          </Card>

          {/* Preview Results */}
          {preview && stats && (
            <Card className="border-slate-200 p-4">
              <h4 className="mb-3 font-semibold text-slate-900">Upload Summary</h4>
              
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                  <div className="text-xs text-slate-600">Total Rows</div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="text-2xl font-bold text-emerald-700">
                    {stats.inserted !== undefined ? stats.inserted : stats.valid}
                  </div>
                  <div className="text-xs text-emerald-700">
                    {stats.inserted !== undefined ? "Inserted" : "Valid"}
                  </div>
                </div>
                {stats.duplicates !== undefined && stats.duplicates > 0 && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <div className="text-2xl font-bold text-amber-700">{stats.duplicates}</div>
                    <div className="text-xs text-amber-700">Duplicates</div>
                  </div>
                )}
                {stats.invalid > 0 && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <div className="text-2xl font-bold text-red-700">{stats.invalid}</div>
                    <div className="text-xs text-red-700">Errors</div>
                  </div>
                )}
              </div>

              {/* Subject Breakdown */}
              {Object.keys(stats.bySubject).length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-2 text-sm font-medium text-slate-700">By Subject:</h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.bySubject).map(([subject, count]) => (
                      <Badge key={subject} variant="secondary">
                        {subject}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Card className="border-red-200 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <h4 className="font-semibold">Errors ({errors.length})</h4>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto text-sm text-red-600">
                {errors.slice(0, 10).map((err, i) => (
                  <div key={i}>
                    Row {err.row}
                    {err.field && ` (${err.field})`}: {err.message}
                  </div>
                ))}
                {errors.length > 10 && (
                  <div className="mt-2 text-xs text-red-500">
                    ...and {errors.length - 10} more errors
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5" />
                <h4 className="font-semibold">Warnings ({warnings.length})</h4>
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto text-sm text-amber-600">
                {warnings.slice(0, 5).map((warn, i) => (
                  <div key={i}>
                    Row {warn.row}: {warn.message}
                  </div>
                ))}
                {warnings.length > 5 && (
                  <div className="mt-2 text-xs text-amber-500">
                    ...and {warnings.length - 5} more warnings
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePreview}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Upload Questions
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
