# Cursor Prompt: Replace GPAT with New Exam

## How to Use

1. Open your **cloned project** (not the original ThinqRx) in Cursor
2. Replace ALL `[bracketed values]` below with your actual exam details
3. Copy everything inside the PROMPT section
4. Paste into Cursor chat in **Agent mode**
5. Let it run — it will edit ~60+ files
6. After it finishes, run `npm run build` to verify no errors

---

## PROMPT — Copy from here ↓

---

I am cloning this codebase to create a new exam preparation platform. Replace ALL references to "GPAT" and "ThinqRx" with a new exam and brand. Here are the details:

**New Exam Details:**
- Exam Name: [NEET PG]
- Exam Full Form: [National Eligibility cum Entrance Test for Post Graduate]
- Exam Code (lowercase, used in DB and URLs): [neetpg]
- Conducting Body: [NBE (National Board of Examinations)]
- Target Audience: [MBBS graduates seeking MD/MS admissions]
- Country: [India]
- Relevant Syllabus Body: [NMC (National Medical Commission)]
- Subjects & Weightage (for mock test generator): [Anatomy: 15, Physiology: 15, Biochemistry: 10, Pathology: 20, Pharmacology: 15, Microbiology: 10, Forensic Medicine: 5, PSM: 10, Surgery: 20, Medicine: 30, OBG: 15, Pediatrics: 10, Ophthalmology: 8, ENT: 7, Orthopedics: 5, Dermatology: 5]
- Total Questions Per Test: [200]
- Marks Per Correct Answer: [4]
- Negative Marks Per Wrong Answer: [1]
- Total Marks: [800]
- Duration (minutes): [210]

**New Brand Details:**
- Brand Name: [YourBrand]
- Company Name: [Your Company Pvt Ltd]
- Website Domain: [yourbrand.com]
- Support Email: [support@yourbrand.com]
- Tagline: [AI-Powered NEET PG Exam Preparation]
- Twitter Handle: [@yourbrand]

**New Plan Names (replace GPAT-specific plans):**
- Replace `gpat_last_minute` with: [neetpg_last_minute]
- Replace `gpat_2027_full` with: [neetpg_2026_full]
- Plan display names: [NEET PG Last Minute Pack] and [NEET PG 2026 Full Prep]

---

### Instructions — Follow ALL of these in order:

**PART A: Core Configuration**

1. **`src/config/platform.ts`** — Rewrite the entire PLATFORM object:
   - `brand` → new brand name
   - `company` → new company name
   - `domain` → "[Exam Name] Exam Preparation"
   - `tagline` → new tagline
   - `primaryExam` → new exam name
   - `keywords` → relevant SEO keywords for the new exam
   - `contact` → new email and website
   - `legal` → new company name, brand notice, platform description, disclaimer (mention NOT affiliated with the conducting body)

2. **`src/app/layout.tsx`** — Update ALL metadata:
   - `title.default` → "[Exam Name] Preparation Online | AI [Field] Exam Platform – [Brand]"
   - `description` → rewrite for new exam
   - `keywords` → all new exam keywords
   - `authors`, `creator`, `publisher` → new company name
   - `openGraph` → new title, description, siteName
   - `twitter` → new title, description, creator handle

3. **`src/lib/seo/metadata.ts`** — Replace "GPAT coaching" and any GPAT keywords.

**PART B: Exam Logic & AI**

4. **`src/lib/gpat/mock-generator.ts`** — This is critical:
   - Rename the file to `src/lib/exam/mock-generator.ts`
   - Rename `GPAT_SCHEME` → `EXAM_SCHEME` with the new subjects, weightage, marks, duration, total questions
   - Rename `GPATQuestion` → `ExamQuestion`
   - Rename `GPATMockTest` → `ExamMockTest`
   - Rename `generateGPATMockTest` → `generateExamMockTest`
   - Rename `calculateGPATScore` → `calculateExamScore`
   - Rename `validateGPATQuestionBank` → `validateExamQuestionBank`
   - Rename `shuffleOptions` parameter type accordingly
   - Update ALL comments to reference new exam
   - Then search the ENTIRE codebase for any import from `@/lib/gpat/mock-generator` and update to `@/lib/exam/mock-generator` with new function/type names

