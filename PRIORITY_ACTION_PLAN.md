# ScoutPulse - Priority Action Plan

**Last Updated:** December 9, 2025
**Prepared By:** Code Review & Analysis
**Project Status:** 70-80% Production Ready

---

## 🎯 Executive Summary

ScoutPulse is a well-architected baseball recruiting platform with impressive feature completeness. The codebase is professional-grade with 100+ pages, real-time features, and polished UI.

**Current State:**
- ✅ All major features implemented
- ✅ Database schema production-ready
- ✅ UI polished with glassmorphism design
- ⚠️ TypeScript build issues (likely environment)
- ⚠️ No test coverage
- ⚠️ Performance audits needed

**Recommended Focus:** Quality assurance, testing, and production hardening before full launch.

---

## 📋 Prioritized Action Items

### 🔴 CRITICAL (Do First - 1-2 Days)

#### 1. Fix TypeScript Build Errors
**Priority:** CRITICAL
**Estimated Time:** 30 minutes
**Assigned To:** Developer

**Issue:**
```
error TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist
error TS2307: Cannot find module 'react' or its corresponding type declarations
```

**Action Steps:**
1. Clean install dependencies
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Verify `@types/react` version matches React 18.3.1
   ```bash
   npm list @types/react
   ```
3. Check `tsconfig.json` has correct settings:
   ```json
   {
     "compilerOptions": {
       "jsx": "preserve",
       "moduleResolution": "bundler"
     }
   }
   ```
4. Run typecheck to verify
   ```bash
   npm run typecheck
   ```

**Success Criteria:**
- ✅ `npm run typecheck` completes without errors
- ✅ `npm run build` succeeds

**Blocker:** This prevents production builds

---

#### 2. Add .tsbuildinfo to .gitignore
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

**Issue:** TypeScript build cache files are being tracked, causing unnecessary git conflicts.

**Action Steps:**
```bash
echo "*.tsbuildinfo" >> .gitignore
git rm --cached tsconfig.tsbuildinfo
git commit -m "chore: ignore TypeScript build cache files"
```

**Success Criteria:**
- ✅ `*.tsbuildinfo` in .gitignore
- ✅ No tsbuildinfo files in git status

---

#### 3. Environment Variable Validation
**Priority:** CRITICAL
**Estimated Time:** 15 minutes

**Action Steps:**
1. Create `.env.example` with all required variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=

   # PWA (optional)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. Verify `.env.local` has all values
3. Add environment validation in `app/layout.tsx`:
   ```typescript
   if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
     throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
   }
   ```

**Success Criteria:**
- ✅ `.env.example` exists
- ✅ App throws clear error if env vars missing

---

### 🟠 HIGH PRIORITY (Next 3-5 Days)

#### 4. Add Basic E2E Tests
**Priority:** HIGH
**Estimated Time:** 4 hours
**Dependencies:** TypeScript build fixed

**Rationale:** 100+ pages with no tests = high regression risk

**Recommended Tool:** Playwright (officially supported by Next.js)

**Action Steps:**

1. **Install Playwright** (15 min)
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Create test structure** (15 min)
   ```
   tests/
   ├── auth/
   │   ├── login.spec.ts
   │   └── signup.spec.ts
   ├── player/
   │   ├── dashboard.spec.ts
   │   └── profile.spec.ts
   └── coach/
       └── discover.spec.ts
   ```

3. **Write critical path tests** (3 hours)

   **Priority Tests:**
   - ✅ User signup flow
   - ✅ User login flow
   - ✅ Player profile creation
   - ✅ Coach discover players (USA map interaction)
   - ✅ Add player to watchlist
   - ✅ Send message (player ↔ coach)
   - ✅ Notifications appear in real-time

4. **Setup CI/CD** (30 min)
   - Add GitHub Actions workflow
   - Run tests on PR
   - Block merge if tests fail

**Example Test:**
```typescript
// tests/coach/watchlist.spec.ts
test('coach can add player to watchlist', async ({ page }) => {
  await page.goto('/coach/college/discover');
  await page.click('[data-testid="player-card-123"]');
  await page.click('[data-testid="add-to-watchlist"]');
  await expect(page.locator('[data-testid="toast"]'))
    .toContainText('Added to watchlist');
});
```

