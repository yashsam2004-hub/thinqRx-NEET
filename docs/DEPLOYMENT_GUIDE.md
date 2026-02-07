# Deployment Guide

Complete guide to deploying ThinqRx to production.

## Prerequisites

- [ ] Supabase project (production)
- [ ] Upstash Redis instance
- [ ] Razorpay account (live mode)
- [ ] OpenAI API key
- [ ] Domain name with SSL certificate
- [ ] Vercel account (recommended) or other hosting

## Pre-Deployment Checklist

### 1. Environment Variables

Create `.env.production` with all production values:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key

# OpenAI
OPENAI_API_KEY=sk-prod-xxxxx
OPENAI_MODEL=gpt-4o-mini

# Redis (Production)
UPSTASH_REDIS_REST_URL=https://your-prod-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_prod_token

# Razorpay (LIVE MODE)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_live_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Setup

Run all migrations in **production** Supabase:

```sql
-- Run in order:
1. 20260120000000_multi_course.sql
2. 20260120000001_migrate_existing_data.sql
3. 20260120000002_course_aware_rls.sql
4. 20260120000003_payments.sql
5. 20260120000004_add_payment_id_to_enrollments.sql
```

### 3. Database Seed Data

```sql
-- Set admin users
UPDATE profiles
SET role = 'admin'
WHERE email IN ('admin@thinqrx.com', 'support@thinqrx.com');

-- Verify courses are created
SELECT * FROM courses WHERE is_active = true;

-- Set up pricing for all courses
INSERT INTO course_pricing (course_id, plan, monthly_price, annual_price)
VALUES
  ((SELECT id FROM courses WHERE code = 'gpat'), 'plus', 199, 1910),
  ((SELECT id FROM courses WHERE code = 'gpat'), 'pro', 499, 4790);

-- Add default syllabus and outlines
-- (Run scripts/quick-setup.sql and scripts/add-outlines.sql)
```

### 4. Configure Razorpay Webhooks

1. Go to Razorpay Dashboard (LIVE mode)
2. Settings > Webhooks
3. Create webhook:
   - URL: `https://your-domain.com/api/webhooks/razorpay`
   - Secret: (generate strong secret, add to env vars)
   - Events: payment.captured, payment.failed, refund.created
4. Test webhook delivery

### 5. Build and Test Locally

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Test production build locally
npm start

# Run in browser and test:
# - Authentication flow
# - Course enrollment
# - Payment flow (test mode first)
# - Admin panel access
# - AI generation
```

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard > Project > Settings > Environment Variables
   - Add all production environment variables
   - Mark sensitive variables as "Encrypted"

3. **Configure Domains**
   - Add custom domain in Vercel Dashboard
   - Configure DNS records (A/CNAME)
   - Enable automatic HTTPS

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Docker + VPS

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Build and Deploy**
   ```bash
   # Build image
   docker build -t thinqrx:latest .
   
   # Run container
   docker run -p 3000:3000 --env-file .env.production thinqrx:latest
   ```

3. **Set up Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Post-Deployment Checklist

### Immediate (Day 1)

- [ ] Verify site is accessible via HTTPS
- [ ] Test user registration and login
- [ ] Test payment flow with real card (₹1)
- [ ] Verify webhook is receiving events
- [ ] Check Supabase connection
- [ ] Verify Redis is working
- [ ] Test AI generation
- [ ] Check admin panel access
- [ ] Verify course enrollment flow
- [ ] Test on mobile devices

### Week 1

- [ ] Monitor error logs daily
- [ ] Check payment transaction logs
- [ ] Monitor Supabase usage
- [ ] Monitor Redis usage
- [ ] Check API response times
- [ ] Review user feedback
- [ ] Test under load (100+ concurrent users)
- [ ] Backup database
- [ ] Set up monitoring alerts

### Week 2-4

- [ ] Review analytics data
- [ ] Optimize slow queries
- [ ] Adjust rate limits if needed
- [ ] Gather user feedback
- [ ] Fix reported bugs
- [ ] Update documentation
- [ ] Plan feature updates

## Monitoring Setup

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs

# Configure sentry.client.config.js
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### 2. Analytics (Google Analytics)

```typescript
// Add to layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

### 3. Uptime Monitoring

- Use UptimeRobot or Pingdom
- Set up alerts for downtime
- Monitor critical endpoints

### 4. Performance Monitoring

- Vercel Analytics (if using Vercel)
- Google Lighthouse CI
- Web Vitals monitoring

## Scaling Considerations

### When to Scale

- Supabase: > 100 concurrent connections
- Redis: > 1M requests/day
- Vercel: > 100GB bandwidth/month
- OpenAI: > 1M tokens/day

### Scaling Options

1. **Supabase**: Upgrade to higher tier
2. **Redis**: Increase Upstash plan
3. **Hosting**: Upgrade Vercel plan or add edge functions
4. **CDN**: Enable Cloudflare for static assets
5. **Database**: Enable read replicas

## Backup Strategy

### Daily Backups

```bash
# Supabase auto-backup (enable in dashboard)
# Additional manual backup:
pg_dump -h db.xxx.supabase.co -U postgres > backup-$(date +%Y%m%d).sql
```

### Weekly Full Backup

- Database dump
- Redis backup (if critical)
- Environment variables backup
- Code repository tag

## Rollback Plan

If deployment fails:

1. **Immediate**: Revert to previous Vercel deployment
2. **Database**: Restore from latest backup
3. **DNS**: Point to backup server if needed
4. **Communication**: Notify users of maintenance

## Launch Communication

### Before Launch

- [ ] Create landing page
- [ ] Set up social media accounts
- [ ] Prepare announcement email
- [ ] Create demo video
- [ ] Prepare press release

### Launch Day

- [ ] Announce on social media
- [ ] Send email to beta users
- [ ] Post on relevant forums/communities
- [ ] Monitor for issues actively

### Post-Launch

- [ ] Gather user feedback
- [ ] Monitor metrics closely
- [ ] Quick-fix critical issues
- [ ] Plan next iteration

## Support Setup

### Support Channels

- Email: support@thinqrx.com
- WhatsApp: +91-XXXXXXXXXX
- Chat: (integrate Tawk.to or similar)

### Support Documentation

- Create FAQ page
- Write troubleshooting guides
- Document common issues
- Create video tutorials

## Legal & Compliance

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Refund Policy
- [ ] GDPR compliance (if applicable)
- [ ] GST registration (if required)
- [ ] Business registration

## Success Metrics

Track these KPIs:

- User registrations
- Course enrollments
- Payment conversion rate
- Churn rate
- Average session duration
- AI generation usage
- Error rate
- API response time
- Customer satisfaction score

## Emergency Contacts

- **Hosting**: Vercel Support
- **Database**: Supabase Support
- **Payments**: Razorpay Support
- **Redis**: Upstash Support
- **DNS/CDN**: Your provider support

## Maintenance Windows

Schedule regular maintenance:

- **Weekly**: Database optimization (low-traffic hours)
- **Monthly**: Dependency updates
- **Quarterly**: Security audit
- **Annually**: Major version upgrades

---

**Remember**: Always test in staging environment before deploying to production!
