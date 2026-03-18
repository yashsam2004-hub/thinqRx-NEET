import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[Signout] Error:", error);
  }

  // Always redirect to home page after signout, even if there was an error
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"), {
    status: 302,
  });
}

// Handle GET requests gracefully (e.g., if someone navigates directly to the URL)
export async function GET() {
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"), {
    status: 302,
  });
}