5. **`src/lib/ai/prompts.ts`** — Rewrite the AI persona:
   - Replace "GPAT faculty" → "[Exam Name] faculty"
   - Replace "PCI syllabus" → "[Syllabus Body] syllabus"
   - Replace pharmacy-specific subject names with new exam subjects
   - Replace "GPAT-Style MCQs" section name → "[Exam Name]-Style MCQs"
   - Update all subject-specific content generation instructions

6. **`src/lib/ai/masterPrompts.ts`** — Same treatment:
   - Replace "senior GPAT examiner" persona
   - Replace all pharmacy subject sections with new exam subjects
   - Update content generation rules for new exam's style

7. **`src/lib/ai/quickRevisionPrompts.ts`** — Rewrite:
   - Replace "GPAT faculty, topper-level note maker"
   - Replace ALL `gpatNote` → `examNote`
   - Replace `style: "gpat"` → `style: "exam"` (for highlight cards)
   - Replace "GPAT MCQ" → "[Exam Name] MCQ"
   - Replace "GPAT Insight" → "[Exam Name] Insight"
   - Replace "GPAT Trap" → "[Exam Name] Trap"

8. **`src/lib/ai/schemas.ts`** — Rename schema fields:
   - `gpatNote` → `examNote`
   - `gpatTip` → `examTip`
   - In the style enum, replace `"gpat"` → `"exam"`

9. **`src/lib/ai/validateMCQ.ts`** — Replace "GPAT-level quality" and "GPAT Check" with new exam name.

10. **`src/lib/ai/generateNotes.ts`** — Replace "GPAT-focused" reference.

11. **`src/lib/analytics/improvement-plan.ts`** — Replace "expert GPAT coach" with "[Exam Name] coach". Update the analysis prompt for new exam subjects.

12. **`src/lib/analytics/calculate.ts`** — Replace `"GPAT"` fallback exam type.

**PART C: Plans & Features**

13. **`src/lib/plans/features.ts`** — Replace:
    - `'gpat_last_minute'` → new plan ID (all occurrences)
    - `'gpat_2027_full'` → new plan ID (all occurrences)
    - Update plan display names and descriptions

14. **`src/lib/redis/rate-limit.ts`** — Update the comment about plan names.

15. **`src/config/faq.ts`** — Rewrite ALL FAQ content:
    - Replace `category: "gpat"` → `category: "[exam_code]"`
    - Rewrite every question and answer for the new exam
    - Update the TypeScript type for the category union

**PART D: API Routes**

16. Replace `.ilike("code", "gpat")` with `.ilike("code", "[exam_code]")` and all `"gpat"` default strings in:
    - `src/app/api/courses/route.ts`
    - `src/app/api/pricing/route.ts`
    - `src/app/api/ai/notes/route.ts`
    - `src/app/api/analytics/overview/route.ts`
    - `src/app/api/analytics/study-plan/route.ts`
    - `src/app/api/analytics/improvement-plan/route.ts`
    - `src/app/api/debug/analytics/route.ts`
    - `src/app/api/admin/mock-tests/route.ts`
    - `src/app/api/admin/seed-mock-tests/route.ts` (also update test titles and descriptions)
    - `src/app/api/admin/outlines/route.ts`

**PART E: UI Pages**

17. **`src/app/page.tsx`** — Update:
    - All fallback text strings (replace "GPAT" with new exam name)
    - The `heroTitle.includes("GPAT")` highlight logic → use new exam name
    - The `faqSchema` category type

18. **`src/app/gpat/page.tsx`** — Rename to `src/app/[exam_code]/page.tsx` and rewrite all content for the new exam. Update the function name from `GPATLandingPage`.

