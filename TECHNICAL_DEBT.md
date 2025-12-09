# ScoutPulse - Technical Debt Tracker

**Last Updated:** December 9, 2025
**Status:** Active Tracking

---

## 🎯 Purpose

This document tracks known technical debt, code quality issues, and areas needing improvement in the ScoutPulse codebase. Items are prioritized and linked to the action plan.

---

## 📊 Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **Build/Config** | 1 | 0 | 1 | 0 | 2 |
| **Testing** | 1 | 0 | 0 | 0 | 1 |
| **Performance** | 0 | 1 | 1 | 0 | 2 |
| **Security** | 0 | 1 | 0 | 0 | 1 |
| **Code Quality** | 0 | 0 | 3 | 2 | 5 |
| **Documentation** | 0 | 0 | 1 | 0 | 1 |
| **Features** | 0 | 0 | 0 | 3 | 3 |
| **TOTAL** | **2** | **2** | **6** | **5** | **15** |

---

## 🔴 CRITICAL (Fix Immediately)

### CRITICAL-001: TypeScript Build Errors
**Category:** Build/Config
**Impact:** Blocks production builds
**Effort:** 30 minutes
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #1

**Issue:**
```
error TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist
error TS2307: Cannot find module 'react' or its corresponding type declarations
```

**Root Cause:** Missing or misconfigured @types/react, or node_modules corruption

**Solution:**
1. Clean install: `rm -rf node_modules package-lock.json && npm install`
2. Verify @types/react version matches React 18.3.1
3. Check tsconfig.json has correct settings

**Status:** 🔴 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 9, 2025 (TODAY)

---

### CRITICAL-002: No Test Coverage
**Category:** Testing
**Impact:** High risk of regressions, blocks production confidence
**Effort:** 4 hours (initial), 20+ hours (comprehensive)
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #4

**Issue:**
- 100+ pages with 0% test coverage
- Real-time features (messaging, notifications) untested
- Recruiting algorithms untested
- No E2E tests, no unit tests, no integration tests

**Risk:**
- Cannot safely refactor
- Regressions in production
- Difficult to onboard new developers
- Features may break silently

**Solution:**
1. **Phase 1:** Add E2E tests for critical paths (4 hours)
   - Signup/login
   - Profile creation
   - Messaging
   - Watchlist operations
   - Notifications
2. **Phase 2:** Unit tests for business logic (8 hours)
3. **Phase 3:** Component tests (8 hours)

**Status:** 🔴 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 12, 2025 (Week 1)

---

## 🟠 HIGH PRIORITY (Next Sprint)

### HIGH-001: Performance Not Validated
**Category:** Performance
**Impact:** May have poor user experience, high bounce rate
**Effort:** 2 hours
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #5

**Issue:**
- No Lighthouse audits run recently
- Bundle size not analyzed
- Landing page has "insane enhancements" (particles, 3D effects) - may be too heavy
- Core Web Vitals unknown

**Risk:**
- Poor SEO
- High bounce rate on slow connections
- Large data usage on mobile

**Solution:**
1. Run Lighthouse on key pages
2. Run bundle analyzer
3. Measure LCP, FID, CLS
4. Optimize heavy pages (especially landing page)

**Status:** 🟠 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 13, 2025 (Week 1)

---

### HIGH-002: Security Audit Needed
**Category:** Security
**Impact:** Potential data breaches, unauthorized access
**Effort:** 3 hours
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #6

**Issue:**
- RLS policies not fully tested
- File upload security not audited
- Input validation not comprehensive
- No security scan run

**Risk:**
- Data breach
- Unauthorized access to player/coach data
- Malicious file uploads
- SQL injection (unlikely with Supabase, but still need to verify)

**Solution:**
1. Test all RLS policies with different user roles
2. Audit file upload validation
3. Review all user input validation
4. Run `npm audit` and fix vulnerabilities
5. Consider professional security audit before production

**Status:** 🟠 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 14, 2025 (Week 1)

---

## 🟡 MEDIUM PRIORITY (Next 2 Weeks)

### MEDIUM-001: No Error Monitoring
**Category:** Code Quality
**Impact:** Errors in production go unnoticed
**Effort:** 1 hour
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #7

**Issue:**
- No Sentry or error monitoring
- Errors logged to console only
- No alerts for production issues

**Solution:**
- Integrate Sentry
- Setup error alerts
- Replace console.error with proper logging

**Status:** 🟡 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 16, 2025 (Week 2)

---

### MEDIUM-002: No Analytics
**Category:** Code Quality
**Impact:** No visibility into user behavior, can't optimize
**Effort:** 2 hours
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #8

**Issue:**
- No analytics tracking (PostHog, Mixpanel, etc.)
- Can't measure conversion funnels
- Can't track feature usage
- No A/B testing capability

**Solution:**
- Integrate PostHog (recommended)
- Track key events (signup, profile complete, messages sent, etc.)
- Setup funnels

