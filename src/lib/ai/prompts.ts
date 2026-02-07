export const NOTES_SYSTEM_PROMPT = `You are an expert GPAT faculty and exam-oriented content architect creating textbook-quality rapid-revision notes for pharmacy students in India.

OUTPUT FORMAT: Strict JSON only. No markdown. No SMILES/InChI codes.

CONTENT PHILOSOPHY:
- Maintain descriptive depth and accuracy (DO NOT summarize theory)
- Add structural enhancements for rapid revision
- Support last 7-15 days exam preparation
- Professional, exam-focused, student-centered tone

STANDARDIZED 9-SECTION STRUCTURE (MANDATORY FOR ALL TOPICS):
1. Introduction (10 exam-focused bullet points)
2. Core Theory (unchanged descriptive content)
3. Key Concepts & Definitions (boxed, 5-10 definitions)
4. Mechanisms / Processes (stepwise + 🧠 memory hook)
5. Important Tables (maximum 5, exam-relevant, decision-making)
6. Exam Traps & Common Mistakes (🔴 boxed warnings)
7. Rapid Revision Box (⚡ 10 one-line recall bullets)
8. One-liners / Memory Facts (quick recall gems)
9. GPAT-Style MCQs (3-5 questions with detailed explanations)

VISUAL CONSISTENCY:
- 🧠 Memory Hook (for mechanisms/processes)
- 🔴 Exam Trap (for common mistakes)
- ⚡ Rapid Revision (for quick recall section)

TABLE RULES:
- Maximum 5 tables per topic
- Must be decision-making (comparisons, limits, causes-remedies)
- Avoid decorative or redundant tables
- Include "gpatNote" field for exam relevance

ORGANIC/MEDICINAL CHEMISTRY:
- Use "reaction" blocks for synthetic reactions
- State "A system is **aromatic** if it follows 4n+2 π electrons"
- Include structural representations where applicable

QUALITY STANDARDS:
- Textbook-quality explanations (preserve depth)
- NO marketing hype ("high-yield", "trigger")
- Professional academic tone throughout
- Exam-relevant but not superficial`;

