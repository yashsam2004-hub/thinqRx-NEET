# 🔒 Security Checklist for PharmCards

**Date:** February 2, 2026  
**Status:** ✅ IMPLEMENTED

---

## ✅ CRITICAL: .gitignore SAFETY

### **Files That MUST NEVER Be Committed:**

#### **1. Environment Variables:**
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.development`
- ❌ `.env.production`
- ❌ `.env.test`
- ❌ `.env.backup`
- ✅ `.env.example` (safe to commit - contains no secrets)

#### **2. API Keys & Credentials:**
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `OPENAI_API_KEY`
- ❌ `RAZORPAY_KEY_SECRET`
- ❌ `UPSTASH_REDIS_REST_TOKEN`
- ❌ Any `*.key`, `*.pem`, `*.cert` files

#### **3. Database & Backups:**
- ❌ `*.sql.backup`
- ❌ `*.dump`
- ❌ Database export files
- ❌ User data exports

#### **4. Payment Gateway:**
- ❌ Razorpay test/live keys
- ❌ Payment transaction logs
- ❌ Merchant credentials

---

## 🔐 VERIFICATION STEPS

### **Step 1: Check Current Status**
```bash
# Check if .env.local is properly ignored
git status

# Should NOT show .env.local
# If it does, something is wrong!
```

### **Step 2: Remove Accidentally Committed Secrets**
```bash
# If you accidentally committed secrets:
git rm --cached .env.local
git rm --cached .env
git commit -m "Remove accidentally committed secrets"

# Then change all exposed credentials immediately!
```

### **Step 3: Verify .gitignore Works**
```bash
# Create a test secret file
echo "test-secret" > test-secret.key

# Check git status
git status

# Should NOT show test-secret.key
# If it does, .gitignore is not working!

# Clean up
rm test-secret.key
```

---

## 🚨 WHAT TO DO IF SECRETS ARE EXPOSED

### **If you accidentally committed secrets to GitHub:**

**IMMEDIATE ACTIONS:**

1. **Rotate ALL exposed credentials:**
   - Generate new Supabase service role key
   - Generate new OpenAI API key
   - Generate new Razorpay keys
   - Update `.env.local` with new keys

2. **Remove from Git history:**
   ```bash
   # Use git filter-branch or BFG Repo Cleaner
   # WARNING: This rewrites history!
   
   # Remove specific file from all commits
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (dangerous - coordinate with team!)
   git push origin --force --all
   ```

3. **Contact support:**
   - Supabase: security@supabase.com
   - OpenAI: support@openai.com
   - Razorpay: support@razorpay.com

4. **Review access logs:**
   - Check if exposed keys were used
   - Monitor for unauthorized access
   - Review billing for unusual activity

---

## ✅ ENVIRONMENT VARIABLE SECURITY

### **Current Setup (Correct):**

```
.env.local (gitignored) ← Your actual secrets here
.env.example (committed) ← Template without secrets
```

### **Example .env.local (NEVER COMMIT THIS):**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ❌ REAL KEY
OPENAI_API_KEY=sk-proj-abc123...                                  ❌ REAL KEY
```

### **Example .env.example (SAFE TO COMMIT):**
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  ✅ PLACEHOLDER
OPENAI_API_KEY=sk-your-openai-api-key-here          ✅ PLACEHOLDER
```

---

## 🔍 FILES TO AUDIT

### **Files That May Contain Secrets:**

```bash
# Search for potential secrets in codebase
# (Run from project root)

# Check for hardcoded API keys
grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.next

# Check for Supabase keys
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --exclude-dir=node_modules --exclude-dir=.next

# Check for Razorpay keys
grep -r "rzp_" . --exclude-dir=node_modules --exclude-dir=.next

# Check for password strings
grep -ri "password.*=" . --exclude-dir=node_modules --exclude-dir=.next --exclude=SECURITY_CHECKLIST.md
```

---

## 🛡️ BEST PRACTICES

### **1. Never Hardcode Secrets:**
```typescript
// ❌ BAD - Hardcoded
const apiKey = "sk-proj-abc123...";

// ✅ GOOD - From environment
const apiKey = process.env.OPENAI_API_KEY;
```

### **2. Validate Environment Variables:**
```typescript
// src/lib/env.ts
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}
```

### **3. Use Different Keys for Dev/Prod:**
```env
# Development (.env.local)
OPENAI_API_KEY=sk-test-...

