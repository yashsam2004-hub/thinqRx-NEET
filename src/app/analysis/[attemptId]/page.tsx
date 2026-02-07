import AnalysisUI from "@/components/AnalysisUI";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <AnalysisUI attemptId={attemptId} />;
}
