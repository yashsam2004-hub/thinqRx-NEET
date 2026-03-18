"use client";

import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Video, 
  Globe, 
  ExternalLink,
  BookMarked,
  GraduationCap,
  Newspaper,
  Youtube,
  FileQuestion,
  Beaker,
  Pill,
  Microscope,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

// Icon mapping
const iconMap: Record<string, any> = {
  Beaker,
  Pill,
  Microscope,
  Youtube,
  Video,
  ExternalLink,
  Newspaper,
  BookMarked,
  Globe,
};

interface Resource {
  id: string;
  category: string;
  title: string;
  description: string;
  url: string;
  image_url?: string;
  icon_name: string;
  is_external: boolean;
  display_order: number;
}

const categoryConfig = {
  reference_books: {
    title: "Reference Books",
    icon: BookMarked,
    gradient: "from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700",
    description: "Recommended textbooks to buy for NEET preparation"
  },
  video_lectures: {
    title: "Video Lectures",
    icon: Video,
    gradient: "from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700",
    description: "Video courses and lecture series"
  },
  official_links: {
    title: "Official Links",
    icon: Globe,
    gradient: "from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
    description: "Important government and exam portals"
  },
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Record<string, Resource[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResources() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: fetchError } = await supabase
          .from('resources')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        // Group by category
        const grouped = (data || []).reduce((acc, resource) => {
          if (!acc[resource.category]) acc[resource.category] = [];
          acc[resource.category].push(resource);
          return acc;
        }, {} as Record<string, Resource[]>);

        setResources(grouped);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation />
        <div className="container mx-auto max-w-7xl px-6 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-teal-600 dark:text-teal-400" />
            <p className="text-slate-600 dark:text-slate-400">Loading resources...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation />
        <div className="container mx-auto max-w-7xl px-6 py-16">
          <Card className="p-8 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Error loading resources</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation />

      {/* Hero Section */}
      <div className="container mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 text-sm font-semibold">
            <BookOpen className="h-4 w-4" />
            NEET Preparation Resources
          </div>
          <h1 className="mb-6 text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Study{" "}
            <span className="bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 bg-clip-text text-transparent">
              Resources
            </span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-slate-600 dark:text-slate-300">
            Curated resources to help you ace your NEET UG exam - reference books, video lectures, and official links.
          </p>
        </div>

        {/* Resource Categories */}
        <div className="space-y-12">
          {Object.entries(categoryConfig).map(([categoryKey, config]) => {
            const CategoryIcon = config.icon;
            const categoryResources = resources[categoryKey] || [];

            if (categoryResources.length === 0) return null;

            return (
              <div key={categoryKey} className="space-y-6">
                {/* Category Header */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
                      <CategoryIcon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {config.title}
                    </h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 pl-16">
                    {config.description}
                  </p>
                </div>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryResources.map((resource) => {
                    const ResourceIcon = iconMap[resource.icon_name] || ExternalLink;
                    const isPlaceholder = resource.url === "#";
                    const hasImage = resource.image_url && resource.image_url.trim() !== "";
                    
                    return (
                      <Card
                        key={resource.id}
                        className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group border-slate-200 dark:border-slate-700"
                      >
                        {/* Book Cover / Thumbnail Image */}
                        {hasImage && (
                          <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <img
                              src={resource.image_url}
                              alt={resource.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                              }}
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          </div>
                        )}
                        
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            {!hasImage && (
                              <div className="flex-shrink-0">
                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-950/30 transition-colors">
                                  <ResourceIcon className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
                                </div>
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                                {resource.title}
                                {resource.is_external && !isPlaceholder && (
                                  <ExternalLink className="h-4 w-4 text-slate-400" />
                                )}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {resource.description}
                              </p>
                            {isPlaceholder ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="w-full"
                              >
                                Coming Soon
                              </Button>
                            ) : resource.is_external ? (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full"
                              >
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full"
                                >
                                  Visit Resource
                                  <ExternalLink className="ml-2 h-3 w-3" />
                                </Button>
                              </a>
                            ) : (
                              <Link href={resource.url} className="block w-full">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full"
                                >
                                  Access Now
                                </Button>
                              </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30 border-teal-200 dark:border-teal-800 text-center">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Need More Help?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
              Explore our AI-powered study notes, practice tests, and personalized analytics to maximize your NEET preparation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/subjects">
                <Button size="lg" className="gap-2">
                  <BookOpen className="h-5 w-5" />
                  Browse Study Notes
                </Button>
              </Link>
              <Link href="/mock-tests">
                <Button size="lg" variant="outline" className="gap-2">
                  <FileQuestion className="h-5 w-5" />
                  Take Mock Tests
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer Note */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-8">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Note:</strong> Some resources are being updated regularly. Check back often for new materials and links.
          </p>
        </div>
      </div>
    </div>
  );
}