**Status:** 🟡 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 17, 2025 (Week 2)

---

### MEDIUM-003: Landing Page Bundle Size Unknown
**Category:** Performance
**Impact:** Slow initial load, poor SEO
**Effort:** 2 hours
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #9

**Issue:**
- Landing page has heavy animations (particles, 3D effects, parallax)
- Bundle size not measured
- May hurt SEO and mobile experience

**Solution:**
- Run bundle analyzer on landing page
- Lazy load heavy animations
- Consider lightweight version for first load

**Status:** 🟡 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 18, 2025 (Week 2)

---

### MEDIUM-004: Console.error Used Instead of Logging Utility
**Category:** Code Quality
**Impact:** Inconsistent error logging
**Effort:** 30 minutes
**Assigned:** Unassigned

**Issue:**
- `console.error` used in multiple places
- Should use centralized logging utility that reports to Sentry

**Locations:**
- `app/(dashboard)/player/discover/page.tsx:194` (already identified in IMPROVEMENT_AGENT_REPORT.md)
- Likely more across codebase

**Solution:**
1. Create/use `logError` utility in `lib/errors/`
2. Search codebase for console.error
3. Replace with logError calls

**Status:** 🟡 OPEN
**Created:** Dec 9, 2025

---

### MEDIUM-005: <img> Tags Instead of Next.js Image
**Category:** Code Quality
**Impact:** Missing image optimization, slower loads
**Effort:** 1 hour
**Assigned:** Unassigned

**Issue:**
- Some `<img>` tags used instead of Next.js `<Image>` component
- Missing automatic optimization

**Locations:**
- `app/coach/program/page.tsx:221` (already identified in IMPROVEMENT_AGENT_REPORT.md)
- May be more across codebase

**Solution:**
1. Search for `<img` tags
2. Replace with Next.js `<Image>` component
3. Add width/height or fill props

**Status:** 🟡 OPEN
**Created:** Dec 9, 2025

---

### MEDIUM-006: Database Cleanup Functions Not Scheduled
**Category:** Code Quality
**Impact:** Database size grows unbounded
**Effort:** 1 hour
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #10

**Issue:**
- Cleanup functions exist (`cleanup_old_notifications`) but not scheduled
- Old notifications, engagement events accumulate

**Solution:**
- Setup pg_cron in Supabase (or equivalent)
- Schedule weekly cleanup
- Monitor database size

**Status:** 🟡 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 19, 2025 (Week 2)

---

## 🟢 LOW PRIORITY (Nice to Have)

### LOW-001: Unused Imports
**Category:** Code Quality
**Impact:** Slightly larger bundle
**Effort:** 15 minutes
**Assigned:** Unassigned

**Issue:**
- `Loader2` imported but not used in some files (already replaced with shimmer)

**Locations:**
- `app/(dashboard)/player/page.tsx:34` (fixed in IMPROVEMENT_AGENT_REPORT.md)
- `components/error/ErrorBoundary.tsx:16` (fixed in IMPROVEMENT_AGENT_REPORT.md)

**Solution:**
- Run ESLint with unused imports rule
- Auto-fix with `eslint --fix`

**Status:** ✅ FIXED (Dec 8, 2025)
**Created:** Dec 9, 2025

---

### LOW-002: No Unit Tests for Business Logic
**Category:** Testing
**Impact:** Can't refactor algorithms safely
**Effort:** 4 hours
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #11

**Issue:**
- Recruiting algorithm (trending score, match score) untested
- Utility functions untested
- Custom hooks untested

**Solution:**
- Add Vitest
- Write unit tests for `lib/queries/recruits.ts`
- Test utility functions in `lib/utils/`

**Status:** 🟢 OPEN
**Created:** Dec 9, 2025
**Target Date:** TBD (Week 3-4)

---

### LOW-003: Drag-and-Drop Not Implemented
**Category:** Features
**Impact:** UI polish, better UX
**Effort:** 3 hours
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #12

**Issue:**
- Recruiting pipeline has structure for drag-and-drop but not implemented
- Users must use dropdown to change status

**Solution:**
- Add @dnd-kit/core
- Implement drag-and-drop in RecruitingPipeline.tsx
- Update database on drop

**Status:** 🟢 OPEN
**Created:** Dec 9, 2025
**Target Date:** TBD (Week 3-4)

---

### LOW-004: No Email Notifications
**Category:** Features
**Impact:** Users miss important updates
**Effort:** 4 hours
**Assigned:** Unassigned
**Linked To:** PRIORITY_ACTION_PLAN.md - Task #13

**Issue:**
- Only in-app notifications exist
- No email fallback for offline users

**Solution:**
- Integrate email service (Resend or SendGrid)
- Create email templates
- Add email preferences

**Status:** 🟢 OPEN
**Created:** Dec 9, 2025
**Target Date:** TBD (Week 3-4)

---

