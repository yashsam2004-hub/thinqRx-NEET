# New Exam Platform — Detailed Setup Guide

---

## Prerequisites

- Node.js 18+
- A new **Supabase** project (free tier works)
- **OpenAI** API key
- **Upstash Redis** account
- **Razorpay** account (test mode initially)
- **Vercel** account (for deployment)

---

## Step 1: Copy the Codebase

```bash
xcopy D:\pharmcards D:\your-new-project /E /I /H
cd D:\your-new-project
rmdir /s /q .git
git init
```

Or on Linux/Mac:

```bash
cp -r /path/to/pharmcards /path/to/new-project
cd /path/to/new-project
rm -rf .git
git init
```

---

## Step 2: Environment Variables

1. Copy `env.example` from this Clone folder into your new project root as `.env.local`
2. Fill in ALL values from your new Supabase project and other services
3. **CRITICAL:** Ensure the Supabase URL/keys point to your NEW project, not the old ThinqRx one

---

## Step 3: Run the Cursor Prompt

1. Open the new project in Cursor
2. Open `CURSOR_PROMPT.md` from this Clone folder
3. Replace all `[bracketed values]` with your exam details
4. Paste the prompt into Cursor chat in **Agent mode**
5. It will update ~60+ files replacing GPAT → your exam

---

## Step 4: Supabase Database Setup

Run these SQL migration files **in order** in your new Supabase project's SQL Editor.

> The Cursor prompt will have already updated exam names inside these SQL files.
> Copy-paste each file's contents into Supabase SQL Editor and run.

### Migration Order

| # | File | What It Creates |
|---|------|-----------------|
| 1 | `supabase/migrations/20260104120000_init_core.sql` | Core tables: profiles, subscriptions, entitlements, syllabus_subjects, syllabus_topics, ai_notes, ai_tests, mock_tests, mock_questions, user_attempts, analytics_events, cms_pages, cms_assets. RLS policies. `is_admin()` helper function. Triggers. |
| 2 | `supabase/migrations/20260104120500_profiles_trigger.sql` | Auto-create profile row when a user signs up via auth |
| 3 | `supabase/migrations/20260104131000_subscriptions_pending.sql` | Adds pending state to subscriptions |
| 4 | `supabase/migrations/20260106120000_token_based_plans.sql` | Token-based plan system |
| 5 | `supabase/migrations/20260106120500_update_profile_trigger.sql` | Updated profile trigger |
| 6 | `supabase/migrations/20260107010000_fix_profile_trigger.sql` | Profile trigger fix |
| 7 | `supabase/migrations/20260107010100_fix_trigger_columns.sql` | Trigger column alignment |
| 8 | `supabase/migrations/20260107020000_question_bank.sql` | Question bank tables |
| 9 | `supabase/migrations/20260108010000_bookmarks.sql` | User bookmarks table |
| 10 | `supabase/migrations/20260120000000_multi_course.sql` | **courses, course_enrollments, plans/pricing tables** ⚠️ Contains exam name |
| 11 | `supabase/migrations/20260120000001_migrate_existing_data.sql` | Data migration helpers |
| 12 | `supabase/migrations/20260120000002_course_aware_rls.sql` | Course-aware RLS policies |
| 13 | `supabase/migrations/20260120010000_add_name_to_profiles.sql` | Adds name field to profiles |
| 14 | `supabase/migrations/20260120010001_one_course_per_user.sql` | One course per user constraint |
| 15 | `supabase/migrations/20260120010002_fix_enrollment_rls.sql` | Enrollment RLS fix |
| 16 | `supabase/migrations/20260120020000_schema_cleanup.sql` | Schema cleanup |
| 17 | `supabase/migrations/20260121000000_topic_images.sql` | Topic image support |
| 18 | `supabase/migrations/20260127000000_fix_attempts_rls.sql` | Attempts RLS fix |
| 19 | `supabase/migrations/20260127120000_cleanup_schema.sql` | Additional schema cleanup |
| 20 | `supabase/migrations/20260128000000_update_pricing.sql` | Pricing tables update ⚠️ Contains plan names |
| 21 | `supabase/migrations/20260128120000_fix_analytics_rls.sql` | Analytics RLS fix |
| 22 | `supabase/migrations/20260128130000_recreate_outlines_table.sql` | Outlines table |
| 23 | `supabase/migrations/20260131000000_cbt_mock_test_system.sql` | CBT (computer-based test) mock test system |
| 24 | `supabase/migrations/20260131100000_fix_mock_tests_rls.sql` | Mock tests RLS fix |
| 25 | `supabase/migrations/20260131110000_fix_stack_depth_rls.sql` | Stack depth RLS fix |
| 26 | `supabase/migrations/20260202000000_fix_profiles_rls.sql` | Profiles RLS fix |
| 27 | `supabase/migrations/20260202000000_add_missing_outlines_columns.sql` | Outlines columns |
| 28 | `supabase/migrations/20260202000001_fix_outlines_rls_policy.sql` | Outlines RLS |
| 29 | `supabase/migrations/20260202000002_create_resources_table.sql` | Resources table |
| 30 | `supabase/migrations/20260202000003_add_subscription_fields.sql` | Subscription fields on profiles |
| 31 | `supabase/migrations/20260202100000_final_profiles_fix.sql` | Final profiles fix |
| 32 | `supabase/migrations/20260210000000_fix_payments_insert_policy.sql` | Payments insert policy |
| 33 | `supabase/migrations/20260210000001_fix_payments_column_names.sql` | Payments column names |
| 34 | `supabase/migrations/20260211000000_fix_critical_security_warnings.sql` | Security fixes |
| 35 | `supabase/migrations/20260211155924_add_update_subscription_function.sql` | `update_user_subscription` RPC |
| 36 | `supabase/migrations/20260211165103_fix_subscription_update_course_enrollments.sql` | Subscription update fix |
| 37 | `supabase/migrations/20260211170000_fix_billing_cycle_case.sql` | Billing cycle case fix |
| 38 | `supabase/migrations/20260211000000_create_ai_cache.sql` | AI response cache table |
| 39 | `supabase/migrations/20260211000001_add_exam_focused_plans.sql` | Exam-focused plans ⚠️ Contains plan names |
| 40 | `supabase/migrations/20260213000000_remove_plan_check_constraints.sql` | Remove plan constraints |
| 41 | `supabase/migrations/20260213000001_simplify_update_subscription_rpc.sql` | Simplified subscription RPC ⚠️ Contains exam code |
| 42 | `supabase/migrations/20260214000000_add_user_devices.sql` | User device tracking |
| 43 | `supabase/migrations/20260217000000_create_coupons_table.sql` | Coupons system |
| 44 | `supabase/migrations/20260217100000_create_site_content.sql` | CMS site content table + seed data ⚠️ Contains exam content |

