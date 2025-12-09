import { test, expect } from '@playwright/test';

/**
 * Authentication Tests - Signup Flow
 *
 * Note: These tests require a test database.
 * Use unique emails for each test run to avoid conflicts.
 */

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('signup page displays correctly', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Sign Up|ScoutPulse/);

    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.locator('button[type="submit"]').click();

    // Should show validation errors
    const errorMessages = page.locator('[role="alert"], .text-red-500, .error-message');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test('shows error for invalid email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill('not-an-email');
    await page.locator('input[type="password"]').fill('Password123!');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show email validation error
    await expect(page.locator('text=/invalid|email/i')).toBeVisible({ timeout: 3000 });
  });

  test('shows error for weak password', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('123'); // Too short

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show password validation error
    await expect(page.locator('text=/password|weak|short/i')).toBeVisible({ timeout: 3000 });
  });

  test.skip('successful signup redirects to onboarding or verification', async ({ page }) => {
    // TODO: Implement with test database and unique email generation
    // This test requires actual Supabase connection and unique emails per run

    const uniqueEmail = `test+${Date.now()}@scoutpulse.app`;
    const password = 'SecurePassword123!';

    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Should redirect to onboarding or email verification
    await expect(page).toHaveURL(/onboarding|verify/, { timeout: 10000 });
  });

  test('link to login page works', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]');

    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    const toggleButton = page.locator('button[aria-label*="password"], [data-testid="toggle-password"]');

    if (await toggleButton.count() > 0) {
      // Initial state should be password type
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle
      await toggleButton.first().click();

      // Should now be text type
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to toggle back
      await toggleButton.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });
});
