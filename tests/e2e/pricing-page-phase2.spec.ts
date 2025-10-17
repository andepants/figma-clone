/**
 * E2E Test: Pricing Page - Phase 2 Features
 *
 * Tests the enhanced pricing page with:
 * - Feature comparison table (progressive disclosure)
 * - FAQ accordion section
 * - Tier cards with visual hierarchy
 * - Mobile responsiveness
 * - Accessibility features
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { test, expect } from '@playwright/test';

test.describe('Pricing Page - Phase 2 Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
  });

  test('should display pricing tiers with correct visual hierarchy', async ({ page }) => {
    // Verify page header
    const header = page.locator('h1:has-text("Choose Your Plan")');
    await expect(header).toBeVisible();

    // Verify Free tier card
    const freeTier = page.locator('text=Free').first();
    await expect(freeTier).toBeVisible();

    const freePrice = page.locator('text=$0');
    await expect(freePrice).toBeVisible();

    const freeDescription = page.locator('text=Forever free');
    await expect(freeDescription).toBeVisible();

    // Verify Founders tier card (should be highlighted)
    const foundersTier = page.locator('text=Founders').first();
    await expect(foundersTier).toBeVisible();

    const foundersPrice = page.locator('text=$9.99');
    await expect(foundersPrice).toBeVisible();

    // Verify "Best Value" badge
    const badge = page.locator('text=/Best Value|spots left/i');
    await expect(badge).toBeVisible();

    // Verify savings display
    const savings = page.locator('text=Save 89%');
    await expect(savings).toBeVisible();

    // Verify original price strikethrough
    const originalPrice = page.locator('text=$90');
    await expect(originalPrice).toBeVisible();
  });

  test('should show feature comparison table with progressive disclosure', async ({ page }) => {
    // Verify comparison section exists
    const comparisonSection = page.locator('text=Compare Features');
    await expect(comparisonSection).toBeVisible();

    // Initially, table should be collapsed
    const table = page.locator('table');
    const tableCount = await table.count();

    // Click to expand comparison
    const expandButton = page.locator('button:has-text("Compare Features")');
    await expandButton.click();

    // Wait for animation
    await page.waitForTimeout(300);

    // Table should now be visible
    await expect(table).toBeVisible();

    // Verify table headers
    const freeHeader = page.locator('th:has-text("Free")');
    const foundersHeader = page.locator('th:has-text("Founders")');
    await expect(freeHeader).toBeVisible();
    await expect(foundersHeader).toBeVisible();

    // Verify category headers
    const collaborationCategory = page.locator('text=COLLABORATION').or(
      page.locator('text=Collaboration')
    );
    await expect(collaborationCategory).toBeVisible();

    // Verify some features are listed
    const joinPublicProjects = page.locator('text=Join public projects');
    await expect(joinPublicProjects).toBeVisible();

    const unlimitedProjects = page.locator('text=Unlimited projects');
    await expect(unlimitedProjects).toBeVisible();

    // Verify checkmarks and minus icons are present
    const checkmarks = page.locator('.lucide-check');
    const checkmarkCount = await checkmarks.count();
    expect(checkmarkCount).toBeGreaterThan(0);

    // Click to collapse
    await expandButton.click();
    await page.waitForTimeout(300);

    // Table should be hidden again
    await expect(table).not.toBeVisible();
  });

  test('should show FAQ accordion with collapsible items', async ({ page }) => {
    // Scroll to FAQ section
    const faqSection = page.locator('text=Frequently Asked Questions');
    await faqSection.scrollIntoViewIfNeeded();
    await expect(faqSection).toBeVisible();

    // Verify FAQ items exist
    const faqQuestion1 = page.locator('text=What happens when I sign up for free?');
    await expect(faqQuestion1).toBeVisible();

    const faqQuestion2 = page.locator('text=What if the Founders deal sells out?');
    await expect(faqQuestion2).toBeVisible();

    // Initially, answers should be hidden
    const answer1 = page.locator('text=You can immediately join any public project');
    await expect(answer1).not.toBeVisible();

    // Click to expand first question
    await faqQuestion1.click();
    await page.waitForTimeout(200);

    // Answer should now be visible
    await expect(answer1).toBeVisible();

    // Click second question (should close first and open second)
    await faqQuestion2.click();
    await page.waitForTimeout(200);

    // First answer should be hidden
    await expect(answer1).not.toBeVisible();

    // Second answer should be visible
    const answer2 = page.locator('text=Once all 10 Founders spots are claimed');
    await expect(answer2).toBeVisible();

    // Verify chevron rotation (accessibility indicator)
    const chevron = faqQuestion2.locator('.lucide-chevron-down');
    const transform = await chevron.getAttribute('class');
    expect(transform).toContain('rotate-180');
  });

  test('should display all CTA buttons correctly', async ({ page }) => {
    // Free tier CTA
    const freeCTA = page.locator('button:has-text("Sign Up Free")');
    await expect(freeCTA).toBeVisible();
    await expect(freeCTA).toBeEnabled();

    // Verify Free CTA styling (outline button)
    const freeStyles = await freeCTA.getAttribute('class');
    expect(freeStyles).toContain('border');

    // Founders tier CTA
    const foundersCTA = page.locator('button:has-text("Get Started - $9.99")');
    await expect(foundersCTA).toBeVisible();
    await expect(foundersCTA).toBeEnabled();

    // Verify Founders CTA styling (filled button)
    const foundersStyles = await foundersCTA.getAttribute('class');
    expect(foundersStyles).toContain('bg-blue');

    // Click Founders CTA (should show placeholder alert for now)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Stripe checkout will be integrated');
      await dialog.accept();
    });
    await foundersCTA.click();
  });

  test('should have contact support link in FAQ', async ({ page }) => {
    // Scroll to FAQ section
    const faqSection = page.locator('text=Frequently Asked Questions');
    await faqSection.scrollIntoViewIfNeeded();

    // Scroll to bottom of FAQ
    const contactSection = page.locator('text=Still have questions?');
    await contactSection.scrollIntoViewIfNeeded();
    await expect(contactSection).toBeVisible();

    // Verify contact support link
    const supportLink = page.locator('a:has-text("Contact Support")');
    await expect(supportLink).toBeVisible();

    // Verify it's a mailto link
    const href = await supportLink.getAttribute('href');
    expect(href).toContain('mailto:support@collabcanvas.app');
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Header should be visible
    const header = page.locator('h1:has-text("Choose Your Plan")');
    await expect(header).toBeVisible();

    // Pricing tiers should stack vertically on mobile
    const freeTier = page.locator('text=Free').first();
    const foundersTier = page.locator('text=Founders').first();
    await expect(freeTier).toBeVisible();
    await expect(foundersTier).toBeVisible();

    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding

    // FAQ should be visible and functional on mobile
    const faqSection = page.locator('text=Frequently Asked Questions');
    await faqSection.scrollIntoViewIfNeeded();
    await expect(faqSection).toBeVisible();

    // Test FAQ interaction on mobile
    const faqQuestion = page.locator('text=What happens when I sign up for free?');
    await faqQuestion.click();
    await page.waitForTimeout(200);

    const answer = page.locator('text=You can immediately join any public project');
    await expect(answer).toBeVisible();

    // Comparison table should be horizontally scrollable on mobile if expanded
    const expandButton = page.locator('button:has-text("Compare Features")');
    await expandButton.scrollIntoViewIfNeeded();
    await expandButton.click();
    await page.waitForTimeout(300);

    // Table container should have overflow-x-auto
    const tableContainer = page.locator('table').locator('..');
    const overflowClass = await tableContainer.getAttribute('class');
    expect(overflowClass).toContain('overflow-x-auto');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Verify ARIA labels on comparison toggle
    const comparisonButton = page.locator('button:has-text("Compare Features")');
    const ariaExpanded = await comparisonButton.getAttribute('aria-expanded');
    expect(ariaExpanded).toBe('false');

    // Click to expand
    await comparisonButton.click();
    await page.waitForTimeout(200);

    // aria-expanded should update
    const ariaExpandedAfter = await comparisonButton.getAttribute('aria-expanded');
    expect(ariaExpandedAfter).toBe('true');

    // Verify FAQ accessibility
    const faqQuestion = page.locator('text=What happens when I sign up for free?').locator('..');
    const faqAriaExpanded = await faqQuestion.getAttribute('aria-expanded');
    expect(faqAriaExpanded).toBe('false');

    await faqQuestion.click();
    await page.waitForTimeout(200);

    const faqAriaExpandedAfter = await faqQuestion.getAttribute('aria-expanded');
    expect(faqAriaExpandedAfter).toBe('true');

    // Verify aria-controls attribute links to answer
    const ariaControls = await faqQuestion.getAttribute('aria-controls');
    expect(ariaControls).toContain('faq-answer-');

    // Verify focus indicators are visible
    await faqQuestion.focus();
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should show footer CTA section', async ({ page }) => {
    // Scroll to footer CTA
    const footerCTA = page.locator('text=Ready to get started?');
    await footerCTA.scrollIntoViewIfNeeded();
    await expect(footerCTA).toBeVisible();

    // Verify CTA button in footer
    const ctaButton = page.locator('a:has-text("Choose Your Plan")');
    await expect(ctaButton).toBeVisible();

    // Verify it scrolls to pricing tiers
    const href = await ctaButton.getAttribute('href');
    expect(href).toBe('#pricing-tiers');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab to comparison button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Find focused element
    const comparisonButton = page.locator('button:has-text("Compare Features")');
    const isFocused = await comparisonButton.evaluate((el) => el === document.activeElement);

    if (isFocused) {
      // Press Enter to toggle
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Table should be visible
      const table = page.locator('table');
      await expect(table).toBeVisible();
    }

    // Continue tabbing to FAQ section
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Find first FAQ question
    const faqQuestion = page.locator('text=What happens when I sign up for free?').locator('..');
    const faqFocused = await faqQuestion.evaluate((el) => el === document.activeElement);

    if (faqFocused) {
      // Press Enter to expand
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      const answer = page.locator('text=You can immediately join any public project');
      await expect(answer).toBeVisible();
    }
  });
});
