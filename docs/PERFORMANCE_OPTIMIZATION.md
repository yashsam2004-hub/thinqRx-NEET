# Performance Optimization Guide

This document outlines performance optimization strategies for SynoRx.

## ✅ Implemented Optimizations

### 1. Database Optimizations
- [x] Proper indexing on frequently queried columns
- [x] Foreign key relationships for efficient joins
- [x] Selective field queries (only fetch needed columns)
- [x] Pagination support for large datasets
- [x] Connection pooling via Supabase

### 2. Caching Strategy
- [x] Redis caching for rate limiting
- [x] Redis caching for coupon usage tracking
- [x] AI notes caching in database
- [x] Practice test caching in database
- [x] Enrollment data caching in context

### 3. Frontend Optimizations
- [x] Next.js Image component for optimized images
- [x] Dynamic imports for heavy components
- [x] React context for global state
- [x] Server-side rendering where appropriate
- [x] Code splitting

### 4. API Optimizations
- [x] Server-side data fetching
- [x] Efficient Supabase queries
- [x] Minimal data transfer
- [x] Early returns in API routes

## 🚀 Additional Optimizations to Implement

### Database Layer

#### Query Optimization
```sql
-- Add composite indexes for common queries
CREATE INDEX idx_ai_notes_user_course ON ai_notes(user_id, course_id);
CREATE INDEX idx_ai_tests_user_course ON ai_tests(user_id, course_id);
CREATE INDEX idx_course_enrollments_user_status ON course_enrollments(user_id, status);
```

#### Materialized Views (for analytics)
```sql
-- Create materialized view for enrollment stats
CREATE MATERIALIZED VIEW enrollment_stats AS
SELECT 
  course_id,
  plan,
  COUNT(*) as enrollment_count,
  COUNT(DISTINCT user_id) as unique_users
FROM course_enrollments
WHERE status = 'active'
GROUP BY course_id, plan;

-- Refresh periodically
REFRESH MATERIALIZED VIEW enrollment_stats;
```

### Redis Caching Enhancements

#### Cache Course Data
```typescript
// Cache course details for 1 hour
const cacheKey = `course:${courseId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Fetch from database
const course = await fetchCourse(courseId);
await redis.set(cacheKey, JSON.stringify(course), { ex: 3600 });
```

#### Cache Pricing Data
```typescript
// Cache pricing for 1 day
const cacheKey = `pricing:${courseId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const pricing = await fetchPricing(courseId);
await redis.set(cacheKey, JSON.stringify(pricing), { ex: 86400 });
```

#### Cache Subjects and Topics
```typescript
// Cache subject list per course for 1 hour
const cacheKey = `subjects:${courseId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const subjects = await fetchSubjects(courseId);
await redis.set(cacheKey, JSON.stringify(subjects), { ex: 3600 });
```

### Frontend Performance

#### Lazy Loading
```typescript
// Lazy load heavy components
const MoleculeViewer = dynamic(() => import('@/components/MoleculeViewer'), {
  loading: () => <div>Loading 3D viewer...</div>,
  ssr: false,
});

const AdminPanel = dynamic(() => import('@/app/admin/layout'), {
  loading: () => <div>Loading admin panel...</div>,
});
```

#### Image Optimization
```typescript
// Use Next.js Image with proper sizing
<Image
  src="/images/logo.png"
  alt="SynoRx"
  width={200}
  height={50}
  priority // For above-the-fold images
  placeholder="blur" // Add blur placeholder
/>
```

#### Prefetching
```typescript
// Prefetch likely next pages
<Link href="/courses/gpat" prefetch>
  Go to Course
</Link>
```

### API Performance

#### Response Compression
```typescript
// Add compression middleware (already done by Next.js)
// Ensure large responses are compressed
```

#### Parallel Data Fetching
```typescript
// Fetch multiple resources in parallel
const [courses, enrollments, mockTests] = await Promise.all([
  fetchCourses(),
  fetchEnrollments(userId),
  fetchMockTests(courseId),
]);
```

#### Debouncing & Throttling
```typescript
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    fetchSearchResults(query);
  }, 300),
  []
);
```

### Build Optimizations

#### Next.js Config
```javascript
// next.config.js
module.exports = {
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize images
  images: {
    domains: ['your-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize production build
  productionBrowserSourceMaps: false,
  
  // React strict mode
  reactStrictMode: true,
};
```

## Performance Monitoring

### Metrics to Track

1. **Page Load Time**
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)

2. **API Response Times**
   - AI notes generation time
   - Practice test generation time
   - Database query times
   - Payment processing time

3. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Cache hit rate
   - Index usage

4. **Redis Performance**
   - Cache hit rate
   - Memory usage
   - Connection latency

### Tools for Monitoring

1. **Vercel Analytics** (if deployed on Vercel)
2. **Sentry Performance Monitoring**
3. **Google Lighthouse**
4. **Chrome DevTools Performance Tab**
5. **Supabase Dashboard** (query performance)
6. **Upstash Console** (Redis metrics)

## Performance Budget

Set and enforce performance budgets:

- **Page Load**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **API Response**: < 500ms (average)
- **AI Generation**: < 10 seconds
- **Database Query**: < 100ms
- **Cache Hit Rate**: > 80%

## Optimization Checklist

### Before Each Release

- [ ] Run Lighthouse audit (score > 90)
- [ ] Check bundle size (< 300KB initial load)
- [ ] Test on slow 3G network
- [ ] Test on mobile devices
- [ ] Review API response times
- [ ] Check database query performance
- [ ] Verify cache effectiveness
- [ ] Test with concurrent users

### Continuous Optimization

- [ ] Monitor Core Web Vitals
- [ ] Analyze bundle size trends
- [ ] Review slow API endpoints
- [ ] Optimize database queries
- [ ] Update dependencies regularly
- [ ] Remove unused code
- [ ] Optimize images
- [ ] Enable CDN for static assets

## CDN Configuration (Production)

```typescript
// Use CDN for static assets
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;

// Serve images from CDN
<Image
  src={`${CDN_URL}/images/logo.png`}
  alt="SynoRx"
/>
```

## Database Connection Pooling

```typescript
// Configure Supabase connection pooling
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit realtime events
    },
  },
});
```

## Performance Testing

### Load Testing
```bash
# Use k6 for load testing
k6 run load-test.js

# Test concurrent users
k6 run --vus 100 --duration 30s load-test.js
```

### Stress Testing
```bash
# Test system limits
k6 run --vus 1000 --duration 1m stress-test.js
```

## Quick Wins

1. **Enable Caching**: Add Redis caching for frequently accessed data
2. **Optimize Images**: Use WebP format and proper sizing
3. **Lazy Load**: Defer loading of below-the-fold content
4. **Minify**: Ensure JS/CSS is minified in production
5. **CDN**: Use CDN for static assets
6. **Compression**: Enable gzip/brotli compression
7. **Prefetch**: Prefetch likely next pages
8. **Bundle Analysis**: Remove unused dependencies

## Resources

- Next.js Performance: https://nextjs.org/docs/advanced-features/measuring-performance
- React Performance: https://react.dev/learn/render-and-commit
- Web Vitals: https://web.dev/vitals/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
