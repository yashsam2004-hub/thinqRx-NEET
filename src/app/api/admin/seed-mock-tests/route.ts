import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  // Get GPAT course
  const { data: gpatCourse } = await supabase
    .from("courses")
    .select("id")
    .ilike("code", "gpat")
    .single();

  if (!gpatCourse) {
    return NextResponse.json({ error: "GPAT course not found" }, { status: 404 });
  }

  const courseId = gpatCourse.id;

  // Generate 15 mock tests with variations
  const generateMockTest = (testNumber: number) => {
    const baseQuestions = [
      {
        question_id: `Q${testNumber}_1`,
        subject: "Pharmacology",
        topic: "Cardiovascular Drugs",
        difficulty: "Medium",
        question_text: "<p>Which of the following is a selective beta-1 adrenergic blocker?</p>",
        options: { A: "Atenolol", B: "Propranolol", C: "Labetalol", D: "Carvedilol" },
        correct_option: "A",
        explanation: "Atenolol is a cardioselective (beta-1) adrenergic blocker. Propranolol is non-selective (blocks both beta-1 and beta-2). Labetalol and carvedilol are combined alpha and beta blockers.",
        marks: 4,
        negative_marks: -1
      },
      {
        question_id: `Q${testNumber}_2`,
        subject: "Pharmaceutical Chemistry",
        topic: "Medicinal Chemistry",
        difficulty: "Easy",
        question_text: "<p>The IUPAC name of aspirin is:</p>",
        options: { A: "Acetylsalicylic acid", B: "2-Acetoxybenzoic acid", C: "Salicylic acid", D: "Para-aminobenzoic acid" },
        correct_option: "B",
        explanation: "The IUPAC systematic name of aspirin is 2-acetoxybenzoic acid. Acetylsalicylic acid is the chemical/common name, which is also widely used.",
        marks: 4,
        negative_marks: -1
      },
      {
        question_id: `Q${testNumber}_3`,
        subject: "Pharmaceutics",
        topic: "Dosage Forms",
        difficulty: "Medium",
        question_text: "<p>Which of the following is an advantage of sustained-release formulations?</p>",
        options: { A: "Reduced dosing frequency", B: "Improved patient compliance", C: "Decreased side effects", D: "All of the above" },
        correct_option: "D",
        explanation: "Sustained-release formulations offer multiple advantages: reduced dosing frequency (once or twice daily), improved patient compliance due to convenience, and decreased side effects due to avoiding peak plasma concentrations.",
        marks: 4,
        negative_marks: -1
      },
      {
        question_id: `Q${testNumber}_4`,
        subject: "Pharmaceutical Analysis",
        topic: "Spectroscopy",
        difficulty: "Difficult",
        question_text: "<p>In UV-Visible spectroscopy, bathochromic shift refers to:</p>",
        options: { A: "Shift to shorter wavelength", B: "Shift to longer wavelength", C: "Increase in absorption intensity", D: "Decrease in absorption intensity" },
        correct_option: "B",
        explanation: "Bathochromic shift (red shift) refers to a shift in absorption maximum to a longer wavelength (lower energy). Hypsochromic shift is the opposite. Hyperchromic and hypochromic refer to intensity changes.",
        marks: 4,
        negative_marks: -1
      },
      {
        question_id: `Q${testNumber}_5`,
        subject: "Pharmacognosy",
        topic: "Natural Products",
        difficulty: "Easy",
        question_text: "<p>Quinine, an antimalarial drug, is obtained from:</p>",
        options: { A: "Cinchona bark", B: "Digitalis leaves", C: "Opium poppy", D: "Rauwolfia root" },
        correct_option: "A",
        explanation: "Quinine is obtained from the bark of Cinchona tree species (Cinchona officinalis). Digitalis yields cardiac glycosides, opium poppy yields morphine, and Rauwolfia yields reserpine.",
        marks: 4,
        negative_marks: -1
      }
    ];

    return {
      course_id: courseId,
      exam_type: "GPAT",
      title: `GPAT Mock Test - Test ${testNumber}`,
      description: `Full-length practice test ${testNumber} covering all GPAT subjects with comprehensive questions`,
      duration_minutes: 180,
      questions_json: { questions: baseQuestions },
      total_questions: 5,
      total_marks: 20,
      negative_marking: true,
      negative_marking_value: -1,
      instructions: [
        "This test contains 5 multiple-choice questions (sample format - actual tests will have 125 questions).",
        "Each correct answer carries 4 marks.",
        "There is negative marking of 1 mark for each incorrect answer.",
        "You can navigate between questions using the question palette.",
        "Questions can be marked for review and revisited later.",
        "The timer will show remaining time. Test will auto-submit when time expires.",
        "Click 'Submit Test' when you are ready to finish."
      ],
      status: "published",
      created_by: user.id
    };
  };

  // Generate 15 mock tests
  const mockTests = Array.from({ length: 15 }, (_, i) => generateMockTest(i + 1));

  /* Original 3 tests structure - replaced with 15 generated tests
  const mockTests = [
    {
      course_id: courseId,
      exam_type: "GPAT",
      title: "GPAT Mock Test 2026 - Test 1",
      description: "Full-length practice test covering all GPAT subjects with comprehensive questions",
      duration_minutes: 180,
      questions_json: {
        questions: [
          {
            question_id: "Q1",
            subject: "Pharmacology",
            topic: "Cardiovascular Drugs",
            difficulty: "Medium",
            question_text: "<p>Which of the following is a selective beta-1 adrenergic blocker?</p>",
            options: {
              A: "Atenolol",
              B: "Propranolol",
              C: "Labetalol",
              D: "Carvedilol"
            },
            correct_option: "A",
            explanation: "Atenolol is a cardioselective (beta-1) adrenergic blocker. Propranolol is non-selective (blocks both beta-1 and beta-2). Labetalol and carvedilol are combined alpha and beta blockers.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q2",
            subject: "Pharmaceutical Chemistry",
            topic: "Medicinal Chemistry",
            difficulty: "Easy",
            question_text: "<p>The IUPAC name of aspirin is:</p>",
            options: {
              A: "Acetylsalicylic acid",
              B: "2-Acetoxybenzoic acid",
              C: "Salicylic acid",
              D: "Para-aminobenzoic acid"
            },
            correct_option: "B",
            explanation: "The IUPAC systematic name of aspirin is 2-acetoxybenzoic acid. Acetylsalicylic acid is the chemical/common name, which is also widely used.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q3",
            subject: "Pharmaceutics",
            topic: "Dosage Forms",
            difficulty: "Medium",
            question_text: "<p>Which of the following is an advantage of sustained-release formulations?</p>",
            options: {
              A: "Reduced dosing frequency",
              B: "Improved patient compliance",
              C: "Decreased side effects",
              D: "All of the above"
            },
            correct_option: "D",
            explanation: "Sustained-release formulations offer multiple advantages: reduced dosing frequency (once or twice daily), improved patient compliance due to convenience, and decreased side effects due to avoiding peak plasma concentrations.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q4",
            subject: "Pharmaceutical Analysis",
            topic: "Spectroscopy",
            difficulty: "Difficult",
            question_text: "<p>In UV-Visible spectroscopy, bathochromic shift refers to:</p>",
            options: {
              A: "Shift to shorter wavelength",
              B: "Shift to longer wavelength",
              C: "Increase in absorption intensity",
              D: "Decrease in absorption intensity"
            },
            correct_option: "B",
            explanation: "Bathochromic shift (red shift) refers to a shift in absorption maximum to a longer wavelength (lower energy). Hypsochromic shift is the opposite. Hyperchromic and hypochromic refer to intensity changes.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q5",
            subject: "Pharmacognosy",
            topic: "Natural Products",
            difficulty: "Easy",
            question_text: "<p>Quinine, an antimalarial drug, is obtained from:</p>",
            options: {
              A: "Cinchona bark",
              B: "Digitalis leaves",
              C: "Opium poppy",
              D: "Rauwolfia root"
            },
            correct_option: "A",
            explanation: "Quinine is obtained from the bark of Cinchona tree species (Cinchona officinalis). Digitalis yields cardiac glycosides, opium poppy yields morphine, and Rauwolfia yields reserpine.",
            marks: 4,
            negative_marks: -1
          }
        ]
      },
      total_questions: 5,
      total_marks: 20,
      negative_marking: true,
      negative_marking_value: -1,
      instructions: [
        "This test contains 5 multiple-choice questions (sample format).",
        "Each correct answer carries 4 marks.",
        "There is negative marking of 1 mark for each incorrect answer.",
        "You can navigate between questions using the question palette.",
        "Questions can be marked for review and revisited later.",
        "The timer will show remaining time. Test will auto-submit when time expires.",
        "Click 'Submit Test' when you are ready to finish."
      ],
      status: "published",
      created_by: user.id
    },
    {
      course_id: courseId,
      exam_type: "GPAT",
      title: "GPAT Mock Test 2026 - Test 2",
      description: "Comprehensive practice test with focus on advanced concepts",
      duration_minutes: 180,
      questions_json: {
        questions: [
          {
            question_id: "Q1",
            subject: "Pharmacology",
            topic: "Antimicrobial Agents",
            difficulty: "Medium",
            question_text: "<p>Which of the following antibiotics inhibits bacterial cell wall synthesis?</p>",
            options: {
              A: "Tetracycline",
              B: "Penicillin",
              C: "Chloramphenicol",
              D: "Ciprofloxacin"
            },
            correct_option: "B",
            explanation: "Penicillin inhibits bacterial cell wall synthesis by blocking peptidoglycan cross-linking. Tetracycline and chloramphenicol inhibit protein synthesis, while ciprofloxacin inhibits DNA gyrase.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q2",
            subject: "Pharmaceutical Chemistry",
            topic: "Drug Design",
            difficulty: "Difficult",
            question_text: "<p>Bioisosterism in drug design refers to:</p>",
            options: {
              A: "Replacement of atoms with similar properties",
              B: "Creation of mirror image molecules",
              C: "Synthesis of prodrugs",
              D: "Addition of polar groups"
            },
            correct_option: "A",
            explanation: "Bioisosterism involves replacing atoms or groups with others having similar physicochemical or biological properties to modify drug characteristics while maintaining activity.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q3",
            subject: "Pharmaceutics",
            topic: "Biopharmaceutics",
            difficulty: "Medium",
            question_text: "<p>The bioavailability of a drug is defined as:</p>",
            options: {
              A: "Amount of drug reaching systemic circulation",
              B: "Rate of drug absorption",
              C: "Extent of drug distribution",
              D: "Rate of drug elimination"
            },
            correct_option: "A",
            explanation: "Bioavailability refers to the fraction (extent) of administered drug that reaches the systemic circulation in unchanged form. It is typically expressed as a percentage.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q4",
            subject: "Pharmaceutical Analysis",
            topic: "Chromatography",
            difficulty: "Medium",
            question_text: "<p>In HPLC, retention time is primarily determined by:</p>",
            options: {
              A: "Column temperature",
              B: "Sample concentration",
              C: "Mobile phase composition",
              D: "Injection volume"
            },
            correct_option: "C",
            explanation: "Retention time in HPLC is primarily determined by the mobile phase composition, which affects the interaction between analyte and stationary phase. Temperature also plays a role but is secondary.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q5",
            subject: "Pharmacognosy",
            topic: "Plant Alkaloids",
            difficulty: "Easy",
            question_text: "<p>Morphine belongs to which class of alkaloids?</p>",
            options: {
              A: "Tropane alkaloids",
              B: "Isoquinoline alkaloids",
              C: "Indole alkaloids",
              D: "Purine alkaloids"
            },
            correct_option: "B",
            explanation: "Morphine is classified as an isoquinoline alkaloid derived from opium poppy. Tropane alkaloids include atropine, indole alkaloids include reserpine, and purine alkaloids include caffeine.",
            marks: 4,
            negative_marks: -1
          }
        ]
      },
      total_questions: 5,
      total_marks: 20,
      negative_marking: true,
      negative_marking_value: -1,
      instructions: [
        "This test contains 5 multiple-choice questions (sample format).",
        "Each correct answer carries 4 marks.",
        "There is negative marking of 1 mark for each incorrect answer.",
        "You can navigate between questions using the question palette.",
        "Questions can be marked for review and revisited later.",
        "The timer will show remaining time. Test will auto-submit when time expires.",
        "Click 'Submit Test' when you are ready to finish."
      ],
      status: "published",
      created_by: user.id
    },
    {
      course_id: courseId,
      exam_type: "GPAT",
      title: "GPAT Mock Test 2026 - Test 3",
      description: "Practice test emphasizing clinical pharmacy and pharmacotherapeutics",
      duration_minutes: 180,
      questions_json: {
        questions: [
          {
            question_id: "Q1",
            subject: "Pharmacology",
            topic: "Antidiabetic Drugs",
            difficulty: "Medium",
            question_text: "<p>Metformin primarily acts by:</p>",
            options: {
              A: "Increasing insulin secretion",
              B: "Decreasing hepatic glucose production",
              C: "Increasing glucose absorption",
              D: "Inhibiting alpha-glucosidase"
            },
            correct_option: "B",
            explanation: "Metformin is a biguanide that primarily decreases hepatic glucose production and improves insulin sensitivity. It does not increase insulin secretion or glucose absorption.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q2",
            subject: "Pharmaceutical Chemistry",
            topic: "Steroids",
            difficulty: "Medium",
            question_text: "<p>Corticosteroids contain how many rings in their structure?</p>",
            options: {
              A: "3 rings",
              B: "4 rings",
              C: "5 rings",
              D: "6 rings"
            },
            correct_option: "B",
            explanation: "Corticosteroids have a steroid nucleus consisting of four fused rings: three cyclohexane rings (A, B, C) and one cyclopentane ring (D), forming the characteristic cyclopentanoperhydrophenanthrene structure.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q3",
            subject: "Pharmaceutics",
            topic: "Parenteral Preparations",
            difficulty: "Difficult",
            question_text: "<p>For intravenous injections, the preparation must be:</p>",
            options: {
              A: "Isotonic and sterile",
              B: "Only sterile",
              C: "Only pyrogen-free",
              D: "Isotonic, sterile, and pyrogen-free"
            },
            correct_option: "D",
            explanation: "Intravenous preparations must be isotonic to prevent hemolysis, sterile to prevent infection, and pyrogen-free to avoid fever reactions. All three conditions are essential.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q4",
            subject: "Pharmaceutical Analysis",
            topic: "Quality Control",
            difficulty: "Easy",
            question_text: "<p>The limit test for chloride uses which reagent?</p>",
            options: {
              A: "Barium chloride",
              B: "Silver nitrate",
              C: "Lead acetate",
              D: "Sodium hydroxide"
            },
            correct_option: "B",
            explanation: "The limit test for chloride uses silver nitrate, which forms a white precipitate of silver chloride with chloride ions. The turbidity is compared with a standard.",
            marks: 4,
            negative_marks: -1
          },
          {
            question_id: "Q5",
            subject: "Pharmacognosy",
            topic: "Glycosides",
            difficulty: "Medium",
            question_text: "<p>Digitalis glycosides are primarily used as:</p>",
            options: {
              A: "Antihypertensives",
              B: "Cardiac stimulants",
              C: "Diuretics",
              D: "Bronchodilators"
            },
            correct_option: "B",
            explanation: "Digitalis glycosides (like digoxin) are cardiac glycosides used as cardiac stimulants to increase the force of myocardial contraction, particularly in heart failure.",
            marks: 4,
            negative_marks: -1
          }
        ]
      },
      total_questions: 5,
      total_marks: 20,
      negative_marking: true,
      negative_marking_value: -1,
      instructions: [
        "This test contains 5 multiple-choice questions (sample format).",
        "Each correct answer carries 4 marks.",
        "There is negative marking of 1 mark for each incorrect answer.",
        "You can navigate between questions using the question palette.",
        "Questions can be marked for review and revisited later.",
        "The timer will show remaining time. Test will auto-submit when time expires.",
        "Click 'Submit Test' when you are ready to finish."
      ],
      status: "published",
      created_by: user.id
    }
  ]; */

  try {
    // Insert mock tests
    const { data, error } = await supabase
      .from("mock_tests")
      .insert(mockTests)
      .select();

    if (error) {
      console.error("Error inserting mock tests:", error);
      return NextResponse.json({ 
        error: "Failed to seed mock tests", 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${data.length} mock tests`,
      tests: data.map(t => ({ id: t.id, title: t.title }))
    });

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Unexpected error occurred", 
      details: error.message 
    }, { status: 500 });
  }
}