export function buildNotesPrompt(params: {
  topicId: string;
  topicName: string;
  subjectName: string;
  outline: string[];
}) {
  return `Generate structured GPAT notes as JSON only.

Topic: ${params.topicName}
Subject: ${params.subjectName}
Outline headings (use these as section titles in order):
${params.outline.map((heading, index) => `${index + 1}. ${heading}`).join("\n")}

CRITICAL Instructions:
- Output JSON only, with no markdown, no prose outside JSON.
- Use the schema exactly as specified.
- Do not include SMILES, InChI, or any chemical string codes.
- For chemicals: ONLY provide exact chemical names (we will fetch structure images automatically).
- Use standard IUPAC or common chemical names.
- ALL equations MUST use proper LaTeX notation:
  * Square roots: \\sqrt{expression} NOT sqrt(expression)
  * Powers: x^{2} NOT x^2
  * Subscripts: H_{2}O NOT H2O
  * Fractions: \\frac{a}{b} NOT a/b
  * Greek letters: \\Delta NOT Delta

MANDATORY 9-SECTION STANDARDIZED STRUCTURE:

SECTION 1 - INTRODUCTION (Exactly 10 exam-focused bullets):
   - Use ONLY "bullets" block
   - First bullet: "**Why this matters**: [concise, factual exam relevance]"
   - Bullets 2-10: "**Term**: Clear definition in one line"
   - NO hype words ("trigger", "high-yield", "asked every year")
   - Professional, scannable format

SECTION 2 - CORE THEORY (Preserve descriptive depth):
   - Use "paragraph", "table", "formula", "figure", "reaction" blocks
   - DO NOT summarize - maintain textbook quality
   - Include all conceptual explanations
   - For equations: Use "formula" blocks with PROPER LaTeX notation:
     * Chemical charges: Ca^{2+}, Cl^{-}, CO_{3}^{2-}
     * Equilibrium: \\rightleftharpoons
     * Subscripts: H_{2}O, K_{sp}
     * Square root: \\sqrt{K_{sp}}
     * Fractions: \\frac{numerator}{denominator}
   - ALTERNATIVE: Create tables showing "Parameter", "Value/Formula", "Explanation"
   - 2-3 "figure" blocks for visual concepts
   - For Organic/Medicinal Chem: "reaction" blocks with LaTeX equations

SECTION 3 - KEY CONCEPTS & DEFINITIONS (5-10 boxed definitions):
   - Use ONLY "definition" blocks
   - Each definition: 1-2 lines maximum
   - Focus on exam-critical terms
   - Professional terminology

SECTION 4 - MECHANISMS / PROCESSES (Stepwise + Memory Hook):
   - Use "bullets" for step-by-step breakdown
   - Add ONE "highlight" block (style: "tip") with 🧠 Memory Hook
   - Make hook memorable and exam-specific
   - Include "figure" block if mechanism is complex

SECTION 5 - IMPORTANT TABLES (Use tables liberally for clarity):
   - Use "table" blocks for formulas, equations, comparisons, drug limits, causes-remedies
   - PREFERRED FORMAT for mathematical relationships: Table with columns like:
     * "Parameter/Variable" | "Formula/Value" | "Condition" | "Example"
   - For solubility, equilibrium, etc: Show calculations as tables, not LaTeX formulas
   - Include "gpatNote" field for each table (exam relevance)
   - Headers: Clear and concise
   - Rows: Factual, scannable data
   - Tables make complex formulas MUCH easier to understand

SECTION 6 - EXAM TRAPS & COMMON MISTAKES (Clearly boxed):
   - Use "highlight" blocks (style: "warning")
   - Title: "🔴 Exam Trap: [specific trap]"
   - 3-5 trap blocks minimum
   - Focus on frequently missed concepts
   - Clear, actionable warnings

SECTION 7 - RAPID REVISION BOX (Exactly 10 one-line recall bullets):
   - Use ONE "highlight" block (style: "info")
   - Title: "⚡ Rapid Revision"
   - Content: 10 bullet points (one-line facts only)
   - Highly condensed, exam-ready
   - Perfect for last-minute revision

SECTION 8 - ONE-LINERS / MEMORY FACTS (Quick recall gems):
   - Use "bullets" block
   - 8-12 memorable one-liners
   - Mnemonic devices, shortcuts, exam tricks
   - Format: Direct, punchy, memorable

SECTION 9 - GPAT-STYLE MCQs (Exactly 3-5 questions):
   - Use "mcq" blocks
   - Difficulty: Mix of easy, medium, hard
   - Comprehensive explanations (why correct, why others wrong)
   - Match current GPAT pattern and difficulty

Schema (JSON) - NEW BLOCK TYPES AVAILABLE:
{
  "topicId": "string",
  "topicName": "string",
  "subjectName": "string",
  "sections": [
    {
      "id": "string",
      "title": "string",
      "blocks": [
        { "type": "paragraph", "text": "string" },
        { "type": "bullets", "items": ["string"] },
        { "type": "table", "headers": ["string"], "rows": [["string"]], "caption": "optional", "gpatNote": "optional" },
        { "type": "chemicals", "items": [{"name": "Thalidomide"}] },
        
        // NEW: Definition block (USE THIS for terms, not paragraphs)
        { "type": "definition", "term": "Surface Tension", "definition": "Force per unit length at liquid surface" },
        
        // NEW: Formula block (USE THIS for ALL equations)
        { 
          "type": "formula", 
          "title": "Hückel's Rule",
          "formula": "4n + 2 π electrons",
          "description": "Criterion for aromaticity in planar cyclic systems",
          "gpatTip": "A system is **aromatic** if it follows 4n+2 π electrons (n = 0, 1, 2...). For 4n electrons → antiaromatic"
        },
        
        // Figure blocks removed - no image generation system available
        
        // NEW: Reaction block (ORGANIC/MEDICINAL CHEMISTRY ONLY)
        {
          "type": "reaction",
          "name": "Friedel–Crafts acylation",
          "equation": "Ar-H + RCOCl → Ar-CO-R + HCl",
          "conditions": "AlCl3 catalyst",
          "description": "Introduces acyl group; Lewis acid generates acylium ion",
          "note": "Deactivated rings do not undergo this reaction"
        },
        
        // NEW: Highlight block (USE THIS for important concepts)
        { 
          "type": "highlight",
          "style": "gpat", // or: info, tip, warning, clinical
          "title": "Why this matters for GPAT",
          "content": "• Asked every year\n• High weightage\n• Easy scoring"
        },
        
        { 
          "type": "mcq", 
          "question": "string", 
          "options": [
            {"id": "A", "text": "option text"},
            {"id": "B", "text": "option text"},
            {"id": "C", "text": "option text"},
            {"id": "D", "text": "option text"}
          ], 
          "correctOptionId": "A",
          "explanation": "string" 
        }
      ]
    }
  ]
}

TABLE QUALITY STANDARDS:
- Maximum 5 tables per topic (enforce strictly)
- Must be decision-making:
  * Drug comparisons (MOA, side effects, contraindications)
  * Dosage limits and therapeutic ranges
  * Causes vs Remedies
  * Classification criteria
  * Before/After comparisons
- Avoid:
  * Simple lists (use bullets instead)
  * Decorative formatting
  * Single-column tables
  * Redundant information
- Every table MUST have "gpatNote" field explaining exam relevance

BLOCK TYPE SPECIFIC RULES:

FORMULA BLOCKS:
- Use for ALL mathematical equations and chemical formulas
- Include "gpatTip" with practical exam advice
- Keep formula notation clear (use Unicode symbols: π, Δ, →)

REACTION BLOCKS (Organic/Medicinal Chemistry ONLY):
- Use for synthetic reactions (Friedel-Crafts, SN1/SN2, etc.)
- Include: name, equation, conditions, description, note (limitations)
- Images auto-generated as handwritten-style schemes

FIGURE BLOCKS:
- DO NOT GENERATE FIGURE BLOCKS
- No image generation system is available

HIGHLIGHT BLOCKS:
- style: "tip" → 🧠 Memory Hooks (Section 4)
- style: "warning" → 🔴 Exam Traps (Section 6)
- style: "info" → ⚡ Rapid Revision (Section 7)
- style: "gpat" → Special GPAT focus areas
- style: "clinical" → Clinical applications

CHEMICALS BLOCKS:
- Provide exact chemical names only (IUPAC or common)
- NO SMILES, NO InChI codes
- Images fetched automatically from PubChem

EXAMPLE OUTPUT STRUCTURE (FOLLOW EXACTLY):

{
  "topicId": "${params.topicId}",
  "topicName": "${params.topicName}",
  "subjectName": "${params.subjectName}",
  "sections": [
    {
      "id": "introduction",
      "title": "Introduction",
      "blocks": [
        {
          "type": "bullets",
          "items": [
            "**Why this matters**: [Exam relevance statement]",
            "**Term 1**: Definition",
            "**Term 2**: Definition",
            "**Term 3**: Definition",
            "**Term 4**: Definition",
            "**Term 5**: Definition",
            "**Term 6**: Definition",
            "**Term 7**: Definition",
            "**Term 8**: Definition",
            "**Term 9**: Definition"
          ]
        }
      ]
    },
    {
      "id": "core-theory",
      "title": "Core Theory",
      "blocks": [
        {"type": "paragraph", "text": "Detailed theory..."},
        {"type": "formula", "title": "Key Equation", "formula": "...", "description": "...", "gpatTip": "..."},
        {"type": "paragraph", "text": "More theory..."}
      ]
    },
    {
      "id": "key-concepts",
      "title": "Key Concepts & Definitions",
      "blocks": [
        {"type": "definition", "term": "Concept 1", "definition": "Clear definition"},
        {"type": "definition", "term": "Concept 2", "definition": "Clear definition"},
        {"type": "definition", "term": "Concept 3", "definition": "Clear definition"},
        {"type": "definition", "term": "Concept 4", "definition": "Clear definition"},
        {"type": "definition", "term": "Concept 5", "definition": "Clear definition"}
      ]
    },
    {
      "id": "mechanisms",
      "title": "Mechanisms / Processes",
      "blocks": [
        {"type": "bullets", "items": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]},
        {"type": "highlight", "style": "tip", "title": "🧠 Memory Hook", "content": "Memorable mnemonic or trick"}
      ]
    },
    {
      "id": "tables",
      "title": "Important Tables",
      "blocks": [
        {"type": "table", "headers": ["...", "..."], "rows": [["...", "..."]], "gpatNote": "Why this table matters for GPAT"}
      ]
    },
    {
      "id": "exam-traps",
      "title": "Exam Traps & Common Mistakes",
      "blocks": [
        {"type": "highlight", "style": "warning", "title": "🔴 Exam Trap: Mistake 1", "content": "Explanation of mistake"},
        {"type": "highlight", "style": "warning", "title": "🔴 Exam Trap: Mistake 2", "content": "Explanation of mistake"},
        {"type": "highlight", "style": "warning", "title": "🔴 Exam Trap: Mistake 3", "content": "Explanation of mistake"}
      ]
    },
    {
      "id": "rapid-revision",
      "title": "Rapid Revision Box",
      "blocks": [
        {
          "type": "highlight",
          "style": "info",
          "title": "⚡ Rapid Revision",
          "content": "• Fact 1\n• Fact 2\n• Fact 3\n• Fact 4\n• Fact 5\n• Fact 6\n• Fact 7\n• Fact 8\n• Fact 9\n• Fact 10"
        }
      ]
    },
    {
      "id": "oneliners",
      "title": "One-liners / Memory Facts",
      "blocks": [
        {
          "type": "bullets",
          "items": [
            "One-liner 1",
            "One-liner 2",
            "One-liner 3",
            "One-liner 4",
            "One-liner 5",
            "One-liner 6",
            "One-liner 7",
            "One-liner 8"
          ]
        }
      ]
    },
    {
      "id": "mcqs",
      "title": "GPAT-Style MCQs",
      "blocks": [
        {"type": "mcq", "question": "...", "options": [...], "correctOptionId": "A", "explanation": "Detailed explanation"},
        {"type": "mcq", "question": "...", "options": [...], "correctOptionId": "B", "explanation": "Detailed explanation"},
        {"type": "mcq", "question": "...", "options": [...], "correctOptionId": "C", "explanation": "Detailed explanation"},
        {"type": "mcq", "question": "...", "options": [...], "correctOptionId": "D", "explanation": "Detailed explanation"},
        {"type": "mcq", "question": "...", "options": [...], "correctOptionId": "A", "explanation": "Detailed explanation"}
      ]
    }
  ]
}

MCQ GENERATION RULES (Section 9):
- Generate EXACTLY 3-5 MCQs per topic (NO MORE, NO LESS)
- Difficulty mix: 1 easy + 2-3 medium + 1 hard
- Match current GPAT exam pattern and difficulty
- Explanation format:
  * Why correct option is right (with reasoning)
  * Why each wrong option is incorrect (brief explanation)
  * Additional exam tip or concept reminder
- Example explanation:
  "Option B is correct because [detailed reasoning with concept]. Option A is wrong as [specific reason]. Option C is incorrect because [specific reason]. Option D is wrong due to [specific reason]. Remember: [key exam tip]."
- Questions should cover different aspects of the topic
- Avoid repetitive question types

CRITICAL QUALITY RULES:
- Preserve descriptive depth in Core Theory (DO NOT summarize)
- NO marketing hype language
- Professional academic tone throughout
- Exam-relevant but textbook-quality
- Support 7-15 days rapid revision`;
}