**Success Criteria:**
- ✅ 10-15 E2E tests covering critical paths
- ✅ Tests run in CI/CD
- ✅ Documentation on running tests

**Files to Create:**
- `playwright.config.ts`
- `tests/**/*.spec.ts`
- `.github/workflows/test.yml`

---

#### 5. Performance Audit & Optimization
**Priority:** HIGH
**Estimated Time:** 2 hours

**Action Steps:**

1. **Run Lighthouse on key pages** (30 min)
   ```bash
   # Install Lighthouse CLI
   npm install -g @lhci/cli

   # Run audits
   lhci autorun --collect.url=http://localhost:3000
   lhci autorun --collect.url=http://localhost:3000/player
   lhci autorun --collect.url=http://localhost:3000/coach/college/discover
   ```

2. **Bundle size analysis** (30 min)
   ```bash
   npm run analyze
   ```
   - Check for large dependencies
   - Identify code-splitting opportunities
   - Look for duplicate dependencies

3. **Database query optimization** (30 min)
   - Review slow queries in Supabase dashboard
   - Add missing indexes if needed
   - Check for N+1 query problems

4. **Image optimization** (30 min)
   - Verify all `<img>` tags replaced with Next.js `<Image>`
   - Check image sizes are appropriate
   - Ensure lazy loading is working

**Success Criteria:**
- ✅ Lighthouse scores > 90 for key pages
- ✅ Main bundle < 300KB gzipped
- ✅ LCP < 2.5s, FID < 100ms, CLS < 0.1
- ✅ No N+1 query issues

**Create Report:**
- `PERFORMANCE_AUDIT_REPORT.md`

---

#### 6. Security Audit
**Priority:** HIGH
**Estimated Time:** 3 hours

**Action Steps:**

1. **Review RLS Policies** (1 hour)
   - Test each policy with different user roles
   - Verify users can't access unauthorized data
   - Check for policy gaps

   **Test Script:**
   ```sql
   -- Try to access another user's data
   SET request.jwt.claim.sub = 'user-1-id';
   SELECT * FROM players WHERE user_id = 'user-2-id'; -- Should return 0 rows
   ```

2. **Input Validation Audit** (1 hour)
   - Check all forms have zod schemas
   - Verify API routes validate input
   - Test for SQL injection (parameterized queries)
   - Test for XSS (React handles most, but check dangerouslySetInnerHTML)

3. **File Upload Security** (30 min)
   - Verify file type validation
   - Check file size limits
   - Test malicious file uploads
   - Verify Supabase Storage policies

4. **Dependency Audit** (30 min)
   ```bash
   npm audit
   npm audit fix
   ```

**Success Criteria:**
- ✅ All RLS policies tested and verified
- ✅ No high/critical npm vulnerabilities
- ✅ All user input validated
- ✅ File uploads secure

**Create Report:**
- `SECURITY_AUDIT_REPORT.md`

---

### 🟡 MEDIUM PRIORITY (Next 1-2 Weeks)

#### 7. Error Monitoring Setup
**Priority:** MEDIUM
**Estimated Time:** 1 hour

**Recommended Tool:** Sentry (free tier available)

**Action Steps:**

1. **Install Sentry** (15 min)
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Configure error boundaries** (15 min)
   - Wrap app with Sentry ErrorBoundary
   - Add custom error messages
   - Test error reporting

3. **Replace console.error** (30 min)
   - Find all `console.error` calls
   - Replace with `logError` utility that reports to Sentry

   **Example:**
   ```typescript
   // lib/errors/logError.ts
   import * as Sentry from '@sentry/nextjs';

   export function logError(error: Error, context?: Record<string, any>) {
     console.error(error);
     Sentry.captureException(error, { extra: context });
   }
   ```

4. **Setup alerts** (15 min)
   - Configure Sentry alerts for critical errors
   - Setup Slack/email notifications

**Success Criteria:**
- ✅ Sentry integrated and reporting errors
- ✅ Error boundaries in place
- ✅ Alerts configured

**Files to Update:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `app/global-error.tsx`
- `lib/errors/logError.ts`

---

#### 8. Analytics Integration
**Priority:** MEDIUM
**Estimated Time:** 2 hours

**Recommended Tool:** PostHog (open source, generous free tier)

**Action Steps:**

1. **Install PostHog** (15 min)
   ```bash
   npm install posthog-js
   ```

