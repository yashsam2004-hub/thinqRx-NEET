import { NextResponse } from "next/server";
import { z } from "zod";
import { getChemicalStructureUrl } from "@/lib/chemistry/pubchem";

const reqSchema = z.object({
  name: z.string().min(1),
});

/**
 * API endpoint to get chemical structure image URL
 * GET /api/chemistry/structure?name=Thalidomide
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    const parsed = reqSchema.safeParse({ name });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid chemical name" },
        { status: 400 }
      );
    }

    const imageUrl = await getChemicalStructureUrl(parsed.data.name);

    if (!imageUrl) {
      return NextResponse.json(
        { ok: false, error: "Chemical not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      name: parsed.data.name,
      imageUrl,
    });
  } catch (error) {
    console.error("Error fetching chemical structure:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
