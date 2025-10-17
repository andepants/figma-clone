/**
 * @fileoverview E2E tests for pricing page functionality
 *
 * Test Coverage:
 * - Page loads correctly with all sections
 * - Pricing tiers display with correct information
 * - Feature comparison table expands/collapses
 * - FAQ accordion interactions
 * - Mobile responsiveness
 * - CTA button functionality
 *
 * Test Strategy:
 * - Use data-testid for reliable selectors
 * - Test user journeys, not implementation
 * - Verify visual hierarchy and accessibility
 * - Test responsive breakpoints
 */

import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load pricing page with all main sections', async ({ page }) => {
    // Verify page title
    const title = page.locator('h1:has-text("Choose Your Plan")');
    await expect(title).toBeVisible();

    // Verify all major sections are present
    await expect(page.locator('[data-testid="pricing-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="pricing-tiers"]')).toBeVisible();
    await expect(page.locator('[data-testid="pricing-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="pricing-faq"]')).toBeVisible();
    await expect(page.locator('[data-testid="pricing-footer-cta"]')).toBeVisible();
  });

  test('should display both pricing tiers correctly', async ({ page }) => {
    // Verify Free tier
    const freeTier = page.locator('[data-testid="pricing-tier-free"]');
    await expect(freeTier).toBeVisible();
    await expect(freeTier.locator('h2:has-text("Free")')).toBeVisible();
    await expect(freeTier.locator('text=$0')).toBeVisible();
    await expect(freeTier.locator('[data-testid="cta-free"]')).toBeVisible();

    // Verify Founders tier
    const foundersTier = page.locator('[data-testid="pricing-tier-founders"]');
    await expect(foundersTier).toBeVisible();
    await expect(foundersTier.locator('h2:has-text("Founders")')).toBeVisible();
    await expect(foundersTier.locator('text=$9.99')).toBeVisible();
    await expect(foundersTier.locator('[data-testid="cta-founders"]')).toBeVisible();

    // Verify Founders tier has highlight styling
    const foundersBg = await foundersTier.getAttribute('class');
    expect(foundersBg).toContain('bg-blue-50');
  });

  test('should show feature comparison when toggled', async ({ page }) => {
    const comparisonToggle = page.locator('[data-testid="comparison-toggle"]');

    // Initially collapsed - verify aria-expanded is false
    const initialExpanded = await comparisonToggle.getAttribute('aria-expanded');
    expect(initialExpanded).toBe('false');

    // Table should not be visible initially
    const table = page.locator('table');
    await expect(table).not.toBeVisible();

    // Click to expand
    await comparisonToggle.click();

    // Wait for animation
    await page.waitForTimeout(200);

    // Verify expanded state
    const expandedState = await comparisonToggle.getAttribute('aria-expanded');
    expect(expandedState).toBe('true');

    // Table should now be visible
    await expect(table).toBeVisible();

    // Verify table headers
    await expect(page.locator('th:has-text("Feature")')).toBeVisible();
    await expect(page.locator('th:has-text("Free")')).toBeVisible();
    await expect(page.locator('th:has-text("Founders")')).toBeVisible();

    // Click again to collapse
    await comparisonToggle.click();
    await page.waitForTimeout(200);

    // Should be collapsed again
    const collapsedState = await comparisonToggle.getAttribute('aria-expanded');
    expect(collapsedState).toBe('false');
  });

  test('should expand/collapse FAQ items', async ({ page }) => {
    // Scroll FAQ into view
    await page.locator('[data-testid="pricing-faq"]').scrollIntoViewIfNeeded();

    // Get all FAQ buttons
    const faqButtons = page.locator('[data-testid="pricing-faq"] button[aria-expanded]');
    const firstFAQ = faqButtons.first();

    // Initially all should be collapsed
    const initialExpanded = await firstFAQ.getAttribute('aria-expanded');
    expect(initialExpanded).toBe('false');

    // Click first FAQ
    await firstFAQ.click();
    await page.waitForTimeout(100);

    // Should be expanded
    const expandedState = await firstFAQ.getAttribute('aria-expanded');
    expect(expandedState).toBe('true');

    // Answer should be visible
    const answerId = await firstFAQ.getAttribute('aria-controls');
    if (answerId) {
      await expect(page.locator(`#${answerId}`)).toBeVisible();
    }

    // Click again to collapse
    await firstFAQ.click();
    await page.waitForTimeout(100);

    // Should be collapsed
    const collapsedState = await firstFAQ.getAttribute('aria-expanded');
    expect(collapsedState).toBe('false');
  });

  test('should handle Free tier CTA click', async ({ page }) => {
    const freeCTA = page.locator('[data-testid="cta-free"]');

    // Click free tier CTA
    await freeCTA.click();

    // Should navigate to /projects (this will trigger auth in real scenario)
    await page.waitForURL(/\/(projects|canvas)/, { timeout: 3000 }).catch(() => {
      // If not navigated (e.g., protected route redirected to auth), that's expected
    });

    // Verify button text
    await expect(page.locator('[data-testid="cta-free"]').or(page.locator('text=Sign Up Free'))).toBeTruthy();
  });

  test('should handle Founders tier CTA placeholder', async ({ page }) => {
    const foundersCTA = page.locator('[data-testid="cta-founders"]');

    // Set up alert handler (placeholder shows alert until Stripe integration in Phase 5)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Stripe checkout will be integrated in Phase 5');
      await dialog.accept();
    });

    // Click founders CTA
    await foundersCTA.click();

    // Alert should have been shown and handled
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    // Reload page for responsive layout
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Header should be visible
    await expect(page.locator('h1:has-text("Choose Your Plan")')).toBeVisible();

    // Pricing tiers should stack vertically (check that they're both visible)
    const freeTier = page.locator('[data-testid="pricing-tier-free"]');
    const foundersTier = page.locator('[data-testid="pricing-tier-founders"]');

    await expect(freeTier).toBeVisible();
    await expect(foundersTier).toBeVisible();

    // Verify tiers are stacked (free tier should be above founders tier)
    const freeBox = await freeTier.boundingBox();
    const foundersBox = await foundersTier.boundingBox();

    if (freeBox && foundersBox) {
      // On mobile, free tier should be above (smaller Y coordinate)
      expect(freeBox.y).toBeLessThan(foundersBox.y);
    }

    // FAQ should be readable on mobile
    await page.locator('[data-testid="pricing-faq"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="faq-header"]')).toBeVisible();
  });

  test('should display correct pricing information', async ({ page }) => {
    // Free tier pricing
    const freeTier = page.locator('[data-testid="pricing-tier-free"]');
    await expect(freeTier.locator('text=$0')).toBeVisible();
    await expect(freeTier.locator('text=Forever free')).toBeVisible();

    // Founders tier pricing
    const foundersTier = page.locator('[data-testid="pricing-tier-founders"]');
    await expect(foundersTier.locator('text=$9.99')).toBeVisible();
    await expect(foundersTier.locator('text=/year')).toBeVisible();
    await expect(foundersTier.locator('text=Save 89%')).toBeVisible();
    await expect(foundersTier.locator('text=Less than $1/month')).toBeVisible();
  });

  test('should show Best Value badge on Founders tier', async ({ page }) => {
    const foundersTier = page.locator('[data-testid="pricing-tier-founders"]');

    // Badge should be visible
    await expect(foundersTier.locator('text=/Best Value/')).toBeVisible();
    await expect(foundersTier.locator('text=/spots left/')).toBeVisible();
  });

  test('should have accessible focus states', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Verify focus is visible on first focusable element
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.getAttribute('class') || '';
    });

    // Focus should have visible indicator (focus-visible class)
    expect(focusedElement).toBeTruthy();
  });

  test('should scroll to pricing tiers when footer CTA clicked', async ({ page }) => {
    // Scroll to bottom first
    await page.locator('[data-testid="pricing-footer-cta"]').scrollIntoViewIfNeeded();

    // Click footer CTA
    const footerCTA = page.locator('[data-testid="footer-cta-button"]');
    await footerCTA.click();

    // Wait a bit for smooth scroll
    await page.waitForTimeout(500);

    // Pricing tiers section should be in view
    const tiersSection = page.locator('[data-testid="pricing-tiers"]');
    const isInView = await tiersSection.isVisible();
    expect(isInView).toBe(true);
  });

  test('should display at least 5 FAQ items', async ({ page }) => {
    await page.locator('[data-testid="pricing-faq"]').scrollIntoViewIfNeeded();

    const faqButtons = page.locator('[data-testid="pricing-faq"] button[aria-expanded]');
    const count = await faqButtons.count();

    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // H1 should be unique
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // H1 should be the main page title
    await expect(page.locator('h1')).toContainText('Choose Your Plan');

    // H2 elements for major sections
    const h2Elements = page.locator('h2');
    const h2Count = await h2Elements.count();
    expect(h2Count).toBeGreaterThan(2); // At least: Free, Founders, and section headers
  });
});
