"use client";

import * as React from "react";
import { Play, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function VideoBlock({
  videoId,
  title,
  description,
}: {
  videoId: string;
  title: string;
  description?: string;
}) {
  const [showVideo, setShowVideo] = React.useState(false);

  return (
    <Card className="my-8 overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-600">
            <Play className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-purple-900 mb-1">
              📺 Recommended Video
            </h3>
            <p className="text-sm text-purple-700">{title}</p>
          </div>
        </div>

        {description && (
          <p className="text-sm text-slate-600 mb-4">{description}</p>
        )}

        {!showVideo ? (
          <button
            onClick={() => setShowVideo(true)}
            className="w-full py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            Watch Video
          </button>
        ) : (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="mt-3 text-center">
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 hover:underline"
          >
            Open in YouTube
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}