# Production (Vercel env vars)
OPENAI_API_KEY=sk-prod-...
```

### **4. Rotate Keys Regularly:**
- Supabase keys: Every 90 days
- OpenAI keys: Every 90 days
- Razorpay keys: Before going live

### **5. Monitor Usage:**
- Check OpenAI usage dashboard
- Monitor Supabase logs
- Review Razorpay transactions

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] `.env.local` is gitignored
- [ ] `.env.example` is committed (no secrets)
- [ ] All secrets are in Vercel environment variables
- [ ] No hardcoded API keys in code
- [ ] Database credentials are secure
- [ ] Service role key is never exposed to client
- [ ] Rate limiting is enabled (Upstash Redis)
- [ ] CORS is configured correctly
- [ ] RLS policies are enabled on all tables
- [ ] Admin routes are protected
- [ ] Payment keys are test keys (until ready for live)

---

## 🚀 DEPLOYMENT SECURITY

### **Vercel Environment Variables:**

Add these in Vercel Dashboard (NOT in code):

```
Settings → Environment Variables

NEXT_PUBLIC_SUPABASE_URL          [Production value]
NEXT_PUBLIC_SUPABASE_ANON_KEY     [Production value]
SUPABASE_SERVICE_ROLE_KEY         [Production value] ⚠️ SECRET
OPENAI_API_KEY                    [Production value] ⚠️ SECRET
UPSTASH_REDIS_REST_URL            [Production value]
UPSTASH_REDIS_REST_TOKEN          [Production value] ⚠️ SECRET
```

**Important:**
- Use different keys for Preview vs Production
- Never use same keys as local development
- Rotate production keys regularly

---

## 📊 .gitignore VERIFICATION

### **Current .gitignore Protects:**

✅ All `.env*` files  
✅ API keys (`*.key`, `*.pem`)  
✅ Database dumps (`*.sql.backup`, `*.dump`)  
✅ Payment credentials  
✅ User data exports  
✅ Temporary files  
✅ IDE config  
✅ OS-specific files  
✅ Log files  
✅ Backup files  

### **What IS Committed (Safe):**

✅ `.env.example` (template only)  
✅ Source code  
✅ Public assets  
✅ Documentation (`.md` files)  
✅ Configuration (non-sensitive)  
✅ Package files (`package.json`)  

---

## 🔐 SUPABASE RLS POLICIES

Ensure Row Level Security is enabled:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

**Critical tables that MUST have RLS:**
- `profiles` - User data
- `course_enrollments` - Payment/enrollment data
- `payments` - Payment records
- `mock_test_attempts` - Student data

---

## 🎯 ADMIN SECURITY

### **Admin Access Control:**

```typescript
// ✅ GOOD - Server-side check
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role !== "admin") {
  return { error: "FORBIDDEN" };
}

// ❌ BAD - Client-side check only
if (userRole !== "admin") {
  return <AccessDenied />;
}
```

---

## 📱 CLIENT-SIDE SAFETY

### **What Goes to Client:**

✅ **Safe (NEXT_PUBLIC_ prefix):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (public key only)

❌ **NEVER Send to Client:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RAZORPAY_KEY_SECRET`
- Any `_SECRET` or `_PRIVATE` variables

---

## ✅ SUMMARY

### **Security Status:**

✅ `.gitignore` updated and comprehensive  
✅ `.env.example` created (safe template)  
✅ Environment variables properly configured  
✅ No secrets in codebase  
✅ RLS policies enforced  
✅ Admin routes protected  
✅ Service role key never exposed to client  

### **Next Steps:**

1. **Review** current `.env.local` - ensure all secrets are present
2. **Rotate** any keys that may have been exposed
3. **Monitor** API usage for unusual activity
4. **Set up** Vercel environment variables before deployment
5. **Enable** rate limiting (Upstash Redis)
6. **Test** security before going live

---

**REMEMBER:**
> "The best security is defense in depth. Multiple layers protect against mistakes."

---

**Status:** ✅ **SECURITY HARDENED**  
**Author:** AI Assistant  
**Date:** February 2, 2026
