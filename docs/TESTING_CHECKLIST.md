# Testing Checklist

Comprehensive testing checklist for SynoRx before production launch.

## 🔐 Authentication Tests

### Registration
- [ ] User can register with email and password
- [ ] Email validation works
- [ ] Password strength validation works
- [ ] Confirmation email is sent
- [ ] User redirected to dashboard after registration
- [ ] Duplicate email registration is prevented

### Login
- [ ] User can login with correct credentials
- [ ] Login fails with wrong password
- [ ] Login fails with non-existent email
- [ ] "Remember me" functionality works
- [ ] Session persists across browser refresh
- [ ] User redirected to intended page after login

### Logout
- [ ] User can logout successfully
- [ ] Session is cleared after logout
- [ ] User redirected to home page
- [ ] Protected routes inaccessible after logout

### Password Reset
- [ ] User can request password reset
- [ ] Reset email is sent
- [ ] Reset link works
- [ ] User can set new password
- [ ] Old password no longer works

## 📚 Course Management (User)

### Course Discovery
- [ ] All active courses are displayed
- [ ] Coming soon courses shown with badge
- [ ] Course details are accurate
- [ ] Course switcher works
- [ ] Selected course persists in localStorage

### Course Dashboard
- [ ] 3 tabs are visible (Study/Practice/Mocks)
- [ ] Current plan is displayed
- [ ] Tab switching works smoothly
- [ ] Content loads for each tab

### Study Material Tab
- [ ] All subjects for course are listed
- [ ] Subject click navigates to topics
- [ ] Topics are listed correctly
- [ ] Free preview topics accessible without plan
- [ ] Paid topics locked for free users
- [ ] AI notes generation works
- [ ] Notes display correctly with formatting
- [ ] Chemical structures render (if applicable)
- [ ] Bookmark functionality works

### Practice Tests Tab
- [ ] "Create Practice Test" button works
- [ ] Subject dropdown populates
- [ ] Topic dropdown populates after subject selection
- [ ] Difficulty selection works
- [ ] Question count validates (1-20)
- [ ] Plan limits enforced (Free: 10, Plus/Pro: 20)
- [ ] Test generation works
- [ ] Rate limits enforced correctly
- [ ] Test questions display properly
- [ ] Answer submission works
- [ ] Score calculation is accurate

### Mock Tests Tab
- [ ] Admin-uploaded tests are listed
- [ ] Test details (duration, marks, questions) shown
- [ ] Free plan users see locked tests
- [ ] Plus/Pro users can access allowed tests
- [ ] Test timer works
- [ ] Questions display correctly
- [ ] Answer submission works
- [ ] Test results/analysis shown after submission

## 💰 Pricing & Payments

### Pricing Page
- [ ] All plans displayed (Free/Plus/Pro)
- [ ] Monthly/Annual toggle works
- [ ] Annual pricing shows 20% discount
- [ ] Current plan highlighted
- [ ] Feature comparison visible
- [ ] Upgrade buttons work

### Coupon System
- [ ] Coupon input field accepts codes
- [ ] Valid coupon applies discount
- [ ] Invalid coupon shows error
- [ ] Expired coupon rejected
- [ ] Max uses limit enforced
- [ ] User can't reuse same coupon
- [ ] Discount calculation correct
- [ ] Coupon removal works

### Checkout Flow
- [ ] Checkout page loads with correct details
- [ ] Course name and plan displayed
- [ ] Final price shown correctly
- [ ] Razorpay payment modal opens
- [ ] Test card payment works
- [ ] Payment verification succeeds
- [ ] Enrollment created after payment
- [ ] User redirected to success page
- [ ] Enrollment status updated

### Payment Success
- [ ] Success page displays
- [ ] Enrollment is immediately active
- [ ] User can access premium content
- [ ] Dashboard shows new plan
- [ ] Receipt email sent (if configured)

### Payment Failure
- [ ] Failure page displays
- [ ] Error message shown
- [ ] User can retry payment
- [ ] Payment status remains pending
- [ ] No enrollment created

## 👨‍💼 Admin Panel

### Admin Access
- [ ] Only admin users can access `/admin/*`
- [ ] Non-admin users redirected
- [ ] Admin sidebar visible
- [ ] All admin links work

### Course Management
- [ ] Admin can view all courses
- [ ] Admin can create new course
- [ ] Course code validation works
- [ ] Admin can edit course details
- [ ] Admin can activate/deactivate course
- [ ] Admin can delete course
- [ ] Changes reflect immediately

### Pricing Management
- [ ] Admin can view pricing for all courses
- [ ] Admin can set monthly price
- [ ] Annual price calculated with 20% discount
- [ ] Admin can add features to plans
- [ ] Changes saved correctly
- [ ] Pricing updates reflect on frontend

### Coupon Management
- [ ] Admin can view all coupons
- [ ] Admin can create new coupon
- [ ] Coupon code validation works (3-20 chars, uppercase)
- [ ] Discount percentage validated (1-50%)
- [ ] Max uses validated (1-1000)
- [ ] Expiry date can be set
- [ ] Course-specific coupons work
- [ ] Admin can activate/deactivate coupon
- [ ] Admin can delete coupon
- [ ] Usage count updates after use

