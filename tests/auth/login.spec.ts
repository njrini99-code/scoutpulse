import { test, expect } from '@playwright/test';

/**
 * Authentication Tests - Login Flow
 *
 * Note: These tests require a test database with known credentials.
 * Set up test users in Supabase for E2E testing.
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page displays correctly', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Login|ScoutPulse/);

    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.locator('button[type="submit"]').click();

    // Should show validation errors (adjust selectors based on actual error display)
    const errorMessages = page.locator('[role="alert"], .text-red-500, .error-message');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test('shows error for invalid email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill('not-an-email');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Should show email validation error
    await expect(page.locator('text=/invalid|email/i')).toBeVisible({ timeout: 3000 });
  });

  test.skip('successful login redirects to dashboard', async ({ page }) => {
    // TODO: Set up test user credentials
    // This test requires actual Supabase test users to be created

    const testEmail = process.env.TEST_USER_EMAIL || 'test@scoutpulse.app';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/(player|coach)\//, { timeout: 10000 });
  });

  test('forgot password link works', async ({ page }) => {
    const forgotPasswordLink = page.locator('a[href*="forgot"], text=/forgot password/i');

    if (await forgotPasswordLink.count() > 0) {
      await forgotPasswordLink.first().click();
      await expect(page).toHaveURL(/forgot|reset/);
    }
  });

  test('link to signup page works', async ({ page }) => {
    const signupLink = page.locator('a[href*="signup"]');

    if (await signupLink.count() > 0) {
      await signupLink.first().click();
      await expect(page).toHaveURL(/signup/);
    }
  });
});
