import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/Navigation";
import { 
  FileText, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ClipboardCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function SubjectTopicsPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { data: subject } = await supabase
    .from("syllabus_subjects")
    .select("id,name")
    .eq("id", subjectId)
    .maybeSingle();

  const { data: topics } = await supabase
    .from("syllabus_topics")
    .select("id,name,order,is_free_preview")
    .eq("subject_id", subjectId)
    .order("order", { ascending: true });

  if (!subject) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="mx-auto w-full max-w-4xl px-6 py-10">
          <div className="text-center py-16">
            <div className="mx-auto w-fit p-4 rounded-2xl bg-red-100 mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Subject not found</h1>
            <p className="text-slate-600 mb-6">The subject you're looking for doesn't exist or has been removed.</p>
            <Link href="/subjects">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Subjects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8">
        <Link href="/subjects">
          <Button variant="ghost" className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Subjects
          </Button>
        </Link>
      </div>

      <header className="mb-12">
        <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1.5 w-fit">
          <BookOpen className="h-3.5 w-3.5" />
          {subject.name}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{subject.name} Topics</h1>
        <p className="text-xl text-slate-600">
          Select a topic to start learning with AI-powered study notes
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(topics ?? []).map((topic) => (
          <div
            key={topic.id}
            className="group relative rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 overflow-hidden"
          >
            {topic.is_free_preview && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Free
                </Badge>
              </div>
            )}

            {!topic.is_free_preview && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-blue-100 text-blue-700 border border-blue-300 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Premium
                </Badge>
              </div>
            )}

            <div className="relative pt-8">
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100 w-fit">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
                {topic.name}
              </h3>
              
              <div className="flex flex-col gap-2 mt-6">
                <Link href={`/topics/${topic.id}`}>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                    <FileText className="h-4 w-4" />
                    Quick Revision
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/test/${topic.id}`}>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-2 border-green-200 text-green-700 hover:bg-green-50">
                    <ClipboardCheck className="h-4 w-4" />
                    Practice Test
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!topics || topics.length === 0) && (
        <div className="text-center py-16">
          <div className="mx-auto w-fit p-4 rounded-2xl bg-slate-100 mb-4">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No topics available</h3>
          <p className="text-slate-600">This subject doesn't have any topics yet.</p>
        </div>
      )}
      </div>
    </div>
  );
}