2. **Setup provider** (15 min)
   ```typescript
   // app/providers/AnalyticsProvider.tsx
   'use client';
   import posthog from 'posthog-js';
   import { PostHogProvider } from 'posthog-js/react';

   posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
     api_host: 'https://app.posthog.com'
   });
   ```

3. **Track key events** (1.5 hours)
   - User signup
   - Profile completion
   - Messages sent
   - Watchlist additions
   - Camp registrations
   - Video uploads

   **Example:**
   ```typescript
   posthog.capture('player_added_to_watchlist', {
     player_id: playerId,
     coach_id: coachId,
     status: 'watchlist'
   });
   ```

4. **Setup funnels** (30 min)
   - Signup → Onboarding → Profile Complete
   - Discover → View Profile → Add to Watchlist
   - Message Sent → Message Read → Reply

**Success Criteria:**
- ✅ PostHog tracking key events
- ✅ Funnels configured
- ✅ Privacy-compliant (GDPR/CCPA)

---

#### 9. Landing Page Optimization
**Priority:** MEDIUM
**Estimated Time:** 2 hours

**Issue:** Landing page has "insane enhancements" (particles, 3D effects, parallax) which may hurt performance.

**Action Steps:**

1. **Audit landing page bundle** (30 min)
   ```bash
   npm run analyze
   ```
   - Check size of `/` route bundle
   - Identify heavy animations/libraries

2. **Lazy load animations** (1 hour)
   ```typescript
   import dynamic from 'next/dynamic';

   const ParticleSystem = dynamic(() => import('./ParticleSystem'), {
     ssr: false,
     loading: () => <div>Loading...</div>
   });
   ```