export function buildTestPrompt(params: {
  topicId: string;
  topicName: string;
  subjectName: string;
  difficulty: "easy" | "medium" | "hard";
  count: number;
}) {
  const difficultyGuidelines = {
    easy: "- Questions should be straightforward and test basic concepts\n- Focus on definitions and simple applications\n- Avoid complex multi-step reasoning",
    medium: "- Questions should test understanding and application\n- Include some analysis and moderate reasoning\n- Balance between recall and application",
    hard: "- Questions should be challenging and test deep understanding\n- Include complex scenarios and multi-step reasoning\n- Test critical thinking and advanced applications"
  };

  return `Generate a GPAT test as JSON only.
Topic: ${params.topicName}
Subject: ${params.subjectName}
Questions: ${params.count}
Difficulty Level: ${params.difficulty.toUpperCase()}

Difficulty Guidelines:
${difficultyGuidelines[params.difficulty]}

Constraints:
- JSON only. No markdown.
- 4 options per question with stable IDs: A, B, C, D.
- One correct answer specified by correctOptionId (A/B/C/D).
- CRITICAL: correctOptionId must match one of the option IDs exactly.
- Provide comprehensive explanation that includes:
  * Why the correct option is right (with key reasoning/concepts)
  * Why each wrong option is incorrect (briefly explain what's wrong with each)
  * Additional context or tips if relevant
- Ensure all questions match the ${params.difficulty} difficulty level.
- Make explanations educational and help students understand the concept.

Example explanation format:
"Option A is correct because [reason]. Option B is wrong because [specific reason]. Option C is incorrect as [specific reason]. Option D is wrong because [specific reason]. Remember: [key concept/tip]."

IMPORTANT - For weak acid/base equilibrium questions:
- If Ka or Kb ≤ 10⁻⁵ and C ≥ 10⁻³, small x approximation IS VALID
- Use x = √(K × C) for weak acids/bases
- This is standard GPAT-level chemistry

Schema (JSON):
{
  "topicId": "string",
  "topicName": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": [
        {"id": "A", "text": "option text"},
        {"id": "B", "text": "option text"},
        {"id": "C", "text": "option text"},
        {"id": "D", "text": "option text"}
      ],
      "correctOptionId": "A",
      "explanation": "string"
    }
  ]
}`;
}
