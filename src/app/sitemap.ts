import { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thinqr.com";
  const supabase = await createSupabaseServerClient();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gpat`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/subjects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Fetch subjects dynamically
  const { data: subjects } = await supabase
    .from("syllabus_subjects")
    .select("id")
    .order("order");

  const subjectRoutes: MetadataRoute.Sitemap =
    subjects?.map((subject) => ({
      url: `${baseUrl}/subjects/${subject.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) || [];

  // Fetch topics dynamically
  const { data: topics } = await supabase
    .from("syllabus_topics")
    .select("id, is_free_preview")
    .order("order");

  const topicRoutes: MetadataRoute.Sitemap =
    topics
      ?.filter((topic) => topic.is_free_preview) // Only include free preview topics in sitemap
      .map((topic) => ({
        url: `${baseUrl}/topics/${topic.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })) || [];

  return [...staticRoutes, ...subjectRoutes, ...topicRoutes];
}