19. Update ALL these pages (replace GPAT text, plan names, headings):
    - `src/app/subjects/page.tsx` — "GPAT Syllabus" heading
    - `src/app/pricing/page.tsx` — plan names, icons, colors, "GPAT aspirants"
    - `src/app/upgrade/page.tsx` — plan switch cases, "GPAT preparation"
    - `src/app/mock-tests/page.tsx` — "GPAT Practice Tests", plan references
    - `src/app/resources/page.tsx` — "GPAT Preparation Resources"
    - `src/app/study-plan/page.tsx` — course lookup
    - `src/app/(auth)/signup/page.tsx` — rename `gpatCourseId` → `examCourseId`, update text
    - `src/app/privacy/page.tsx` — replace all GPAT and ThinqRx references
    - `src/app/terms/page.tsx` — replace all GPAT and ThinqRx references
    - `src/app/refund/page.tsx` — replace all GPAT and ThinqRx references
    - `src/app/sitemap.ts` — update `/gpat` route

**PART F: Admin Pages**

20. Update ALL admin pages:
    - `src/app/admin/page.tsx` — "GPAT content", "GPAT syllabus", "GPAT packs"
    - `src/app/admin/layout.tsx` — description
    - `src/app/admin/syllabus/page.tsx` — "No GPAT course found" error
    - `src/app/admin/mock-tests/page.tsx` — sample JSON exam_name
    - `src/app/admin/outlines/page.tsx` — default course code
    - `src/app/admin/pricing/page.tsx` — plan names
    - `src/app/admin/plans/page.tsx` — placeholder text
    - `src/app/admin/users/page.tsx` — plan display names and icons
    - `src/app/admin/site-content/page.tsx` — FAQ category `"gpat"` option → new exam code

**PART G: Components & Supporting Files**

21. Update these supporting files:
    - `src/lib/mock-test-validator.ts` — "e.g., GPAT, NIPER" example text
    - `src/lib/utils/textFormatter.ts` — "GPAT" in keyword array
    - `src/lib/ai-cache.ts` — example comment
    - `src/types/mock-test.ts` — any GPAT type references
    - `src/components/HighlightBlock.tsx` — if it references "gpat" style
    - `src/components/SectionRenderer.tsx` — if it references "gpat" style
    - `src/components/FormulaBlock.tsx` — if it references gpatTip
    - `src/components/TableBlock.tsx` — if it references gpatNote
    - `src/components/ImageBlock.tsx` — if it references GPAT
    - `src/components/DiagramBlock.tsx` — if it references GPAT
    - `src/components/NotesLayout.tsx` — any GPAT text
    - `src/components/InteractiveTestUI.tsx` — any GPAT text
    - `src/components/PremiumGuard.tsx` — plan name references
    - `src/components/SoftPaywall.tsx` — any GPAT text
    - `src/components/Navigation.tsx` — any GPAT text
    - `src/components/PricingCTA.tsx` — any GPAT text
    - `src/contexts/SubscriptionContext.tsx` — plan name references
    - `src/contexts/CourseContext.tsx` — any GPAT references
    - `src/lib/razorpay/useRazorpay.ts` — payment description string

**PART H: SQL Migrations**

22. Update exam-specific content in these SQL files (so they're ready to paste into Supabase):
    - `supabase/migrations/20260120000000_multi_course.sql` — course name and code
    - `supabase/migrations/20260128000000_update_pricing.sql` — plan names
    - `supabase/migrations/20260211000001_add_exam_focused_plans.sql` — exam plan names
    - `supabase/migrations/20260213000001_simplify_update_subscription_rpc.sql` — exam code in RPC
    - `supabase/migrations/20260217100000_create_site_content.sql` — ALL seed content text

**PART I: Verification**

23. After ALL changes, run `npx tsc --noEmit` to verify no TypeScript errors.
24. Fix any broken imports (especially `@/lib/gpat/` → `@/lib/exam/` rename).
25. Search the entire `src/` folder for any remaining "GPAT" or "gpat" strings (case-insensitive). Replace any that were missed.
26. Search for any remaining "ThinqRx" or "thinqrx" or "Thinqr" strings and replace with the new brand/company name.
27. Do NOT modify `.md` documentation files in the project root — those are non-functional.

Do NOT skip any file. Do NOT leave any "GPAT" string in the `src/` directory. Commit when done with message: "Replace GPAT/ThinqRx with [Exam Name]/[Brand Name]".

---

## PROMPT ENDS HERE ↑
