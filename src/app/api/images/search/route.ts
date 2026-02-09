import { NextResponse } from "next/server";
import { z } from "zod";
import { getTopicImages } from "@/lib/images/searchImages";

export const dynamic = "force-dynamic";

const reqSchema = z.object({
  topicName: z.string().min(1),
  subjectName: z.string().default(""),
  limit: z.number().int().min(1).max(5).default(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = reqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", details: parsed.error },
        { status: 400 }
      );
    }

    const { topicName, subjectName, limit } = parsed.data;

    // Search for relevant images
    const images = await getTopicImages(topicName, subjectName);

    // Limit results
    const limitedImages = images.slice(0, limit);

    return NextResponse.json({
      ok: true,
      images: limitedImages,
    });
  } catch (error: any) {
    console.error("Image search error:", error);
    return NextResponse.json(
      { ok: false, error: "SEARCH_FAILED", message: error.message },
      { status: 500 }
    );
  }
}
