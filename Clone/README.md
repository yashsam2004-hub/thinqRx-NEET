# Exam Platform — Clone & Setup Kit

This folder contains everything you need to clone the ThinqRx codebase and launch a new exam preparation website for any competitive exam.

---

## Files Included

| File | Purpose |
|------|---------|
| `README.md` | This file — overview and step-by-step instructions |
| `CURSOR_PROMPT.md` | Reusable Cursor Agent prompt — replace `[bracketed values]` with your exam details and run |
| `NEW_PROJECT_SETUP.md` | Detailed setup guide: Supabase, env vars, SQL migrations, deployment |
| `env.example` | Template for `.env.local` with all required variables |

---

## Quick Start (5 Steps)

### Step 1: Copy the Project

Copy your local `D:\pharmcards` folder to a new location:

```
xcopy D:\pharmcards D:\your-new-project /E /I /H
```

Then clean git history:

```
cd D:\your-new-project
rmdir /s /q .git
git init
```

### Step 2: Set Up External Services

Create accounts and get credentials for:

- **Supabase** (new project) → DB URL, anon key, service role key
- **OpenAI** → API key (can reuse existing)
- **Upstash Redis** → REST URL and token (can reuse or create new)
- **Razorpay** → Key ID, secret, webhook secret (create new for different business)
- **Vercel** → For deployment

### Step 3: Configure Environment

Copy `env.example` from this folder into your new project root as `.env.local` and fill in all values from Step 2.

**IMPORTANT:** Make sure `.env.local` points to your NEW Supabase project, not the old ThinqRx one.

### Step 4: Run the Cursor Prompt

1. Open the new project folder in Cursor
2. Open `CURSOR_PROMPT.md` from this folder
3. Replace ALL `[bracketed values]` with your exam details
4. Copy the prompt section and paste into Cursor chat in **Agent mode**
5. Let it run — it edits ~60+ files to replace GPAT with your exam

### Step 5: Database + Test + Deploy

1. Run SQL migrations in order in Supabase SQL Editor (see `NEW_PROJECT_SETUP.md` for the full list)
2. Run `npm run dev` locally
3. Sign up, then make yourself admin:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
4. Test: admin panel, site content, syllabus import, pricing, signup flow
5. Push to GitHub and deploy to Vercel:
   ```bash
   git add -A
   git commit -m "Initial setup for [exam name]"
   git remote add origin <your-new-repo-url>
   git push -u origin main
   ```

---

## Notes

- The app is designed to be exam-agnostic. Most content is driven from the database (courses, site_content, plans tables) and editable via the admin panel.
- After initial setup, you can change landing page content, FAQ, pricing, and syllabus entirely from the admin panel without touching code.
- The AI prompts in `src/lib/ai/` are the most exam-specific part — review them after the Cursor prompt runs to ensure the persona and content generation match your exam's style.
