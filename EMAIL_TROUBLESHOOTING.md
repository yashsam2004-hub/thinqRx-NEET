# EMAIL VERIFICATION FIX - CRITICAL SETUP

## Problem: Users Not Receiving Verification Emails

If users are not receiving verification emails after signup, follow these steps:

## Solution 1: Check Supabase Email Settings (MOST COMMON)

### Step 1: Verify Email Confirmation is Enabled
```
Supabase Dashboard → Authentication → Providers → Email
✅ Ensure "Confirm email" is ENABLED
```

### Step 2: Check Email Rate Limits
```
Supabase Dashboard → Settings → Usage
- Free tier: 3 emails per hour per user
- Check if you've hit rate limits
- Upgrade plan if needed for production
```

### Step 3: Check Site URL Configuration
```
Supabase Dashboard → Authentication → URL Configuration

Site URL (MUST match your deployment):
https://SynoRx.app

OR if using Vercel preview:
https://your-project.vercel.app
```

### Step 4: Add ALL Redirect URLs
```
Redirect URLs (add ALL of these):
https://SynoRx.app/**
https://SynoRx.app/dashboard
https://SynoRx.app/verify-email
https://SynoRx.app/auth/callback
http://localhost:3000/**
http://localhost:3000/dashboard
http://localhost:3000/verify-email
```

## Solution 2: Configure SMTP (RECOMMENDED for Production)

Supabase's default email service can be unreliable. Configure your own SMTP:

### Option A: SendGrid (Recommended)

1. Create SendGrid account: https://sendgrid.com/
2. Create API Key with "Mail Send" permission
3. Verify sender email/domain

In Supabase:
```
Settings → Auth → SMTP Settings

Enable Custom SMTP: YES
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: <Your SendGrid API Key>
Sender Email: noreply@yourdomain.com
Sender Name: SynoRx
```

### Option B: AWS SES

```
SMTP Host: email-smtp.us-east-1.amazonaws.com
SMTP Port: 587
SMTP User: <Your AWS SES SMTP Username>
SMTP Pass: <Your AWS SES SMTP Password>
Sender Email: noreply@yourdomain.com (must be verified)
Sender Name: SynoRx
```

### Option C: Gmail (Testing Only - Not for Production)

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: <App Password - NOT your Gmail password>
Sender Email: your-email@gmail.com
Sender Name: SynoRx
```

**Note**: Enable 2FA and create App Password in Google Account settings.

## Solution 3: Temporarily Disable Email Verification (DEV ONLY)

For local testing, you can temporarily disable email verification:

### In `src/app/api/auth/signup/route.ts`:
```typescript
// Line 29: Change from false to true
email_confirm: true,  // TEMPORARILY - Change back to false for production!
```

### In `src/middleware.ts`:
```typescript
// Comment out email verification check (lines 102-108)
// if (!user.email_confirmed_at) {
//   console.log("[Middleware] Email not verified for user:", user.email);
//   const url = request.nextUrl.clone();
//   url.pathname = "/verify-email";
//   url.searchParams.set("email", user.email || "");
//   return NextResponse.redirect(url);
// }
```

**⚠️ WARNING**: This is ONLY for testing. Re-enable for production!

## Solution 4: Manual Email Confirmation (Admin Override)

If a user reports not receiving email:

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click on the user
4. Click "Confirm email" button
5. User can now login

## Debugging Email Issues

### Check Supabase Logs:
```
Supabase Dashboard → Logs → Auth Logs
Look for email send events and errors
```

### Check Email Template:
```
Authentication → Email Templates → Confirm signup
Ensure template has {{ .ConfirmationURL }} placeholder
```

### Test Email Sending:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM auth.users 
WHERE email_confirmed_at IS NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

## Common Issues & Fixes

### Issue: "Email already registered"
- User exists but email not verified
- Solution: Use password reset flow or manually confirm in dashboard

### Issue: Emails going to spam
- Configure custom SMTP with verified domain
- Add SPF/DKIM records to your domain

### Issue: Confirmation link doesn't work
- Check redirect URLs include your domain
- Ensure Site URL matches deployment URL exactly

### Issue: "Invalid link" after clicking
- Link expired (24 hour limit)
- User can request new email from /verify-email page

## Production Checklist

Before going live, ensure:
- [ ] Custom SMTP configured (SendGrid/AWS SES)
- [ ] Sender email verified
- [ ] Domain SPF/DKIM records added
- [ ] All redirect URLs added
- [ ] Site URL set correctly
- [ ] Email template customized
- [ ] Rate limits appropriate for traffic
- [ ] Test emails delivered successfully
- [ ] Test emails not in spam

## Current Configuration Status

Based on your implementation:
- ✅ Email confirmation enabled in Supabase
- ✅ Middleware checks verification status
- ✅ /verify-email page created
- ⚠️ Need to add redirect URLs
- ⚠️ Need to configure SMTP for production
- ⚠️ Need to verify Site URL setting

## Next Steps

1. Add redirect URLs in Supabase (see Solution 1, Step 4)
2. Configure SMTP for reliable delivery (see Solution 2)
3. Test with real email address
4. Monitor Supabase logs for errors
5. If still issues, manually confirm test users (Solution 4)

## Support Resources

- Supabase Email Docs: https://supabase.com/docs/guides/auth/auth-email
- SendGrid Setup: https://supabase.com/docs/guides/auth/auth-smtp
- Email Troubleshooting: https://supabase.com/docs/guides/platform/going-into-prod

---

**If emails still not working after following this guide, check Supabase Auth Logs for specific error messages.**
