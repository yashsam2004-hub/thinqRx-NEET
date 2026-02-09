import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCSV, parseJSON, type ParsedQuestion } from "@/lib/bulk-upload/csv-parser";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bulk-upload
 * Bulk upload questions from CSV/JSON
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const { testId, fileContent, fileType } = body;

    if (!testId || !fileContent || !fileType) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify test exists
    const { data: test, error: testError } = await supabase
      .from("mock_tests")
      .select("id, course_id")
      .eq("id", testId)
      .maybeSingle();

    if (testError || !test) {
      return NextResponse.json(
        { ok: false, error: "TEST_NOT_FOUND", message: "Mock test not found" },
        { status: 404 }
      );
    }

    // Parse questions
    let parseResult;
    if (fileType === "csv") {
      parseResult = parseCSV(fileContent);
    } else if (fileType === "json") {
      parseResult = parseJSON(fileContent);
    } else {
      return NextResponse.json(
        { ok: false, error: "INVALID_FILE_TYPE", message: "File type must be csv or json" },
        { status: 400 }
      );
    }

    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "PARSE_FAILED",
          message: "Failed to parse file",
          errors: parseResult.errors,
          warnings: parseResult.warnings,
          stats: parseResult.stats,
        },
        { status: 400 }
      );
    }

    // Check for existing questions to prevent duplicates
    const { data: existingQuestions } = await supabase
      .from("mock_questions")
      .select("question_text")
      .eq("test_id", testId);

    const existingTexts = new Set(
      existingQuestions?.map((q) => q.question_text.trim().toLowerCase()) || []
    );

    // Filter out duplicates
    const parsedQuestions = parseResult.questions || [];
    const newQuestions = parsedQuestions.filter(
      (q) => !existingTexts.has(q.question_text.trim().toLowerCase())
    );

    const duplicateCount = parsedQuestions.length - newQuestions.length;

    if (newQuestions.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "NO_NEW_QUESTIONS",
          message: "All questions already exist in this test",
          stats: parseResult.stats,
        },
        { status: 400 }
      );
    }

    // Get current max order
    const { data: maxOrderRow } = await supabase
      .from("mock_questions")
      .select("order")
      .eq("test_id", testId)
      .order("order", { ascending: false })
      .limit(1)
      .maybeSingle();

    let currentOrder = maxOrderRow?.order || 0;

    // Prepare questions for insertion
    const questionsToInsert = newQuestions.map((q) => ({
      test_id: testId,
      subject: q.subject,
      topic: q.topic || null,
      question_text: q.question_text,
      options: q.options,
      answer_key: q.correct_option,
      explanation: q.explanation || null,
      marks: q.marks,
      negative: q.negative_marks,
      order: ++currentOrder,
    }));

    // Batch insert (handle large uploads in chunks)
    const BATCH_SIZE = 500;
    const batches = [];
    for (let i = 0; i < questionsToInsert.length; i += BATCH_SIZE) {
      batches.push(questionsToInsert.slice(i, i + BATCH_SIZE));
    }

    let totalInserted = 0;
    const insertErrors: string[] = [];

    for (const batch of batches) {
      const { data, error } = await supabase
        .from("mock_questions")
        .insert(batch)
        .select("id");

      if (error) {
        insertErrors.push(`Batch insert failed: ${error.message}`);
      } else {
        totalInserted += data?.length || 0;
      }
    }

    if (insertErrors.length > 0 && totalInserted === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "INSERT_FAILED",
          message: "Failed to insert questions",
          details: insertErrors,
        },
        { status: 500 }
      );
    }

    // Update test question count
    await supabase
      .from("mock_tests")
      .update({ question_count: currentOrder })
      .eq("id", testId);

    return NextResponse.json({
      ok: true,
      message: "Questions uploaded successfully",
      stats: {
        ...parseResult.stats,
        inserted: totalInserted,
        duplicates: duplicateCount,
        failed: insertErrors.length,
      },
      warnings: parseResult.warnings,
      errors: insertErrors.length > 0 ? insertErrors : undefined,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/bulk-upload?action=template
 * Download CSV template
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "template") {
      const template = `subject,topic,difficulty,question,optionA,optionB,optionC,optionD,correctOption,explanation,marks,negative
Pharmaceutical Chemistry,Medicinal Chemistry,medium,"Which drug is used to treat hypertension?",Aspirin,Atenolol,Paracetamol,Ibuprofen,B,"Atenolol is a beta-blocker used for treating high blood pressure.",4,1
Pharmaceutics,Formulation,easy,"What is the primary purpose of tablet coating?",Taste masking,Color enhancement,Logo branding,Price reduction,A,"Coating masks unpleasant taste and protects the drug.",4,1`;

      return new NextResponse(template, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="question_template.csv"',
        },
      });
    }

    return NextResponse.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
