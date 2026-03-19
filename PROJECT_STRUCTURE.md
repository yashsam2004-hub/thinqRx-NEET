# 🏗️ SynoRx - Project Structure & Architecture

**Comprehensive technical guide to the SynoRx platform codebase**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Application Architecture](#application-architecture)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Authentication System](#authentication-system)
8. [AI Generation System](#ai-generation-system)
9. [Component Architecture](#component-architecture)
10. [Styling System](#styling-system)
11. [Configuration Files](#configuration-files)
12. [Deployment Architecture](#deployment-architecture)

---

## 🎯 Overview

SynoRx is a full-stack EdTech platform built with:
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Backend**: Next.js API Routes + Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 for content generation
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Supabase Auth with RLS
- **Payments**: Razorpay (integration ready)

### Tech Stack Decision Rationale

| Technology | Why We Chose It |
|------------|-----------------|
| **Next.js 15** | App Router for better performance, SEO, and streaming SSR |
| **Supabase** | Free tier PostgreSQL + built-in auth + real-time + RLS |
| **TypeScript** | Type safety prevents 80% of runtime errors |
| **Tailwind CSS** | Rapid UI development with consistent design system |
| **OpenAI GPT-4** | Best-in-class AI for generating educational content |
| **shadcn/ui** | Customizable components (no external dependency) |

---

## 📁 Directory Structure

```
pharmcards/
│
├── src/                              # Source code
│   ├── app/                          # Next.js App Router (routing + pages)
│   │   ├── (auth)/                   # Auth route group (shared layout)
│   │   │   ├── login/                # Login page
│   │   │   │   └── page.tsx
│   │   │   ├── signup/               # Sign up page
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Auth layout (centered form UI)
│   │   │
│   │   ├── admin/                    # Admin panel (protected routes)
│   │   │   ├── page.tsx              # Admin dashboard (stats overview)
│   │   │   ├── layout.tsx            # Admin layout (sidebar navigation)
│   │   │   │
│   │   │   ├── syllabus/             # Subject & topic management
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── outlines/             # Note outline management
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── mock-tests/           # Mock test CRUD
│   │   │   │   ├── page.tsx          # List all tests
│   │   │   │   ├── [testId]/         # Dynamic route for edit
│   │   │   │   │   └── page.tsx
│   │   │   │   └── create/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── pricing/              # Dynamic pricing configuration
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── resources/            # Reference books, video links
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── users/                # User management (block/unblock)
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── admins/               # Admin role management
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── payments/             # Payment history & revenue tracking
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                      # API Routes (Backend)
│   │   │   │
│   │   │   ├── auth/                 # Authentication APIs
│   │   │   │   ├── session/
│   │   │   │   │   └── route.ts      # Get current user session
│   │   │   │   ├── signup/
│   │   │   │   │   └── route.ts      # User registration (+ profile creation)
│   │   │   │   └── logout/
│   │   │   │       └── route.ts      # Sign out
│   │   │   │
│   │   │   ├── ai/                   # AI-powered generation
│   │   │   │   ├── notes/
│   │   │   │   │   └── route.ts      # Generate study notes
│   │   │   │   └── mock-tests/
│   │   │   │       └── route.ts      # Generate mock test questions
│   │   │   │
│   │   │   ├── admin/                # Admin-only APIs
│   │   │   │   ├── subjects/
│   │   │   │   │   └── route.ts      # CRUD for subjects & topics
│   │   │   │   ├── outlines/
│   │   │   │   │   └── route.ts      # CRUD for note outlines
│   │   │   │   ├── mock-tests/
│   │   │   │   │   └── route.ts      # CRUD for mock tests
│   │   │   │   ├── pricing/
│   │   │   │   │   └── route.ts      # Update pricing plans
│   │   │   │   ├── resources/
│   │   │   │   │   └── route.ts      # CRUD for resources
│   │   │   │   ├── users/
│   │   │   │   │   └── route.ts      # List users, block/unblock
│   │   │   │   ├── admins/
│   │   │   │   │   └── route.ts      # Manage admin roles
│   │   │   │   ├── stats/
│   │   │   │   │   └── route.ts      # Dashboard statistics
│   │   │   │   └── payments/
│   │   │   │       └── route.ts      # Payment history
│   │   │   │
│   │   │   ├── mock-tests/           # Mock test APIs (student-facing)
│   │   │   │   ├── route.ts          # List all tests (active only)
│   │   │   │   ├── [testId]/
│   │   │   │   │   ├── route.ts      # Get test details
│   │   │   │   │   ├── submit/
│   │   │   │   │   │   └── route.ts  # Submit test answers
│   │   │   │   │   └── results/
│   │   │   │   │       └── route.ts  # Get test results
│   │   │   │   └── [testId]/start/
│   │   │   │       └── route.ts      # Start test attempt
│   │   │   │
│   │   │   ├── analytics/            # Performance analytics
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts      # Overall analytics
│   │   │   │   └── subject/
│   │   │   │       └── route.ts      # Subject-wise analytics
│   │   │   │
│   │   │   ├── pricing/              # Public pricing API
│   │   │   │   └── route.ts          # Get all pricing plans
│   │   │   │
│   │   │   ├── resources/            # Public resources API
│   │   │   │   └── route.ts          # Get active resources
│   │   │   │
│   │   │   ├── payment/              # Razorpay integration (ready)
│   │   │   │   ├── create-order/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── verify/
│   │   │   │   │   └── route.ts
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   └── health/
│   │   │       └── route.ts          # Health check endpoint
│   │   │
│   │   ├── dashboard/                # Student dashboard
│   │   │   └── page.tsx              # Subject cards + recent tests
│   │   │
│   │   ├── subjects/                 # Study notes
│   │   │   ├── page.tsx              # Subject list
│   │   │   └── [subjectId]/          # Dynamic subject route
│   │   │       ├── page.tsx          # Topics list
│   │   │       └── [topicId]/        # Dynamic topic route
│   │   │           └── page.tsx      # AI-generated notes
│   │   │
│   │   ├── mock-tests/               # Mock test interface
│   │   │   ├── page.tsx              # Available tests list
│   │   │   ├── [testId]/             # Dynamic test route
│   │   │   │   ├── page.tsx          # Test interface (CBT)
│   │   │   │   └── results/
│   │   │   │       └── page.tsx      # Results + response sheet
│   │   │   └── my-tests/
│   │   │       └── page.tsx          # Test history
│   │   │
│   │   ├── analytics/                # Student analytics
│   │   │   └── page.tsx              # Performance dashboard
│   │   │
│   │   ├── pricing/                  # Public pricing page
│   │   │   └── page.tsx
│   │   │
│   │   ├── resources/                # Student resources page
│   │   │   └── page.tsx
│   │   │
│   │   ├── upgrade/                  # Payment/upgrade page
│   │   │   └── page.tsx              # Razorpay payment flow
│   │   │
│   │   ├── about/                    # About us page
│   │   │   └── page.tsx
│   │   │
│   │   ├── page.tsx                  # Landing page (home)
│   │   ├── layout.tsx                # Root layout (providers, nav)
│   │   └── globals.css               # Global CSS + theme system
│   │
│   ├── components/                   # React Components
│   │   │
│   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── button.tsx            # Button variants (cva)
│   │   │   ├── card.tsx              # Card, CardHeader, CardContent
│   │   │   ├── input.tsx             # Input field
│   │   │   ├── select.tsx            # Dropdown select
│   │   │   ├── dialog.tsx            # Modal dialog
│   │   │   ├── badge.tsx             # Status badges
│   │   │   ├── progress.tsx          # Progress bar
│   │   │   ├── alert.tsx             # Alert messages
│   │   │   ├── tabs.tsx              # Tab navigation
│   │   │   └── ...                   # Other UI primitives
│   │   │
│   │   ├── Navigation.tsx            # Main nav bar (logo, links, theme toggle)
│   │   ├── ThemeToggle.tsx           # Dark mode toggle button
│   │   ├── Footer.tsx                # Footer component
│   │   ├── LoadingSpinner.tsx        # Loading states
│   │   │
│   │   ├── NotesLayout.tsx           # Study notes interface (topics sidebar)
│   │   ├── NoteContent.tsx           # Renders AI-generated note content
│   │   ├── EquationRenderer.tsx      # KaTeX equation rendering
│   │   │
│   │   ├── CBTTestInterface.tsx      # Mock test interface (timer, navigation)
│   │   ├── QuestionCard.tsx          # Single MCQ display
│   │   ├── TestNavigation.tsx        # Question palette (1-125 buttons)
│   │   ├── TestTimer.tsx             # Countdown timer with auto-submit
│   │   │
│   │   ├── AnalyticsDashboard.tsx    # Performance charts & insights
│   │   ├── SubjectAnalytics.tsx      # Subject-wise breakdown
│   │   ├── TestHistoryCard.tsx       # Past test display
│   │   │
│   │   ├── PricingCard.tsx           # Pricing plan card
│   │   ├── FeatureList.tsx           # Plan features list
│   │   ├── UpgradeModal.tsx          # Upgrade prompt for free users
│   │   │
│   │   ├── AdminSidebar.tsx          # Admin panel sidebar
│   │   ├── AdminStats.tsx            # Admin dashboard stats
│   │   │
│   │   └── HomePage/                 # Landing page sections
│   │       ├── HeroSection.tsx
│   │       ├── FeaturesSection.tsx
│   │       ├── TestimonialsSection.tsx
│   │       ├── FAQSection.tsx
│   │       └── CTASection.tsx
│   │
│   ├── contexts/                     # React Context Providers
│   │   └── AuthContext.tsx           # User authentication state
│   │
│   ├── lib/                          # Libraries & Utilities
│   │   │
│   │   ├── supabase/                 # Supabase clients
│   │   │   ├── client.ts             # Browser client (anon key)
│   │   │   ├── server.ts             # Server client (cookies)
│   │   │   └── admin.ts              # Admin client (service role key)
│   │   │
│   │   ├── ai/                       # AI generation logic
│   │   │   ├── prompts.ts            # Dynamic AI prompts
│   │   │   ├── masterPrompts.ts      # Master system instructions
│   │   │   ├── schemas.ts            # Zod schemas for AI output
│   │   │   └── equationUtils.ts      # LaTeX equation helpers
│   │   │
│   │   ├── utils/                    # Helper utilities
│   │   │   ├── logger.ts             # Custom logger
│   │   │   ├── api-error.ts          # Error handling
│   │   │   ├── date.ts               # Date formatting
│   │   │   └── cn.ts                 # Tailwind class merger
│   │   │
│   │   └── seo/                      # SEO utilities
│   │       └── metadata.ts           # Dynamic metadata generation
│   │
│   ├── styles/                       # CSS Files
│   │   ├── globals.css               # Global styles + CSS variables
│   │   └── katex-custom.css          # KaTeX equation customization
│   │
│   ├── config/                       # Configuration files
│   │   ├── platform.ts               # Platform constants
│   │   ├── faq.ts                    # FAQ data
│   │   └── navigation.ts             # Navigation menu config
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── database.types.ts         # Supabase generated types
│   │   ├── supabase.ts               # Supabase helper types
│   │   ├── api.ts                    # API request/response types
│   │   └── index.ts                  # Shared types
│   │
│   └── middleware.ts                 # Next.js middleware (auth, HTTPS)
│
├── supabase/
│   └── migrations/                   # Database migrations (run in order)
│       ├── 20260101000000_initial_schema.sql
│       ├── 20260102000000_add_profiles_table.sql
│       ├── 20260110000000_add_pricing_plans.sql
│       ├── 20260115000000_add_mock_tests.sql
│       ├── 20260120000000_add_analytics.sql
│       ├── 20260202000000_add_missing_outlines_columns.sql
│       ├── 20260202000001_add_user_blocking.sql
│       └── 20260202000002_create_resources_table.sql
│
├── scripts/                          # SQL scripts & utilities
│   ├── SIMPLE-RESOURCES-SETUP.sql    # Resources table quick setup
│   ├── CLEAN-RESOURCES-SETUP.sql     # Idempotent resources setup
│   ├── check-and-fix-admin-access.sql # Grant admin role
│   ├── fix-outlines-rls-final.sql    # Fix RLS policies
│   └── ...                           # Other maintenance scripts
│
├── public/                           # Static assets
│   ├── images/
│   │   ├── SynoRx-Logo.png           # Main logo
│   │   └── ...
│   └── favicon.ico
│
├── docs/                             # Documentation (organized)
│   ├── DEPLOYMENT_GUIDE.md
│   ├── TESTING_CHECKLIST.md
│   ├── SECURITY_AUDIT.md
│   └── PERFORMANCE_OPTIMIZATION.md
│
├── .env.local                        # Environment variables (not in git)
├── .env.example.txt                  # Environment template
├── .gitignore                        # Git ignore rules
│
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── postcss.config.mjs                # PostCSS configuration
├── components.json                   # shadcn/ui configuration
│
├── package.json                      # Dependencies & scripts
├── package-lock.json                 # Lock file
│
├── README.md                         # Master documentation
└── PROJECT_STRUCTURE.md              # This file
```

---

## 🏛️ Application Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React Components (src/components/)               │  │
│  │  - Client Components ("use client")               │  │
│  │  - Server Components (async, SSR)                 │  │
│  │  - shadcn/ui primitives                           │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js Pages (src/app/)                         │  │
│  │  - File-based routing                             │  │
│  │  - Layouts & route groups                         │  │
│  │  - Dynamic routes                                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP Requests
┌─────────────────────────────────────────────────────────┐
│                      API LAYER                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js API Routes (src/app/api/)                │  │
│  │  - RESTful endpoints                              │  │
│  │  - Authentication middleware                      │  │
│  │  - Input validation (Zod)                         │  │
│  │  - Error handling                                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ Business Logic
┌─────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AI Generation (src/lib/ai/)                      │  │
│  │  - OpenAI integration                             │  │
│  │  - Prompt engineering                             │  │
│  │  - Content formatting                             │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Authentication (src/contexts/, middleware.ts)    │  │
│  │  - Supabase Auth                                  │  │
│  │  - Session management                             │  │
│  │  - Role-based access control                      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ Data Operations
┌─────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Supabase Clients (src/lib/supabase/)             │  │
│  │  - Browser client (anon key)                      │  │
│  │  - Server client (cookies, SSR)                   │  │
│  │  - Admin client (service role key)                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ PostgreSQL Queries
┌─────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Supabase PostgreSQL                              │  │
│  │  - Row Level Security (RLS)                       │  │
│  │  - Stored procedures & functions                  │  │
│  │  - Triggers & constraints                         │  │
│  │  - Indexes for performance                        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ External APIs
┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES LAYER                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   OpenAI     │  │   Razorpay   │  │    Vercel    │  │
│  │  (GPT-4)     │  │  (Payments)  │  │   (Hosting)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Flow 1: Student Views AI-Generated Study Notes

```
1. User clicks on a topic
   └─> Browser → /subjects/[subjectId]/[topicId] (page.tsx)

2. Server Component fetches topic metadata
   └─> Server → Supabase → SELECT * FROM topics WHERE id = ?

3. Client Component requests AI generation
   └─> Browser → POST /api/ai/notes
       {
         "topicId": "uuid",
         "subjectId": "uuid",
         "outline": {...}
       }

4. API validates request & checks auth
   └─> API Route → Supabase Auth → getUser()
       └─> Check user subscription plan

5. API generates notes with OpenAI
   └─> API Route → OpenAI API
       {
         "model": "gpt-4o-mini",
         "messages": [
           { "role": "system", "content": masterPrompt },
           { "role": "user", "content": topicPrompt }
         ]
       }

6. OpenAI returns structured JSON
   └─> OpenAI → API Route
       {
         "title": "...",
         "sections": [
           {
             "heading": "Introduction",
             "content": "...",
             "equations": ["\\frac{1}{2}"]
           }
         ]
       }

7. API saves to database (optional caching)
   └─> API Route → Supabase → INSERT INTO generated_notes

8. API returns to client
   └─> API Route → Browser (JSON response)

9. Client renders with KaTeX
   └─> Browser → NotesLayout.tsx → EquationRenderer.tsx
       └─> Renders LaTeX equations as beautiful math
```

### Flow 2: Student Takes Mock Test

```
1. User starts a test
   └─> Browser → /mock-tests/[testId] (page.tsx)

2. Client fetches test details
   └─> Browser → GET /api/mock-tests/[testId]
       └─> API → Supabase → SELECT * FROM mock_tests WHERE id = ?

3. API checks access rights
   └─> API Route → Check if test is active
       └─> Check user plan (Free = 0 tests, Plus/Pro = unlimited)

4. API creates test attempt
   └─> API → Supabase → INSERT INTO test_attempts
       {
         "user_id": "uuid",
         "test_id": "uuid",
         "started_at": "timestamp"
       }

5. Client renders CBT interface
   └─> Browser → CBTTestInterface.tsx
       ├─> TestTimer.tsx (3 hours countdown)
       ├─> QuestionCard.tsx (displays MCQ)
       └─> TestNavigation.tsx (question palette)

6. User answers questions
   └─> State updates in React (useState)

7. Timer reaches 0:00 OR user clicks Submit
   └─> CBTTestInterface → Auto-submit triggered

8. Client sends answers to API
   └─> Browser → POST /api/mock-tests/[testId]/submit
       {
         "attemptId": "uuid",
         "answers": {
           "1": "B",
           "2": "C",
           ...
         }
       }

9. API calculates score
   └─> API Route → Calculate correct/incorrect
       └─> Apply marking scheme (+4/-1)
       └─> Calculate subject-wise scores

10. API updates database
    └─> API → Supabase → UPDATE test_attempts
        SET completed_at = NOW(), score = ?, ...

11. API returns results
    └─> API → Browser (JSON with score, breakdown)

12. Client shows results page
    └─> Browser → /mock-tests/[testId]/results
        └─> Response sheet with correct/incorrect marking
```

### Flow 3: Admin Uploads Content

```
1. Admin uploads subjects JSON
   └─> Browser → /admin/syllabus (page.tsx)

2. Client validates JSON structure
   └─> Browser → Zod schema validation

3. Client sends to API
   └─> Browser → POST /api/admin/subjects
       {
         "subjects": [
           {
             "name": "Pharmaceutics",
             "topics": [...]
           }
         ]
       }

4. API verifies admin role
   └─> API Route → Supabase
       └─> SELECT role FROM profiles WHERE id = user_id
       └─> IF role != 'admin' THEN RETURN 403

5. API inserts data using service role
   └─> API → Supabase Admin Client (service role key)
       └─> Bypass RLS for admin operations
       └─> INSERT INTO subjects, topics, subtopics

6. Database enforces constraints
   └─> PostgreSQL → Check foreign keys, unique constraints
       └─> Triggers update `updated_at` timestamps

7. API returns success
   └─> API → Browser (JSON with created IDs)

8. Client refreshes data
   └─> Browser → Re-fetch subjects list
       └─> Display success toast notification
```

---

## 🗄️ Database Schema

### Core Tables

#### `auth.users` (Supabase managed)
```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `public.profiles` (User profiles + roles)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  subscription_plan TEXT DEFAULT 'Free' CHECK (subscription_plan IN ('Free', 'Plus', 'Pro')),
  subscription_end_date TIMESTAMP,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies:
-- - Users can read their own profile
-- - Admins can read/update all profiles
```

#### `public.subjects` (GPAT subjects)
```sql
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT DEFAULT 'BookOpen',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subjects_active ON subjects(is_active, display_order);
```

#### `public.topics` (Subject topics)
```sql
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(subject_id, name)
);

CREATE INDEX idx_topics_subject ON topics(subject_id, display_order);
CREATE INDEX idx_topics_premium ON topics(is_premium);
```

#### `public.subtopics` (Topic subdivisions)
```sql
CREATE TABLE public.subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subtopics_topic ON subtopics(topic_id, display_order);
```

#### `public.syllabus_outlines` (AI note structure templates)
```sql
CREATE TABLE public.syllabus_outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sections JSONB NOT NULL, -- Array of section objects
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- sections JSONB format:
-- [
--   {
--     "heading": "Introduction",
--     "subsections": ["Overview", "Importance"]
--   }
-- ]

CREATE INDEX idx_outlines_subject ON syllabus_outlines(subject_id);
CREATE INDEX idx_outlines_topic ON syllabus_outlines(topic_id);
```

#### `public.mock_tests` (Mock test metadata)
```sql
CREATE TABLE public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  total_questions INTEGER NOT NULL DEFAULT 125,
  marking_scheme JSONB NOT NULL DEFAULT '{"correct": 4, "incorrect": -1, "unanswered": 0}',
  questions JSONB NOT NULL, -- Array of question objects
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- questions JSONB format:
-- [
--   {
--     "id": 1,
--     "subject": "Pharmaceutics",
--     "question": "What is...",
--     "options": ["A", "B", "C", "D"],
--     "correctAnswer": "B"
--   }
-- ]

CREATE INDEX idx_mock_tests_active ON mock_tests(is_active, created_at);
```

#### `public.test_attempts` (Student test submissions)
```sql
CREATE TABLE public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  answers JSONB, -- { "1": "B", "2": "C", ... }
  score NUMERIC,
  subject_wise_scores JSONB, -- { "Pharmaceutics": 24, ... }
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  time_taken_seconds INTEGER
);

CREATE INDEX idx_attempts_user ON test_attempts(user_id, completed_at);
CREATE INDEX idx_attempts_test ON test_attempts(test_id);
```

#### `public.pricing_plans` (Dynamic pricing)
```sql
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  monthly_price NUMERIC NOT NULL,
  annual_price NUMERIC,
  validity_days INTEGER DEFAULT 365,
  features JSONB NOT NULL, -- Array of feature strings
  limitations JSONB, -- { "mock_tests": 0, "ai_notes": 5 }
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `public.resources` (Reference materials)
```sql
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'Reference Books',
    'Video Lectures',
    'Official Links'
  )),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT, -- Book cover / thumbnail
  icon_name TEXT DEFAULT 'ExternalLink',
  is_external BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resources_category ON resources(category, display_order);
CREATE INDEX idx_resources_active ON resources(is_active);
```

#### `public.payments` (Payment history)
```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_payments_user ON payments(user_id, created_at);
CREATE INDEX idx_payments_status ON payments(status, created_at);
```

### Database Functions

#### `is_user_admin()` - Check admin role
```sql
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;
```

### Row Level Security (RLS) Policies

**Strategy**: All tables have RLS enabled. Students can only access their own data. Admins can access everything.

**Example RLS Policy** (for `mock_tests`):
```sql
-- Students can view active tests only
CREATE POLICY mock_tests_select_active
  ON mock_tests FOR SELECT
  USING (is_active = TRUE);

-- Admins can do everything
CREATE POLICY mock_tests_admin_all
  ON mock_tests FOR ALL
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());
```

---

## 🌐 API Routes

### Authentication APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/session` | GET | None | Get current user session |
| `/api/auth/signup` | POST | None | Register new user + create profile |
| `/api/auth/logout` | POST | Required | Sign out user |

### AI Generation APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai/notes` | POST | Required | Generate study notes for a topic |
| `/api/ai/mock-tests` | POST | Admin | Generate 125 MCQs (future) |

### Admin APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/subjects` | GET, POST, PUT, DELETE | Admin | CRUD for subjects & topics |
| `/api/admin/outlines` | GET, POST, PUT, DELETE | Admin | CRUD for note outlines |
| `/api/admin/mock-tests` | GET, POST, PUT, DELETE | Admin | CRUD for mock tests |
| `/api/admin/pricing` | GET, PUT | Admin | View/update pricing plans |
| `/api/admin/resources` | GET, POST, PUT, DELETE | Admin | CRUD for resources |
| `/api/admin/users` | GET, PUT | Admin | List users, block/unblock |
| `/api/admin/admins` | GET, POST, DELETE | Admin | Manage admin roles |
| `/api/admin/stats` | GET | Admin | Dashboard statistics |
| `/api/admin/payments` | GET | Admin | Payment history & revenue |

### Student APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/mock-tests` | GET | Required | List all active mock tests |
| `/api/mock-tests/[testId]` | GET | Required | Get test details |
| `/api/mock-tests/[testId]/submit` | POST | Required | Submit test answers |
| `/api/mock-tests/[testId]/results` | GET | Required | Get test results |
| `/api/analytics/dashboard` | GET | Required | Overall performance analytics |
| `/api/analytics/subject` | GET | Required | Subject-wise analytics |

### Public APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/pricing` | GET | None | Get all pricing plans |
| `/api/resources` | GET | None | Get active resources (filtered by category) |
| `/api/health` | GET | None | Health check |

### Payment APIs (Razorpay integration ready)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/payment/create-order` | POST | Required | Create Razorpay order |
| `/api/payment/verify` | POST | Required | Verify payment signature |
| `/api/payment/webhook` | POST | Webhook | Handle Razorpay webhook events |

---

## 🔐 Authentication System

### Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                  User Authentication                 │
└─────────────────────────────────────────────────────┘

1. User visits protected page (e.g., /dashboard)
   └─> middleware.ts intercepts request
       └─> Check for Supabase session cookie

2. If no session → Redirect to /login
   └─> Browser → /login (page.tsx)

3. User submits email + password
   └─> Browser → POST /api/auth/login (or uses Supabase client directly)
       └─> Supabase Auth → Verify credentials
       └─> Set session cookie (httpOnly, secure)

4. On successful login
   └─> Supabase → Create JWT token
       └─> JWT contains: { sub: user_id, email, role }
       └─> Store in httpOnly cookie

5. User accesses protected page
   └─> middleware.ts → Extract JWT from cookie
       └─> Supabase → Verify JWT signature
       └─> Fetch user profile from profiles table

6. Check user role
   └─> IF role = 'admin' → Allow access to /admin/*
   └─> IF role = 'student' → Deny access to /admin/*

7. Check subscription plan (for premium content)
   └─> IF plan = 'Free' AND content is_premium
       └─> Show upgrade modal
   └─> ELSE → Allow access

8. User logs out
   └─> Browser → POST /api/auth/logout
       └─> Supabase Auth → Invalidate session
       └─> Clear cookie
```

### Implementation Details

**Middleware** (`src/middleware.ts`):
```typescript
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Check for Supabase session
  const supabase = createSupabaseServerClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  
  // Protected routes
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect('/login');
    
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.redirect('/dashboard');
    }
  }
  
  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production' && !req.headers.get('x-forwarded-proto')?.includes('https')) {
    return NextResponse.redirect(`https://${req.headers.get('host')}${pathname}`);
  }
  
  return NextResponse.next();
}
```

**AuthContext** (`src/contexts/AuthContext.tsx`):
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(data);
        } else {
          setProfile(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, profile }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 🤖 AI Generation System

### Architecture

```
┌─────────────────────────────────────────────────────┐
│            AI Content Generation Flow                │
└─────────────────────────────────────────────────────┘

1. User requests notes for "Pharmacokinetics - Absorption"
   └─> Browser → POST /api/ai/notes
       {
         "topicId": "uuid",
         "subjectId": "uuid",
         "outline": { sections: [...] }
       }

2. API route validates request
   └─> Check user authentication
   └─> Check subscription plan (Free = limited)
   └─> Fetch topic metadata from database

3. API constructs AI prompt
   └─> masterPrompts.ts → Base system instructions
       ├─> LaTeX equation rules
       ├─> Formatting guidelines
       └─> Output JSON schema
   
   └─> prompts.ts → Topic-specific prompt
       ├─> Topic name & description
       ├─> Subject context
       ├─> Custom outline structure
       └─> PCI syllabus alignment

4. API calls OpenAI
   └─> Send to GPT-4o-mini (cost-effective, fast)
       └─> Model parameters:
           - temperature: 0.7 (balanced creativity)
           - max_tokens: 4000 (comprehensive notes)
           - response_format: { type: "json_object" }

5. OpenAI generates content
   └─> Returns structured JSON
       {
         "title": "Absorption in Pharmacokinetics",
         "sections": [
           {
             "heading": "Introduction",
             "content": "...",
             "equations": ["$$C = C_0 e^{-kt}$$"],
             "tables": [...]
           }
         ]
       }

6. API validates AI output
   └─> Zod schema validation
       ├─> Check required fields exist
       ├─> Validate equation syntax
       └─> Ensure proper structure

7. API saves to database (optional caching)
   └─> INSERT INTO generated_notes
       └─> Cache for 30 days
       └─> Subsequent requests = instant load

8. API returns to client
   └─> JSON response with formatted content

9. Client renders with KaTeX
   └─> NotesLayout.tsx
       └─> Loop through sections
           └─> EquationRenderer.tsx
               └─> Parse LaTeX: $...$ or $$...$$
               └─> Render with katex.render()
```

### Prompt Engineering

**Master Prompt** (`src/lib/ai/masterPrompts.ts`):
```typescript
export const MASTER_SYSTEM_PROMPT = `
You are an expert pharmacy educator creating study notes for GPAT preparation.

CRITICAL RULES:
1. Use ONLY LaTeX format for equations: $inline$ or $$display$$
2. Use \\frac{a}{b} not a/b
3. Use \\sqrt{x} not sqrt(x)
4. Use proper chemical notations
5. Format output as valid JSON
6. Include subject-wise context
7. Align with PCI syllabus
8. Use tables for comparisons
9. Highlight key points
10. Add clinical relevance

OUTPUT SCHEMA:
{
  "title": "string",
  "sections": [
    {
      "heading": "string",
      "content": "string (with LaTeX)",
      "equations": ["LaTeX string"],
      "tables": [{...}]
    }
  ]
}
`;
```

**Dynamic Topic Prompt** (`src/lib/ai/prompts.ts`):
```typescript
export function generateNotesPrompt(topic: Topic, outline: Outline) {
  return `
Create comprehensive GPAT study notes for:

TOPIC: ${topic.name}
SUBJECT: ${topic.subject_name}
PCI SYLLABUS UNIT: ${topic.pci_unit}

OUTLINE STRUCTURE:
${outline.sections.map(s => `
  ${s.heading}
    ${s.subsections?.join('\n    - ') || ''}
`).join('\n')}

REQUIREMENTS:
- Follow the exact outline structure provided
- Include 5-10 equations per section (in LaTeX)
- Add comparison tables where relevant
- Provide clinical examples
- Keep language clear and exam-focused
- Length: 2000-3000 words

EXAMPLE EQUATIONS:
- Henderson-Hasselbalch: $$pH = pK_a + \\log\\frac{[A^-]}{[HA]}$$
- First-order kinetics: $$C = C_0 e^{-kt}$$

Begin generation:
  `;
}
```

### Equation Rendering

**EquationRenderer** (`src/components/EquationRenderer.tsx`):
```typescript
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function EquationRenderer({ content }: { content: string }) {
  // Parse inline equations: $...$
  content = content.replace(/\$([^\$]+)\$/g, (match, eq) => {
    try {
      return katex.renderToString(eq, { displayMode: false });
    } catch (e) {
      return match; // Fallback if invalid LaTeX
    }
  });
  
  // Parse display equations: $$...$$
  content = content.replace(/\$\$([^\$]+)\$\$/g, (match, eq) => {
    try {
      return katex.renderToString(eq, { displayMode: true });
    } catch (e) {
      return match;
    }
  });
  
  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
      className="prose dark:prose-invert"
    />
  );
}
```

---

## 🧩 Component Architecture

### Component Hierarchy

```
App Layout (src/app/layout.tsx)
└─> ThemeProvider (next-themes)
    └─> AuthProvider (AuthContext)
        ├─> Navigation
        │   ├─> Logo
        │   ├─> Nav Links (Home, Pricing, Resources, About)
        │   ├─> ThemeToggle
        │   └─> User Menu
        │
        └─> {children} (Page content)
            │
            ├─> Landing Page (/)
            │   ├─> HeroSection
            │   ├─> FeaturesSection
            │   ├─> TestimonialsSection
            │   ├─> FAQSection
            │   └─> CTASection
            │
            ├─> Student Dashboard (/dashboard)
            │   ├─> StatsCards (subjects studied, tests taken)
            │   ├─> SubjectGrid (subject cards)
            │   └─> RecentTests
            │
            ├─> Study Notes (/subjects/[id]/[topicId])
            │   └─> NotesLayout
            │       ├─> TopicsSidebar (navigation)
            │       └─> NoteContent
            │           ├─> EquationRenderer
            │           └─> TableDisplay
            │
            ├─> Mock Test (/mock-tests/[testId])
            │   └─> CBTTestInterface
            │       ├─> TestTimer (countdown)
            │       ├─> QuestionCard (MCQ display)
            │       ├─> TestNavigation (question palette)
            │       └─> SubmitButton
            │
            ├─> Analytics (/analytics)
            │   └─> AnalyticsDashboard
            │       ├─> OverallStats
            │       ├─> SubjectAnalytics (chart)
            │       └─> TestHistory
            │
            ├─> Pricing (/pricing)
            │   └─> PricingGrid
            │       ├─> PricingCard (Free)
            │       ├─> PricingCard (Plus)
            │       └─> PricingCard (Pro)
            │
            ├─> Resources (/resources)
            │   └─> ResourcesGrid
            │       ├─> CategorySection (Reference Books)
            │       ├─> CategorySection (Video Lectures)
            │       └─> CategorySection (Official Links)
            │
            └─> Admin Panel (/admin)
                └─> AdminLayout
                    ├─> AdminSidebar
                    └─> {children} (Admin pages)
                        ├─> Dashboard (stats)
                        ├─> Syllabus Manager
                        ├─> Outlines Manager
                        ├─> Mock Tests Manager
                        ├─> Pricing Editor
                        ├─> Resources Manager
                        ├─> Users Manager
                        └─> Payments Tracker
```

### Design Patterns

**1. Server Components (Default)**
- Used for data fetching
- Better performance (SSR)
- No JavaScript sent to client
- Example: Subject list page

**2. Client Components (`"use client"`)**
- Used for interactivity (useState, useEffect)
- Required for event handlers
- Example: Mock test interface, theme toggle

**3. Compound Components**
- Pattern: Parent component provides context, child components consume
- Example: `Card`, `CardHeader`, `CardContent` from shadcn/ui

**4. Render Props**
- Not heavily used, but present in some shadcn/ui components
- Example: `Dialog` component

**5. Custom Hooks**
- `useAuth()` - Access user and profile
- `useTheme()` - Access theme state (from next-themes)

---

## 🎨 Styling System

### Theme Architecture

**Global CSS** (`src/styles/globals.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 142 76% 36%;      /* Teal-600 */
    --primary-foreground: 0 0% 100%;
    --secondary: 37 100% 63%;    /* Amber-400 */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 142 76% 36%;
    --radius: 0.5rem;
  }

  .dark {
    /* Dark mode colors */
    --background: 222.2 84% 4.9%;  /* Deep navy */
    --foreground: 210 40% 98%;
    --card: 217.2 32.6% 17.5%;     /* Charcoal */
    --card-foreground: 210 40% 98%;
    --primary: 142 70% 50%;         /* Teal-400 */
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 37 100% 70%;       /* Amber-300 */
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 142 70% 50%;
  }
}
```

### Tailwind Configuration

**tailwind.config.ts**:
```typescript
export default {
  darkMode: ['class'],  // Enable class-based dark mode
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Use CSS variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        primary: 'hsl(var(--primary))',
        // ... other colors
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
};
```

### Dark Mode Implementation

**ThemeToggle** (`src/components/ThemeToggle.tsx`):
```typescript
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
```

**Usage in components**:
```typescript
// Example: Card with dark mode support
<div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
  <h2 className="text-slate-900 dark:text-slate-100">Title</h2>
  <p className="text-slate-600 dark:text-slate-400">Description</p>
</div>
```

---

## ⚙️ Configuration Files

### Next.js Configuration

**next.config.mjs**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'], // Allow Supabase images
  },
  reactStrictMode: true,
  experimental: {
    serverActions: true, // Enable server actions
  },
};

export default nextConfig;
```

### TypeScript Configuration

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]  // Path alias
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Environment Variables

