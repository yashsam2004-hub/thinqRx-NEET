/**
 * MIDDLEWARE: Authentication & Authorization Only
 * 
 * This middleware is correctly used for:
 * - Supabase auth session management
 * - Route protection (redirects)
 * - Admin role verification
 * 
 * ⚠️ Next.js 16 Warning About "proxy" Convention:
 * This is a FALSE POSITIVE. We are NOT using middleware for API proxying.
 * All external API calls (OpenAI) are properly handled in
 * server-side API routes under /api/*, not in middleware.
 * 
 * The warning can be safely ignored as our architecture is correct.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, getAdminAllowlist } from "@/lib/env";

const isBuildTime =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

function isProtectedPath(pathname: string) {
  const protectedPrefixes = ["/subjects", "/topics", "/test", "/analysis", "/admin", "/dashboard", "/analytics", "/study-plan", "/mock-tests"];
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin");
}

export async function middleware(request: NextRequest) {
  if (isBuildTime) return NextResponse.next();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  const pathname = request.nextUrl.pathname;
  const needsAuth = isProtectedPath(pathname);

  if (!needsAuth) {
    return NextResponse.next();
  }
  // Create a response that we can attach refreshed auth cookies to.
  const response = NextResponse.next({ request });

  // Clear any mismatched Supabase auth cookies from previous projects
  // to prevent token refresh failures in Edge runtime
  const currentProjectPrefix = env.NEXT_PUBLIC_SUPABASE_URL.split('.')[0].split('//')[1];
  const cookiesToClear = request.cookies.getAll().filter(cookie => 
    cookie.name.startsWith('sb-') && 
    cookie.name.includes('auth-token') &&
    !cookie.name.includes(currentProjectPrefix)
  );

  cookiesToClear.forEach(cookie => {
    request.cookies.delete(cookie.name);
    response.cookies.delete(cookie.name);
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Important: Use getSession() for cookie-based auth (more reliable for SSR)
  // Guard against edge fetch failures so we don't block page rendering.
  let user: { id: string; email?: string; email_confirmed_at?: string } | null = null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    user = session?.user ?? null;
  } catch {
    return response;
  }

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Check email verification for protected paths
  if (isProtectedPath(pathname) && user) {
    // Check if user is blocked (CRITICAL: Block before any other checks)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      if (profile?.status === "blocked") {
        console.log("[Middleware] User is blocked:", user.email);
        // Sign out the blocked user
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("blocked", "true");
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.error("[Middleware] Error checking user block status:", err);
    }

    if (!user.email_confirmed_at) {
      console.log("[Middleware] Email not verified for user:", user.email);
      const url = request.nextUrl.clone();
      url.pathname = "/verify-email";
      url.searchParams.set("email", user.email || "");
      return NextResponse.redirect(url);
    }

    // Check enrollment validity and expiration
    try {
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("plan, status, valid_until")
        .eq("user_id", user.id);

      const activeEnrollment = enrollments?.find((e: any) => 
        e.status === "active" && 
        (e.plan === "plus" || e.plan === "pro" || e.plan === "free")
      );

      // Check if paid plan has expired
      if (activeEnrollment?.valid_until && activeEnrollment.plan !== "free") {
        const now = new Date();
        const validUntil = new Date(activeEnrollment.valid_until);
        
        if (now > validUntil) {
          console.log("[Middleware] User subscription expired:", user.email);
          // Update enrollment status to expired
          await supabase
            .from("course_enrollments")
            .update({ status: "expired" })
            .eq("user_id", user.id)
            .eq("status", "active");

          const url = request.nextUrl.clone();
          url.pathname = "/upgrade";
          url.searchParams.set("expired", "true");
          return NextResponse.redirect(url);
        }
      }

      const hasPaidPlan = enrollments?.some((e: any) => 
        (e.plan === "plus" || e.plan === "pro") && e.status === "active"
      );
      const hasFreePlan = enrollments?.some((e: any) => 
        e.plan === "free" && e.status === "active"
      );

      // If user has Plus/Pro plan intention but no active enrollment, redirect to payment
      if (!hasPaidPlan && !hasFreePlan && user.email_confirmed_at) {
        // Check user metadata for selected plan
        const { data: { user: fullUser } } = await supabase.auth.getUser();
        const selectedPlan = fullUser?.user_metadata?.selected_plan;
        
        if (selectedPlan === "plus" || selectedPlan === "pro") {
          console.log("[Middleware] User needs to complete payment for:", selectedPlan);
          const url = request.nextUrl.clone();
          url.pathname = "/upgrade";
          url.searchParams.set("plan", selectedPlan);
          url.searchParams.set("required", "true");
          return NextResponse.redirect(url);
        }
      }
    } catch (err) {
      console.error("[Middleware] Error checking enrollment status:", err);
      // Don't block access if enrollment check fails
    }
  }

  if (isAdminPath(pathname) && user) {
    try {
      const allowlist = getAdminAllowlist();
      const email = (user.email ?? "").toLowerCase();
      const allowlisted = allowlist.length > 0 && allowlist.includes(email);
      
      if (!allowlisted) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        
        console.log("[Middleware] Admin check:", {
          userId: user.id,
          email: user.email,
          profile,
          error: error?.message,
        });
        
        const isAdmin = !error && profile?.role === "admin";
        
        if (!isAdmin) {
          console.log("[Middleware] Access denied - not admin, redirecting to /dashboard");
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
        
        console.log("[Middleware] Admin access granted");
      } else {
        console.log("[Middleware] Admin allowlisted:", email);
      }
    } catch (err) {
      console.error("[Middleware] Error checking admin status:", err);
      return response;
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


