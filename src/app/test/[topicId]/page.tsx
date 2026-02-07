import { createSupabaseServerClient } from "@/lib/supabase/server";
import InteractiveTestUI from "@/components/InteractiveTestUI";

export default async function TopicTestPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: topic } = await supabase
    .from("syllabus_topics")
    .select("id,name")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Topic not found</h1>
      </div>
    );
  }

  return <InteractiveTestUI topicId={topic.id} topicName={topic.name} />;
}