### Mock Test Management
- [ ] Admin can view all mock tests
- [ ] Admin can create new mock test
- [ ] Question addition works
- [ ] Multiple questions can be added
- [ ] Question removal works
- [ ] Test details (duration, marks) validated
- [ ] Plan requirement enforced
- [ ] Admin can activate/deactivate test
- [ ] Admin can delete test

## 🔒 Security Tests

### Authorization
- [ ] Unauthenticated users can't access protected routes
- [ ] Users can only access their own data
- [ ] Users can't access other users' notes/tests
- [ ] Admin routes blocked for non-admin users
- [ ] API endpoints validate authentication
- [ ] API endpoints validate authorization

### Rate Limiting
- [ ] AI notes generation rate limited by plan
- [ ] Practice tests rate limited by plan
- [ ] Rate limit headers returned
- [ ] Exceeded limits return 429 error
- [ ] Rate limits reset after time window

### Input Validation
- [ ] All forms validate input
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] File upload validation (if applicable)
- [ ] API input sanitized

### Payment Security
- [ ] Payment signatures verified
- [ ] Webhook signatures verified
- [ ] Amount tampering prevented
- [ ] Payment status can't be manipulated
- [ ] Razorpay credentials not exposed

## 🚀 Performance Tests

### Page Load Times
- [ ] Home page loads < 2 seconds
- [ ] Dashboard loads < 2 seconds
- [ ] Course page loads < 2 seconds
- [ ] Admin panel loads < 3 seconds

### API Response Times
- [ ] Course list API < 500ms
- [ ] Subject list API < 500ms
- [ ] Topic list API < 500ms
- [ ] AI notes generation < 10 seconds
- [ ] Practice test generation < 10 seconds
- [ ] Payment order creation < 2 seconds

### Database Performance
- [ ] Queries execute < 100ms (average)
- [ ] No N+1 query issues
- [ ] Indexes are effective
- [ ] Connection pooling works

### Caching
- [ ] Redis rate limiting works
- [ ] AI notes cached in database
- [ ] Practice tests cached in database
- [ ] Cache hit rate > 80%

## 📱 Mobile & Browser Tests

### Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Devices
- [ ] iPhone (iOS Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Payment modal on mobile works

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Alt text for images
- [ ] Form labels present

## 🔄 Integration Tests

### Supabase
- [ ] Database connection works
- [ ] RLS policies enforced
- [ ] Auth integration works
- [ ] Realtime subscriptions work (if used)

### Redis (Upstash)
- [ ] Connection established
- [ ] Rate limiting works
- [ ] Cache operations work
- [ ] Error handling for Redis failures

### Razorpay
- [ ] Order creation works
- [ ] Payment verification works
- [ ] Webhook reception works
- [ ] Signature verification works
- [ ] Refund handling works (test mode)

### OpenAI
- [ ] API connection works
- [ ] Notes generation works
- [ ] Test generation works
- [ ] Token usage tracked
- [ ] Error handling for API failures

## 🐛 Edge Cases

### Concurrency
- [ ] Multiple simultaneous logins
- [ ] Simultaneous course enrollments
- [ ] Concurrent AI generations
- [ ] Race condition in payment verification

### Network Issues
- [ ] Graceful handling of timeout
- [ ] Retry logic for failed requests
- [ ] Error messages for network failures
- [ ] Offline detection (if applicable)

### Data Edge Cases
- [ ] Empty course list
- [ ] Empty subject list
- [ ] Empty topic list
- [ ] Empty notes content
- [ ] No mock tests available
- [ ] Very long text inputs
- [ ] Special characters in inputs

### Business Logic
- [ ] Plan downgrade (should be blocked)
- [ ] Expired enrollment handling
- [ ] Coupon expiry during checkout
- [ ] Max uses reached during checkout
- [ ] Payment webhook after manual verification

## 📊 Load Testing

### Concurrent Users
- [ ] 10 concurrent users
- [ ] 50 concurrent users
- [ ] 100 concurrent users
- [ ] 500 concurrent users (target)

### API Stress Test
- [ ] 100 requests/second
- [ ] 500 requests/second
- [ ] Identify bottlenecks
- [ ] Database connection limits
- [ ] Redis connection limits

## 🧪 Regression Testing

After each update, test:

- [ ] Core user flows still work
- [ ] No new console errors
- [ ] No broken links
- [ ] No UI regressions
- [ ] No performance regressions

## ✅ Pre-Launch Checklist

### Final Checks
- [ ] All tests pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security audit complete
- [ ] Documentation updated
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Support system ready

### Go/No-Go Criteria

**GO if:**
- All critical tests pass
- No P0/P1 bugs
- Performance meets targets
- Security audit approved
- Team consensus to launch

**NO-GO if:**
- Critical tests fail
- P0/P1 bugs present
- Major performance issues
- Security vulnerabilities found
- Team not confident

---

**Remember**: Test early, test often, and test in production-like environment!