3. **Optimize images** (30 min)
   - Use Next.js Image component
   - Proper sizing (don't load 4K images for 500px display)
   - Consider WebP format

**Success Criteria:**
- ✅ Landing page LCP < 2.5s
- ✅ Landing page bundle < 200KB
- ✅ Lighthouse score > 90

---

#### 10. Database Cleanup Functions
**Priority:** MEDIUM
**Estimated Time:** 1 hour

**Action Steps:**

1. **Create cleanup migration** (30 min)
   ```sql
   -- Delete old read notifications (>90 days)
   CREATE OR REPLACE FUNCTION cleanup_old_notifications()
   RETURNS void AS $$
   BEGIN
     DELETE FROM notifications
     WHERE is_read = true
       AND read_at < NOW() - INTERVAL '90 days';
   END;
   $$ LANGUAGE plpgsql;

   -- Delete orphaned engagement events
   CREATE OR REPLACE FUNCTION cleanup_orphaned_engagement()
   RETURNS void AS $$
   BEGIN
     DELETE FROM player_engagement_events
     WHERE player_id NOT IN (SELECT id FROM players);
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Setup pg_cron (optional)** (30 min)
   - Schedule cleanup functions to run weekly
   - Monitor database size

**Success Criteria:**
- ✅ Cleanup functions created
- ✅ Database size under control

---

### 🟢 LOW PRIORITY (Nice to Have - 2-4 Weeks)

#### 11. Unit Tests for Business Logic
**Priority:** LOW
**Estimated Time:** 4 hours

**Recommended Tool:** Vitest (fast, Vite-based)

**Action Steps:**

1. **Install Vitest** (15 min)
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   ```

2. **Write unit tests** (3.5 hours)
   - `lib/queries/recruits.ts` - Test trending score calculation
   - `lib/queries/recruits.ts` - Test match score algorithm
   - `lib/utils/` - Test utility functions
   - `lib/hooks/` - Test custom hooks

**Example Test:**
```typescript
// lib/queries/recruits.test.ts
import { calculateTrendingScore } from './recruits';

test('trending score calculation', () => {
  const score = calculateTrendingScore({
    recent_views_7d: 10,
    watchlist_adds_count: 2,
    recent_updates_30d: 5
  });
  expect(score).toBe(10 * 1.5 + 2 * 3 + 5 * 2); // 31
});
```

**Success Criteria:**
- ✅ 80%+ test coverage on business logic
- ✅ Tests run in CI/CD

---

#### 12. Drag-and-Drop for Recruiting Pipeline
**Priority:** LOW (Enhancement)
**Estimated Time:** 3 hours

**Current State:** Structure is ready, just needs drag-and-drop implementation

**Recommended Library:** @dnd-kit/core (modern, accessible)

**Action Steps:**

1. **Install dnd-kit** (5 min)
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable
   ```

2. **Implement drag-and-drop** (2.5 hours)
   - Wrap pipeline in DndContext
   - Make cards draggable
   - Handle drop events
   - Update database on drop
   - Optimistic UI updates

**Success Criteria:**
- ✅ Can drag players between pipeline columns
- ✅ Database updates on drop
- ✅ Works on touch devices

**File to Update:**
- `components/coach/college/RecruitingPipeline.tsx`

---

#### 13. Email Notifications
**Priority:** LOW (Enhancement)
**Estimated Time:** 4 hours

**Current State:** In-app notifications work. Email would be additional channel.

**Recommended Service:** Resend (modern, good DX) or SendGrid

**Action Steps:**

1. **Setup email service** (30 min)
2. **Create email templates** (1 hour)
   - New message received
   - Added to watchlist
   - Profile viewed (daily digest)
3. **Add email preferences** (1.5 hours)
   - User can opt in/out per notification type
   - Frequency settings (instant, daily, weekly)
4. **Implement sending logic** (1 hour)
   - Trigger emails from database functions
   - Queue emails for digest

**Success Criteria:**
- ✅ Users receive email notifications
- ✅ Preferences work
- ✅ Emails are branded

---

#### 14. Mobile App (React Native)
**Priority:** LOW (Future)
**Estimated Time:** 40+ hours

**Rationale:** PWA works well, but native app could provide better performance and app store presence.

**Considerations:**
- Reuse business logic from web app
- Supabase works with React Native
- Could use Expo for easier development
- Requires separate codebase

**Decision:** Defer until proven demand from users.

---

## 📊 Sprint Planning

### Sprint 1 (Week 1): Critical Fixes & Foundation
**Goal:** Fix build issues, add tests, ensure production-ready

- ✅ Fix TypeScript build (Day 1)
- ✅ Add .tsbuildinfo to .gitignore (Day 1)
- ✅ Environment variable validation (Day 1)
- ✅ E2E tests setup + critical tests (Day 2-3)
- ✅ Performance audit (Day 4)
- ✅ Security audit (Day 5)

**Deliverables:**
- Production builds work
- 10-15 E2E tests passing
- Performance report
- Security report

---

### Sprint 2 (Week 2): Production Hardening
**Goal:** Add monitoring, analytics, optimize

- ✅ Error monitoring (Sentry) (Day 1)
- ✅ Analytics (PostHog) (Day 2)
- ✅ Landing page optimization (Day 3)
- ✅ Database cleanup functions (Day 4)
- ✅ Documentation updates (Day 5)

**Deliverables:**
- Sentry reporting errors
- PostHog tracking events
- Landing page < 2.5s LCP
- Cleanup functions scheduled

---

### Sprint 3 (Week 3-4): Enhancements (Optional)
**Goal:** Nice-to-have features

- ✅ Unit tests for business logic
- ✅ Drag-and-drop pipeline
- ✅ Email notifications
- ✅ Additional polish

**Deliverables:**
- 80%+ test coverage
- Drag-and-drop working
- Email system operational

---

## 🎯 Definition of Done

### For Production Launch:

**Must Have:**
- ✅ No TypeScript errors
- ✅ No critical npm vulnerabilities
- ✅ E2E tests covering critical paths (10+ tests)
- ✅ Lighthouse scores > 80 on all key pages
- ✅ Security audit completed and issues resolved
- ✅ Error monitoring active (Sentry)
- ✅ Analytics tracking key events
- ✅ Environment variables documented
- ✅ Deployment documentation
- ✅ Backup strategy for database
- ✅ Monitoring for Supabase usage

**Nice to Have:**
- ⚪ Unit test coverage > 70%
- ⚪ Drag-and-drop pipeline
- ⚪ Email notifications
- ⚪ Lighthouse scores > 90
- ⚪ Load testing completed

---

## 📈 Success Metrics

### Technical Metrics
- **Build Time:** < 2 minutes
- **Lighthouse Score:** > 90 (all pages)
- **Test Coverage:** > 70%
- **Bundle Size:** < 500KB (main bundle)
- **LCP:** < 2.5s
- **Error Rate:** < 0.1%

### User Metrics (Post-Launch)
- **Signup Completion:** > 80%
- **Profile Completion:** > 60%
- **DAU/MAU:** > 20% (engagement)
- **Message Response Rate:** > 50%
- **Watchlist Conversion:** > 30% (discover → watchlist)

---

## 🚨 Risk Management

### High Risk Items

**1. TypeScript Build Fails in Production**
- **Mitigation:** Fix now (Sprint 1, Day 1)
- **Contingency:** Rollback to last known good build

**2. Supabase Realtime Doesn't Scale**
- **Mitigation:** Monitor connection count, test with load
- **Contingency:** Implement polling fallback

**3. No Test Coverage = Regressions**
- **Mitigation:** Add E2E tests ASAP (Sprint 1)
- **Contingency:** Extensive manual QA before releases

**4. Landing Page Too Heavy**
- **Mitigation:** Performance audit + optimization (Sprint 2)
- **Contingency:** Create lightweight landing page version

**5. Security Vulnerability**
- **Mitigation:** Security audit (Sprint 1)
- **Contingency:** Have incident response plan

---

## 💰 Cost Considerations

### Current Stack (Free Tiers)
- **Vercel:** Free (hobby) or $20/mo (pro)
- **Supabase:** Free up to 500MB DB, 50K monthly active users
- **Sentry:** Free up to 5K events/month
- **PostHog:** Free up to 1M events/month
- **Resend:** Free up to 3K emails/month

### Scaling Costs (at 10K users)
- **Vercel:** ~$20-50/mo
- **Supabase:** ~$25-50/mo (Pro plan)
- **Sentry:** ~$26/mo
- **PostHog:** Still free
- **Resend:** ~$20/mo

**Total:** ~$91-146/mo for 10K users

---

## 📞 Questions to Answer

### Before Sprint 1:
1. **Who is running the E2E tests?** CI/CD or manual?
2. **What's the launch timeline?** Affects sprint planning
3. **Is staging environment set up?** Needed for testing
4. **Who does security review?** Internal or external audit?

### Before Production:
1. **What's the backup strategy?** Daily? Weekly?
2. **Who monitors errors/alerts?** On-call rotation?
3. **What's the rollback plan?** Database migrations reversible?
4. **GDPR/privacy compliance?** Terms of service, privacy policy ready?

---

## 📚 Resources

### Documentation to Create
- [ ] Deployment guide (staging + production)
- [ ] Testing guide (how to run E2E tests)
- [ ] Troubleshooting guide (common issues)
- [ ] Contributing guide (for team members)
- [ ] API documentation (if exposing APIs)

### Tools to Setup
- [ ] GitHub Actions (CI/CD)
- [ ] Sentry (error monitoring)
- [ ] PostHog (analytics)
- [ ] Playwright (E2E tests)
- [ ] Vercel (deployment)

---

## ✅ Quick Wins (Can Do Today)

1. **Add .tsbuildinfo to .gitignore** (2 min)
2. **Fix TypeScript build** (30 min)
3. **Create .env.example** (5 min)
4. **Run bundle analyzer** (10 min)
5. **Run Lighthouse audit** (15 min)
6. **Check npm audit** (5 min)
7. **Review RLS policies** (30 min)

**Total Time:** ~1.5 hours
**Impact:** Catch major issues before they become blockers

---

## 🎉 Conclusion

ScoutPulse is **impressively close to production-ready**. The codebase is professional, features are complete, and the UI is polished. The main gaps are:

1. **Testing** (biggest risk)
2. **Performance validation** (probably fine, but need data)
3. **Build issues** (easy fix)

**Recommended Path:**
1. Fix TypeScript build (30 min)
2. Add E2E tests (4 hours)
3. Run audits (2 hours)
4. Deploy to staging and test
5. Launch! 🚀

**Timeline to Production:**
- **Fast Track:** 1 week (just critical items)
- **Recommended:** 2-3 weeks (critical + high priority)
- **Ideal:** 4 weeks (includes nice-to-haves)

---

**Next Steps:**
1. Review this plan with team
2. Decide on timeline
3. Start Sprint 1, Task 1: Fix TypeScript Build
4. Track progress in project management tool

**Questions?** Review `CODEBASE_OVERVIEW.md` for technical details.
