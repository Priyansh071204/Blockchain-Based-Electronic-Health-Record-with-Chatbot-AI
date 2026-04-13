import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should log in successfully as an admin using protocol emulation', async ({ page }) => {
    // 1. Visit the login page
    await page.goto('/login');
    
    // 2. Verify we are on the correct page
    await expect(page).toHaveTitle(/EHR Blockchain System/i);
    await expect(page.locator('h1')).toContainText(/PROTOCOL ACCESS/i);

    // 3. Fill the credentials manually (more stable than emulation button for tests)
    await page.fill('input[type="email"]', 'admin@ehr.local');
    await page.fill('input[type="password"]', 'Admin@123');
    
    // 4. Submit and wait for navigation
    await page.click('button:has-text("Authorize Access")');
    await page.waitForURL('**/admin', { timeout: 30000 });

    // 5. Verify the Admin Dashboard is loaded
    await expect(page.locator('h1')).toContainText(/Network Orchestrator/i);
    await expect(page.getByText('Ledger Health')).toBeVisible({ timeout: 15000 });
    
    // 6. Verify data from the mock blockchain is visible
    await expect(page.getByText('Verified Nodes')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with wrong credentials
    await page.fill('input[type="email"]', 'wrong@ehr.local');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button:has-text("Authorize Access")');
    
    // Expect error message
    await expect(page.locator('.error-lume')).toBeVisible();
    await expect(page.locator('.error-lume')).toContainText(/ACCESS_DENIED/i);
  });
});