> ⚠️ = Files containing exam-specific text. The Cursor prompt should have already updated these. Verify before running.

---

## Step 5: Create Admin Account

1. Start the local dev server: `npm run dev`
2. Sign up through the app at `http://localhost:3000`
3. Run in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

4. Log out and log back in — you'll see the Admin panel in the navigation

---

## Step 6: Admin Setup Checklist

After logging in as admin:

- [ ] **Site Content** (`/admin/site-content`) — Update landing page text, hero, FAQ, footer
- [ ] **Syllabus** (`/admin/syllabus`) — Import subjects & topics via JSON
- [ ] **Plans/Pricing** (`/admin/plans`) — Configure Free, Plus, Pro, and exam pack plans
- [ ] **Mock Tests** (`/admin/mock-tests`) — Upload mock test JSON files
- [ ] **Coupons** (`/admin/coupons`) — Create discount codes if needed
- [ ] **Outlines** (`/admin/outlines`) — Add topic outlines for AI note generation
- [ ] **Resources** (`/admin/resources`) — Add recommended books/links

---

## Step 7: Local Testing

Test these flows before deploying:

- [ ] Student signup → lands on dashboard
- [ ] Browse subjects → open a topic → AI generates notes
- [ ] Take a mock test → view results → view analytics
- [ ] Upgrade flow → coupon application → Razorpay payment (test mode)
- [ ] Admin panel → all sections load and save correctly
- [ ] Sign out → sign back in

---

## Step 8: Deploy

```bash
git add -A
git commit -m "Initial setup for [Exam Name] platform"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Vercel Setup

1. Go to vercel.com → New Project → Import your GitHub repo
2. Add ALL environment variables from `.env.local` to Vercel project settings
3. Set `NEXT_PUBLIC_APP_URL` to your production domain
4. Deploy

### Post-Deploy

- [ ] Configure custom domain in Vercel
- [ ] Set up Razorpay webhook: `https://yourdomain.com/api/webhooks/razorpay`
- [ ] Switch Razorpay to live keys when ready
- [ ] Update legal pages with correct company info
- [ ] Replace logo at `/public/images/` and favicon at `/public/favicon.ico`

---

## Customization Reference

### What's editable from Admin Panel (no code changes)

- Landing page content (all sections)
- FAQ questions and answers
- Syllabus subjects and topics
- Pricing plans and features
- Mock tests
- Coupons
- Resources

### What requires code changes

- AI prompt personas and content generation style (`src/lib/ai/`)
- Exam scheme: question count, marking, duration (`src/lib/exam/mock-generator.ts`)
- Legal pages: privacy, terms, refund (`src/app/privacy/`, `src/app/terms/`, `src/app/refund/`)
- SEO metadata (`src/app/layout.tsx`, `src/lib/seo/metadata.ts`)
- Brand colors/theme (Tailwind config + components)