**.env.local** (not in git):
```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (server-side only, never expose)

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Razorpay (optional)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx (server-side only)
RAZORPAY_WEBHOOK_SECRET=xxxxx (server-side only)
```

---

## 🚀 Deployment Architecture

### Production Setup (Vercel Recommended)

```
┌─────────────────────────────────────────────────────┐
│                   USER BROWSER                       │
└─────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────┐
│              VERCEL EDGE NETWORK (CDN)               │
│  - Global edge locations                             │
│  - Static file caching                               │
│  - DDoS protection                                   │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│           NEXT.JS APPLICATION (Vercel)               │
│  - Server-side rendering                             │
│  - API routes                                        │
│  - Image optimization                                │
└─────────────────────────────────────────────────────┘
                          ↓
┌──────────────────┐  ┌──────────────────┐  ┌────────┐
│    SUPABASE      │  │     OPENAI       │  │ RAZORPAY│
│  (PostgreSQL)    │  │   (GPT-4 API)    │  │(Payments)│
└──────────────────┘  └──────────────────┘  └────────┘
```

### Deployment Steps

**1. Connect Git Repository to Vercel**
```bash
vercel login
vercel --prod
```

**2. Set Environment Variables in Vercel Dashboard**
- Add all variables from `.env.local`
- Mark sensitive keys as "Encrypted"

