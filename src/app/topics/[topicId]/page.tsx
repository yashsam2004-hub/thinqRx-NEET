import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/Navigation";
import NotesLayout from "@/components/NotesLayout";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch topic with course_id
  const { data: topic } = await supabase
    .from("syllabus_topics")
    .select("id,name,subject_id,course_id")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) {
    return (
      <div className="min-h-screen gradient-sky-radial">
        <Navigation />
        <div className="mx-auto w-full max-w-4xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-slate-900">Topic not found</h1>
          <p className="text-slate-600 mt-2">The topic you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const { data: subject } = await supabase
    .from("syllabus_subjects")
    .select("id,name")
    .eq("id", topic.subject_id)
    .maybeSingle();

  return (
    <div className="min-h-screen gradient-sky-radial">
      <Navigation />
      <NotesLayout
        topicId={topic.id}
        topicName={topic.name}
        subjectName={subject?.name ?? "Subject"}
        courseId={topic.course_id}
      />
    </div>
  );
}
