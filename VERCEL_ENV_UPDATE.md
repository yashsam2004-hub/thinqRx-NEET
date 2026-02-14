# 🚨 URGENT: Update Vercel Environment Variable

## Issue Found
The `OPENAI_MODEL` environment variable is set to `gpt-5-mini`, which **doesn't exist** and is causing all AI notes generation to fail.

## Valid OpenAI Models
- `gpt-4o` (most capable, expensive)
- `gpt-4o-mini` (recommended - fast, cheap, good quality)
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

## Steps to Fix in Vercel

### Option 1: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your project (`pharmcards` or `thinqrx`)
3. Click **Settings** → **Environment Variables**
4. Find `OPENAI_MODEL`
5. Click **Edit**
6. Change value from `gpt-5-mini` to `gpt-4o-mini`
7. Click **Save**
8. **Redeploy** the app (Settings → Deployments → Latest → Redeploy)

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Update environment variable
vercel env rm OPENAI_MODEL production
vercel env add OPENAI_MODEL production
# When prompted, enter: gpt-4o-mini

# Redeploy
vercel --prod
```

## What Was Fixed Locally
✅ Updated `.env.local` from `gpt-5-mini` → `gpt-4o-mini`
✅ Added model validation in `src/lib/ai/openai.ts`
✅ Added automatic fallback to valid model

## Test After Update
1. Wait for Vercel deployment to complete (~2 minutes)
2. Go to any topic in your app
3. Click "Generate AI Notes"
4. Should work now!

## Cost Comparison (GPT-4o-mini vs GPT-4o)
- **gpt-4o-mini**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **gpt-4o**: $5.00 per 1M input tokens, $15.00 per 1M output tokens

**Recommendation**: Use `gpt-4o-mini` for production. It's 33x cheaper and perfect for Quick Revision Notes.
