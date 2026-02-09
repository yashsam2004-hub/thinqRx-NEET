import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { userId, courseId, plan, billingCycle, amount } = await request.json();

    if (!userId || !courseId || !plan || !amount) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user details
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get course details
    const { data: course } = await supabase
      .from("courses")
      .select("name, code")
      .eq("id", courseId)
      .single();

    if (!course) {
      return NextResponse.json(
        { ok: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${userId.substring(0, 8)}`;
    const invoiceDate = new Date().toLocaleDateString("en-IN");

    // Create invoice data
    const invoice = {
      invoiceNumber,
      date: invoiceDate,
      customer: {
        name: "Customer",
        email: profile.email,
      },
      items: [
        {
          description: `${course.name} (${course.code}) - ${plan.toUpperCase()} Plan`,
          billingCycle: billingCycle === "annual" ? "Annual Subscription" : "Monthly Subscription",
          amount: amount,
        },
      ],
      subtotal: amount,
      tax: 0, // Add tax if applicable
      total: amount,
      plan: plan.toUpperCase(),
      course: course.name,
    };

    // In a real implementation, you would:
    // 1. Store invoice in database
    // 2. Send invoice email using a service like SendGrid, Resend, etc.
    // 3. Generate PDF invoice
    
    // For now, we'll just log it
    console.log("Invoice generated:", invoice);

    // Store invoice record (you can add an invoices table)
    // await supabase.from("invoices").insert({
    //   user_id: userId,
    //   course_id: courseId,
    //   invoice_number: invoiceNumber,
    //   amount: amount,
    //   plan: plan,
    //   billing_cycle: billingCycle,
    //   invoice_data: invoice,
    // });

    return NextResponse.json({
      ok: true,
      invoice,
      message: `Invoice ${invoiceNumber} generated and sent to ${profile.email}`,
    });
  } catch (error: any) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate invoice", details: error.message },
      { status: 500 }
    );
  }
}
