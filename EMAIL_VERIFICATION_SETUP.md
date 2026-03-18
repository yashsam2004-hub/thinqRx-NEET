# Email Verification Setup Guide

## Overview
This application now requires email verification for all users before they can access the platform. Users selecting Plus or Pro plans must also complete payment after email verification.

## Features Implemented

### 1. **Email Verification Required**
- All new users must verify their email before accessing the app
- Verification email sent automatically upon signup
- Users redirected to verification page if email not verified

### 2. **Payment Gates for Plus/Pro**
- Users selecting Plus/Pro plans create account first
- Must verify email before payment
- Redirected to payment page after email verification
- Cannot access app content until payment complete

### 3. **Welcome Email**
- Users receive verification email with link
- Email contains instructions for next steps
- For paid plans: mentions payment requirement

### 4. **Access Control**
- Middleware blocks unverified users from protected routes
- Protected routes: /dashboard, /subjects, /topics, /test, /admin, etc.
- Users redirected to /verify-email if not verified

## Supabase Configuration Required

### Step 1: Enable Email Confirmation

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, enable:
   - ✅ **Enable email confirmations**
   - ✅ **Confirm email** (checkbox)

### Step 2: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the **Confirm signup** template:

```html
<h2>Welcome to SynoRx!</h2>
<p>Thank you for signing up. Please verify your email address to get started.</p>
<p>
  <a href="{{ .ConfirmationURL }}">Verify Email</a>
</p>
<p>Or copy and paste this link:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>
<p>If you didn't sign up for SynoRx, you can safely ignore this email.</p>
```

### Step 3: Set Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your site URLs:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: 
     - `https://yourdomain.com/dashboard`
     - `https://yourdomain.com/verify-email`
     - `http://localhost:3000/dashboard` (for development)
     - `http://localhost:3000/verify-email` (for development)

### Step 4: Configure Email Provider (Optional but Recommended)

By default, Supabase sends emails from their server. For production, configure your own email provider:

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure your email provider (SendGrid, AWS SES, etc.)
3. Example for SendGrid:
   - **SMTP Host**: `smtp.sendgrid.net`
   - **SMTP Port**: `587`
   - **SMTP User**: `apikey`
   - **SMTP Password**: Your SendGrid API key
   - **Sender Email**: `noreply@yourdomain.com`
   - **Sender Name**: `SynoRx`

## User Flow

### Free Plan Signup:
1. User signs up with Free plan
2. Receives verification email
3. Clicks verification link
4. Redirected to login
5. Signs in → Access dashboard immediately

### Plus/Pro Plan Signup:
1. User signs up with Plus/Pro plan
2. Receives verification email
3. Clicks verification link
4. Redirected to login
5. Signs in → Redirected to payment page
6. Completes Razorpay payment
7. Access dashboard with premium features

## Testing Email Verification

### Local Development:

1. Sign up with a test email
2. Check Supabase Dashboard → **Authentication** → **Users**
3. Click on the user → **Send password recovery** (to test email sending)
4. For testing, you can manually confirm email in Supabase:
   - Go to **Authentication** → **Users**
   - Click on user
   - Click **Confirm email**

### Production Testing:

1. Use a real email address
2. Complete full signup flow
3. Check email inbox (and spam)
4. Click verification link
5. Verify redirect to correct page

## Environment Variables

No additional environment variables needed. Supabase handles email configuration through the dashboard.

## Troubleshooting

### Users not receiving emails:

1. **Check Supabase Email Settings**:
   - Ensure "Enable email confirmations" is checked
   - Verify SMTP settings if using custom provider

2. **Check Rate Limits**:
   - Supabase free tier has email rate limits
   - Consider upgrading for production

3. **Check Spam Folder**:
   - Supabase default emails may go to spam
   - Configure custom SMTP with verified domain for better deliverability

### Verification link not working:

1. **Check Redirect URLs**:
   - Ensure all redirect URLs are added in Supabase settings
   - Include both http://localhost:3000 and production URLs

2. **Link Expired**:
   - Verification links expire after 24 hours
   - User can request new verification email from /verify-email page

### Payment not triggering:

1. **Check Middleware Logic**:
   - Ensure user metadata has `selected_plan` set
   - Verify course enrollment check in middleware

2. **Check Razorpay Configuration**:
   - Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set
   - Test payment flow separately

## Security Notes

1. ✅ Email verification prevents spam signups
2. ✅ Payment gates prevent free access to paid features
3. ✅ Middleware ensures enforcement at every protected route
4. ✅ User metadata stores plan selection securely
5. ✅ Service role key never exposed to client

## Deployment Checklist

- [ ] Enable email confirmations in Supabase
- [ ] Configure custom SMTP (recommended for production)
- [ ] Set up email templates
- [ ] Add all redirect URLs
- [ ] Test signup flow with real email
- [ ] Test paid plan flow with Razorpay test mode
- [ ] Monitor Supabase email logs for issues
- [ ] Set up email monitoring/alerts

## Support

If users report issues with email verification:
1. Check Supabase Dashboard → **Authentication** → **Users**
2. Verify email_confirmed_at timestamp
3. Manually confirm email if needed (emergency only)
4. Send new verification email from dashboard
5. Check Supabase logs for email sending errors
