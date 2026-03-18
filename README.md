# NEET UG Prep Platform 🎓

AI-powered preparation platform for NEET UG (National Eligibility cum Entrance Test) for medical aspirants in India.

## 🚀 Features

- **AI-Generated Notes**: Get comprehensive, exam-focused study notes for Physics, Chemistry, and Biology
- **Premium Rendering**:
  - **Physics**: KaTeX for beautiful LaTeX equations
  - **Chemistry**: Kekule.js for SVG chemical structures
  - **Biology**: Original SVG diagrams (NCERT-style)
- **Mock Tests**: Full-length and subject-wise practice tests with NEET pattern
- **Analytics Dashboard**: Track performance, identify weak areas, improve scores
- **Admin Panel**: Manage syllabus, create mock tests, view payments

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Razorpay
- **Rendering**:
  - KaTeX v0.16.28 (Physics equations)
  - Kekule v1.0.3 (Chemistry structures)
  - Custom SVG (Biology diagrams)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)

## 📋 Prerequisites

- Node.js 20+ and npm
- Supabase account ([create one here](https://supabase.com))
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Razorpay account ([sign up here](https://razorpay.com))

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd D:\pharmcards-neet
npm install
```

### 2. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name it: `pharmcards-neet`
4. Choose a strong database password
5. Select region (closest to your users)
6. Wait for project to be created (~2 minutes)

### 3. Get Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** → **API**
2. Copy the following:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

### 4. Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Run each migration file in order from `supabase/migrations/`:
   - Start with `20260104120000_init_core.sql`
   - Continue in timestamp order
   - Run all 42 migration files

**OR** use Supabase CLI:

```bash
npm install -g supabase
supabase link --project-ref your-project-ref
supabase db push
```

### 5. Configure Environment Variables

Open `.env.local` and fill in your credentials:

```env
# Supabase (from step 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 6. Run Development Server

```bash
npm run dev
```

App will be available at: **http://localhost:3001**

## 📚 Initial Setup

### Create Admin Account

1. Sign up at http://localhost:3001/signup
2. Verify your email
3. Go to Supabase dashboard → **Table Editor** → `profiles`
4. Find your user record
5. Change `role` from `student` to `admin`
6. Refresh the app

### Add NEET Syllabus

1. Go to http://localhost:3001/admin/syllabus
2. Add subjects:
   - Physics
   - Chemistry
   - Biology - Botany
   - Biology - Zoology
3. Add topics under each subject (e.g., Mechanics, Thermodynamics, etc.)

### Configure Pricing Plans

1. Go to http://localhost:3001/admin/pricing
2. Configure plans:
   - **Free**: Preview access
   - **Plus**: ₹199/month - Basic features
   - **Pro**: ₹299/month - Full features

## 💰 Razorpay Setup

### Create Plans in Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Subscriptions** → **Plans**
3. Create plans:
   - `neet-plus-monthly`: ₹199/month
   - `neet-plus-annual`: ₹1,990/year (20% off)
   - `neet-pro-monthly`: ₹299/month
   - `neet-pro-annual`: ₹2,990/year (20% off)

### Configure Webhook

1. Go to **Settings** → **Webhooks**
2. Create new webhook:
   - **URL**: `https://your-domain.com/api/webhooks/razorpay`
   - **Events**: `subscription.charged`, `subscription.cancelled`, `payment.failed`
   - **Secret**: Generate and add to `.env.local`

## 🏗️ Project Structure

```
D:\pharmcards-neet/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── admin/              # Admin panel
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Student dashboard
│   │   ├── subjects/           # Subject listing
│   │   ├── topics/             # Topic pages
│   │   ├── mock-tests/         # Mock test interface
│   │   ├── analytics/          # Performance analytics
│   │   └── pricing/            # Pricing page
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── NotesLayout.tsx     # Study notes interface
│   │   ├── CBTTestInterface.tsx # Mock test UI
│   │   ├── SectionRenderer.tsx # Content rendering
│   │   ├── EquationRenderer.tsx # KaTeX equations
│   │   └── ChemicalBlock.tsx   # Chemical structures
│   ├── lib/                    # Utilities & libraries
│   │   ├── supabase/           # Supabase clients
│   │   ├── ai/                 # AI generation logic
│   │   ├── razorpay/           # Payment integration
│   │   └── utils/              # Helper functions
│   ├── types/                  # TypeScript types
│   └── styles/                 # CSS files
├── supabase/migrations/        # Database migrations
├── public/                     # Static assets
│   └── biology-diagrams/       # SVG diagrams (to be added)
├── private/                    # Backend-only files
│   └── reference-materials/    # .pmd files (optional)
└── package.json
```

## 🎨 Subject-Specific Rendering

### Physics (KaTeX)

```typescript
import { EquationRenderer } from "@/components/EquationRenderer";

<EquationRenderer 
  equation="s = ut + \frac{1}{2}at^2" 
  block 
  title="Second Equation of Motion"
/>
```

### Chemistry (Kekule.js)

```typescript
import { ChemicalStructureSVG } from "@/components/ChemicalStructureSVG";

<ChemicalStructureSVG 
  smiles="CCO" 
  name="Ethanol" 
/>
```

### Biology (SVG Diagrams)

```typescript
import { BiologyDiagram } from "@/components/BiologyDiagram";

<BiologyDiagram 
  diagramId="heart-structure" 
  caption="Human Heart - Four Chambers"
/>
```

## 🔐 Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Service role key never exposed to frontend
- ✅ Admin routes protected with middleware
- ✅ Rate limiting on AI generation endpoints
- ✅ Payment webhooks verified with signature
- ✅ Environment variables in `.gitignore`

## 📱 Mobile Support

The app is fully responsive and works on:
- 📱 Mobile phones (iOS & Android)
- 💻 Tablets
- 🖥️ Desktop browsers

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Update Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Update Razorpay Webhook

Change webhook URL to: `https://your-domain.com/api/webhooks/razorpay`

## 📊 Monitoring

Monitor the following:
- API error rates (Vercel Analytics)
- AI generation success rate
- Payment webhook failures
- Database performance (Supabase dashboard)
- User engagement metrics

## 🐛 Troubleshooting

### App won't start

- Check if port 3001 is available
- Verify `.env.local` has all required variables
- Run `npm install` again

### Database connection fails

- Verify Supabase credentials in `.env.local`
- Check if migrations are all applied
- Ensure RLS policies are enabled

### AI generation fails

- Verify OpenAI API key is valid
- Check API usage limits
- Review error logs in browser console

### Payment not working

- Verify Razorpay test/live mode matches keys
- Check webhook secret is correct
- Test with Razorpay test cards

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions:
- Email: support@example.com
- Documentation: (link to docs)

---

**Built with ❤️ for NEET aspirants**
