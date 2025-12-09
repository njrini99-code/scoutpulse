# ScoutPulse E2E Tests

End-to-end tests using Playwright to validate critical user flows.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Set Up Test Environment Variables

Create a `.env.test.local` file:

```env
# Test database (use separate Supabase project or test environment)
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key

# Test user credentials
TEST_PLAYER_EMAIL=testplayer@example.com
TEST_PLAYER_PASSWORD=TestPassword123!

TEST_COACH_EMAIL=testcoach@example.com
TEST_COACH_PASSWORD=TestPassword123!

# Base URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## Running Tests

### Run all tests

```bash
npx playwright test
```

### Run specific test file

```bash
npx playwright test tests/smoke.spec.ts
```

### Run in UI mode (interactive)

```bash
npx playwright test --ui
```

### Run in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug mode

```bash
npx playwright test --debug
```

## Test Structure

```
tests/
├── README.md              # This file
├── smoke.spec.ts          # Basic smoke tests (no auth required)
├── auth/
│   ├── login.spec.ts      # Login flow tests
│   └── signup.spec.ts     # Signup flow tests
├── player/
│   └── dashboard.spec.ts  # Player dashboard tests (auth required)
└── coach/
    └── discover.spec.ts   # Coach discovery tests (auth required)
```

## Test Categories

### ✅ Smoke Tests (Ready to Run)
- Landing page loads
- Login/signup pages accessible
- Navigation works
- 404 page works

**No auth required** - Can run immediately

### 🔄 Auth Tests (Partially Ready)
- Form validation
- Error messages
- Navigation between pages
- **Skipped:** Actual login/signup (needs test users)

**Requires:** Test users in Supabase

### ⏸️ Dashboard Tests (Skipped - Templates)
- Player dashboard
- Coach discovery
- Watchlist operations
- Notifications

**Requires:** Authenticated sessions + test data

## Creating Test Users

### Option 1: Manual (Supabase Dashboard)
1. Go to Supabase project → Authentication → Users
2. Create test users with known credentials
3. Add to `.env.test.local`

### Option 2: Automated (Recommended for CI/CD)
Create a setup script that:
1. Creates test users via Supabase Admin API
2. Seeds test data (players, coaches, teams)
3. Tears down after tests

## Best Practices

### 1. Use Data Test IDs
Add `data-testid` attributes to key elements:

```tsx
<button data-testid="add-to-watchlist">Add to Watchlist</button>
```

Then in tests:
```typescript
await page.locator('[data-testid="add-to-watchlist"]').click();
```

### 2. Avoid Hardcoded Selectors
❌ Bad:
```typescript
await page.click('.css-class-xyz > button:nth-child(2)');
```

✅ Good:
```typescript
await page.locator('[data-testid="submit-button"]').click();
// or
await page.locator('button:has-text("Submit")').click();
```

### 3. Wait for Network Requests
```typescript
// Wait for API call to complete
await page.waitForResponse(response =>
  response.url().includes('/api/players') && response.status() === 200
);
```

### 4. Use Page Object Model (for complex tests)
```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="submit"]');
  }
}
```

### 5. Clean Up Test Data
```typescript
test.afterEach(async () => {
  // Delete test data created during test
  // Reset database state
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Failed Tests

### 1. View Test Report
```bash
npx playwright show-report
```

### 2. View Screenshots
Failed tests automatically capture screenshots in `test-results/`

### 3. View Videos
Videos of failed tests are in `test-results/`

### 4. View Traces
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Current Status

| Test Suite | Status | Coverage |
|------------|--------|----------|
| Smoke Tests | ✅ Ready | 100% |
| Auth Tests | 🔄 Partial | ~60% |
| Player Tests | ⏸️ Skipped | 0% |
| Coach Tests | ⏸️ Skipped | 0% |

**Next Steps:**
1. Create test users in Supabase
2. Implement auth helpers
3. Un-skip authenticated tests
4. Add more test coverage (messaging, notifications)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js Testing Guide](https://nextjs.org/docs/testing/playwright)
