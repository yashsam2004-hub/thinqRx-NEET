import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Check if user exists and is unconfirmed
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("[Resend] Error listing users:", listError);
      return NextResponse.json(
        { ok: false, error: "Failed to check user status" },
        { status: 500 }
      );
    }

    const user = users?.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if email exists or not (security)
      return NextResponse.json({
        ok: true,
        message: "If an account exists with this email, a verification link will be sent.",
      });
    }

    if (user.email_confirmed_at) {
      return NextResponse.json({
        ok: true,
        message: "This email is already verified. You can sign in directly.",
        alreadyVerified: true,
      });
    }

    // Generate a new signup confirmation link (triggers email if SMTP is configured)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: '', // Not needed for resend, but required by the API
    });

    if (linkError) {
      console.error("[Resend] generateLink error:", linkError);
      
      // Fallback: try magiclink approach
      const { error: magicError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (magicError) {
        console.error("[Resend] magiclink also failed:", magicError);
        return NextResponse.json(
          { ok: false, error: "Failed to send verification email. Please try again later." },
          { status: 500 }
        );
      }
    }

    console.log("[Resend] Verification email triggered for:", email);

    return NextResponse.json({
      ok: true,
      message: "Verification email sent. Please check your inbox and spam folder.",
    });
  } catch (error: any) {
    console.error("[Resend] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
