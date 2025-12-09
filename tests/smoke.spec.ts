import { test, expect } from '@playwright/test';

/**
 * Smoke Tests
 * Basic tests to ensure the application loads and key pages are accessible
 */

test.describe('Smoke Tests', () => {
  test('landing page loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loaded
    await expect(page).toHaveTitle(/ScoutPulse/);

    // Check for key elements
    await expect(page.locator('text=ScoutPulse')).toBeVisible();
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('signup page is accessible', async ({ page }) => {
    await page.goto('/signup');

    // Check for signup form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('navigation between login and signup works', async ({ page }) => {
    await page.goto('/login');

    // Click on "Sign up" link (adjust selector based on actual implementation)
    const signupLink = page.locator('a[href*="signup"]').first();
    if (await signupLink.count() > 0) {
      await signupLink.click();
      await expect(page).toHaveURL(/signup/);
    }
  });

  test('404 page works', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Should show 404 or not-found content
    await expect(page.locator('text=/404|not found/i')).toBeVisible();
  });
});