**3. Configure Supabase Auth URLs**
- Go to Supabase Dashboard → Authentication → URL Configuration
- Add production domain to "Redirect URLs"

**4. Update CORS Settings (if needed)**
- Supabase → API Settings → CORS allowed origins
- Add production domain

**5. Database Migrations**
- All migrations in `supabase/migrations/` are already applied
- For new migrations, run in Supabase SQL Editor

**6. Razorpay Configuration**
- Update webhook URL to `https://yourdomain.com/api/payment/webhook`
- Add webhook signature secret to Vercel env vars

### Performance Optimizations

**1. Caching Strategy**
```typescript
// API Route caching example
export const revalidate = 3600; // Revalidate every 1 hour

export async function GET() {
  const data = await fetchDataFromSupabase();
  return NextResponse.json(data);
}
```

**2. Image Optimization**
```typescript
import Image from 'next/image';

<Image
  src="/images/SynoRx-Logo.png"
  alt="SynoRx"
  width={200}
  height={60}
  priority // Load immediately
/>
```

**3. Database Indexes**
- All frequently queried columns have indexes
- See migration files for CREATE INDEX statements

**4. React Optimizations**
```typescript
// Memoization
const MemoizedComponent = React.memo(ExpensiveComponent);

// useMemo for expensive calculations
const sortedData = useMemo(() => data.sort(), [data]);

// useCallback for event handlers
const handleClick = useCallback(() => {}, []);
```