### LOW-005: Missing Documentation
**Category:** Documentation
**Impact:** Harder to onboard new developers
**Effort:** 3 hours
**Assigned:** Unassigned

**Issue:**
- No deployment guide (partial exists but incomplete)
- No troubleshooting guide
- No contributing guide
- No API documentation

**Solution:**
- Create comprehensive deployment guide
- Add troubleshooting section to README
- Write contributing guide
- Document internal APIs if exposing

**Status:** 🟡 OPEN
**Created:** Dec 9, 2025
**Target Date:** Dec 20, 2025 (Week 2)

---

## 📋 Closed Items

### ✅ CLOSED-001: TypeScript Build Cache in Git
**Category:** Build/Config
**Resolution:** Added *.tsbuildinfo to .gitignore
**Closed:** Dec 9, 2025
**Closed By:** Code Organization Task

**Issue:** tsconfig.tsbuildinfo was being tracked in git, causing conflicts

**Solution Applied:**
```bash
echo "*.tsbuildinfo" >> .gitignore
git rm --cached tsconfig.tsbuildinfo
```

---

### ✅ CLOSED-002: Disorganized Documentation
**Category:** Documentation
**Resolution:** Created /docs folder with organized structure
**Closed:** Dec 9, 2025
**Closed By:** Code Organization Task

**Issue:** 50+ markdown files in root directory, hard to navigate

**Solution Applied:**
- Created /docs folder
- Organized into subdirectories: implementation, setup, reports, guides, archive
- Created docs/README.md

---

## 📊 Metrics

### By Priority
- **Critical:** 2 items (13%)
- **High:** 2 items (13%)
- **Medium:** 6 items (40%)
- **Low:** 5 items (33%)

### By Status
- **Open:** 13 items (87%)
- **Fixed:** 2 items (13%)

### By Category
- **Testing:** 2 items
- **Performance:** 2 items
- **Code Quality:** 5 items
- **Security:** 1 item
- **Features:** 3 items
- **Build/Config:** 2 items
- **Documentation:** 1 item (+ 1 closed)

---

## 🎯 Sprint Planning

### Sprint 1 (Week 1) - Critical & High Priority
**Target:** Dec 9-14, 2025
- [ ] CRITICAL-001: Fix TypeScript build
- [ ] CRITICAL-002: Add E2E tests (Phase 1)
- [ ] HIGH-001: Performance audit
- [ ] HIGH-002: Security audit

**Success Criteria:**
- Production builds work
- 10+ E2E tests passing
- Lighthouse scores documented
- Security issues identified

---

### Sprint 2 (Week 2) - Medium Priority
**Target:** Dec 16-20, 2025
- [ ] MEDIUM-001: Error monitoring (Sentry)
- [ ] MEDIUM-002: Analytics (PostHog)
- [ ] MEDIUM-003: Landing page optimization
- [ ] MEDIUM-006: Database cleanup scheduling
- [ ] LOW-005: Documentation (if time)

**Success Criteria:**
- Sentry reporting errors
- PostHog tracking events
- Landing page < 2.5s LCP
- Cleanup scheduled

---

### Sprint 3 (Week 3-4) - Low Priority & Enhancements
**Target:** TBD
- [ ] LOW-002: Unit tests
- [ ] LOW-003: Drag-and-drop
- [ ] LOW-004: Email notifications

**Success Criteria:**
- 80%+ test coverage on business logic
- Drag-and-drop working
- Email system operational

---

## 🔄 Review Process

**Weekly Review:**
- Update status of all items
- Add newly discovered technical debt
- Reprioritize based on business needs
- Close completed items

**Monthly Review:**
- Analyze trends (are we reducing debt?)
- Identify systemic issues
- Plan major refactoring if needed

---

## 📝 How to Add New Technical Debt

When you discover technical debt:

1. **Add entry to this document** with:
   - ID (e.g., MEDIUM-007)
   - Category
   - Priority (Critical/High/Medium/Low)
   - Clear description of issue
   - Impact
   - Estimated effort
   - Proposed solution

2. **Link to action plan** if it's on the roadmap

3. **Update summary table**

4. **Commit changes** with message: "docs: add technical debt item [ID]"

---

## 🎓 Technical Debt Principles

**What is Technical Debt?**
- Code that works but isn't ideal
- Missing tests, docs, or error handling
- Quick hacks that need proper implementation
- Known performance issues
- Security concerns

**What is NOT Technical Debt?**
- New feature requests (those go in feature backlog)
- Bugs (those go in bug tracker)
- User feedback (goes in product backlog)

**When to Address Technical Debt?**
- **Critical:** Immediately, blocks progress
- **High:** Next sprint, affects quality
- **Medium:** Within 1-2 months, plan into roadmap
- **Low:** When convenient, boy scout rule

**Boy Scout Rule:** Always leave code better than you found it. Fix one small piece of tech debt in each PR.

---

**Last Updated:** December 9, 2025
**Next Review:** December 16, 2025 (Weekly)