---

## 📊 Monitoring & Analytics

### Health Checks

**API Health Endpoint** (`/api/health/route.ts`):
```typescript
export async function GET() {
  // Check database connection
  const dbStatus = await checkSupabaseConnection();
  
  // Check OpenAI API
  const aiStatus = await checkOpenAIConnection();
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus ? 'up' : 'down',
      ai: aiStatus ? 'up' : 'down',
    }
  });
}
```

### Error Tracking

**Custom Logger** (`src/lib/utils/logger.ts`):
```typescript
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta);
    // In production: Send to logging service (e.g., Sentry)
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // In production: Send to error tracking service
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta);
  },
};
```

---

## 🔧 Development Workflow

### Local Development

```bash
# 1. Clone repo
git clone <repo-url>
cd pharmcards

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example.txt .env.local
# Edit .env.local with your keys

# 4. Run migrations in Supabase SQL Editor

# 5. Start dev server
npm run dev

# 6. Open http://localhost:3000
```

### Testing Checklist

- [ ] Auth flow (signup, login, logout)
- [ ] Admin panel access control
- [ ] AI note generation
- [ ] Mock test (full 125 questions, timer, auto-submit)
- [ ] Analytics dashboard
- [ ] Pricing page
- [ ] Resources page
- [ ] Dark mode toggle
- [ ] Mobile responsive design
- [ ] Payment flow (test mode)

### Code Quality

```bash
# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Build check
npm run build
```

---

## 📚 Further Reading

### Essential Documentation
- **[README.md](README.md)** - Overview & quick start
- **[RAZORPAY_INTEGRATION_COMPLETE_GUIDE.md](RAZORPAY_INTEGRATION_COMPLETE_GUIDE.md)** - Payment integration
- **[PREMIUM_DARK_MODE_IMPLEMENTATION.md](PREMIUM_DARK_MODE_IMPLEMENTATION.md)** - Theme system
- **[HOW_TO_ADD_SUBJECTS_AND_OUTLINES.md](HOW_TO_ADD_SUBJECTS_AND_OUTLINES.md)** - Content upload guide
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security guidelines

### External Resources
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Last Updated**: February 2026

Built with ❤️ by Thinqr (OPC) Pvt. Ltd.
