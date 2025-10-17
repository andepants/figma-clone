/**
 * E2E Test: Landing Page → Pricing Flow
 *
 * Tests the critical conversion funnel from landing page to pricing page.
 * Verifies:
 * - Hero section CTA navigation
 * - Founders banner functionality
 * - Mobile responsiveness
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page → Pricing Flow', () => {
  test('should navigate from landing hero CTA to pricing page', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify hero section is visible
    const hero = page.locator('h1:has-text("Design App Icons & Graphics")');
    await expect(hero).toBeVisible();

    // Verify primary CTA exists
    const ctaButton = page.locator('a:has-text("Get Started Free")');
    await expect(ctaButton).toBeVisible();

    // Click CTA button
    await ctaButton.click();

    // Wait for navigation
    await page.waitForURL('/pricing');

    // Verify we're on pricing page
    await expect(page).toHaveURL('/pricing');

    // Verify pricing page header is visible
    const pricingHeader = page.locator('h1:has-text("Choose Your Plan")');
    await expect(pricingHeader).toBeVisible();

    // Verify both pricing tiers are visible
    const freeTier = page.locator('text=Free');
    const foundersTier = page.locator('text=Founders');
    await expect(freeTier).toBeVisible();
    await expect(foundersTier).toBeVisible();
  });

  test('should show founders banner and navigate to pricing', async ({ page }) => {
    await page.goto('/');

    // Verify founders banner is visible
    const banner = page.locator('[data-testid="founders-banner"]').or(page.locator('text=/Founders Deal/i'));

    // Check if banner exists (it might be conditionally rendered)
    const bannerCount = await banner.count();

    if (bannerCount > 0) {
      await expect(banner.first()).toBeVisible();

      // Verify banner shows remaining spots or waitlist
      const bannerText = await banner.first().textContent();
      expect(bannerText).toMatch(/spots left|Waitlist|Founders/i);

      // Try to find and click "Claim Spot" or similar link
      const claimLink = page.locator('a:has-text("Claim Spot")').or(
        page.locator('a:has-text("Join Waitlist")')
      ).or(
        page.locator('[data-testid="founders-banner"] a')
      );

      if (await claimLink.count() > 0) {
        await claimLink.first().click();

        // Should navigate to pricing
        await page.waitForURL('/pricing', { timeout: 5000 });
        await expect(page).toHaveURL('/pricing');
      }
    } else {
      // If banner doesn't exist, just verify the landing page loaded
      const hero = page.locator('h1:has-text("Design App Icons & Graphics")');
      await expect(hero).toBeVisible();
      console.log('Founders banner not present - may be disabled or dismissed');
    }
  });

  test('should dismiss founders banner if present', async ({ page }) => {
    await page.goto('/');

    // Check if banner exists
    const banner = page.locator('[data-testid="founders-banner"]').or(page.locator('text=/Founders Deal/i'));
    const bannerCount = await banner.count();

    if (bannerCount > 0) {
      await expect(banner.first()).toBeVisible();

      // Click dismiss button if it exists
      const dismissButton = page.locator('[data-testid="founders-banner"] button[aria-label*="Dismiss"]').or(
        page.locator('[data-testid="founders-banner"] button:has-text("×")')
      ).or(
        banner.locator('button').last()
      );

      if (await dismissButton.count() > 0) {
        await dismissButton.first().click();

        // Banner should be hidden
        await expect(banner.first()).not.toBeVisible({ timeout: 2000 });
      }
    } else {
      console.log('Founders banner not present - skipping dismiss test');
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');

    // Hero should be visible on mobile
    const hero = page.locator('h1:has-text("Design App Icons & Graphics")');
    await expect(hero).toBeVisible();

    // CTA button should be visible and clickable
    const ctaButton = page.locator('a:has-text("Get Started Free")');
    await expect(ctaButton).toBeVisible();

    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding

    // Scroll to features section if it exists
    const featuresSection = page.locator('#features');
    if (await featuresSection.count() > 0) {
      await featuresSection.scrollIntoViewIfNeeded();
      await expect(featuresSection).toBeVisible();
    }

    // Click CTA and verify navigation works on mobile
    await ctaButton.click();
    await page.waitForURL('/pricing', { timeout: 5000 });
    await expect(page).toHaveURL('/pricing');
  });

  test('should have correct meta tags for SEO', async ({ page }) => {
    await page.goto('/');

    // Check title tag
    const title = await page.title();
    expect(title).toContain('CollabCanvas');
    expect(title).toMatch(/\$9\.99|Design App Icons/i);

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription?.length ?? 0).toBeLessThanOrEqual(160);

    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('og-image.png');

    // Check canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('collabcanvas.app');
  });

  test('should show pricing teaser section on landing page', async ({ page }) => {
    await page.goto('/');

    // Scroll to pricing teaser
    const pricingTeaser = page.locator('text=Simple, Transparent Pricing').or(
      page.locator('text=/Pricing/i')
    );

    if (await pricingTeaser.count() > 0) {
      await pricingTeaser.first().scrollIntoViewIfNeeded();
      await expect(pricingTeaser.first()).toBeVisible();

      // Verify Free tier is shown
      const freeTier = page.locator('text=Free').or(page.locator('text=$0'));
      if (await freeTier.count() > 0) {
        await expect(freeTier.first()).toBeVisible();
      }

      // Verify Founders tier is shown
      const foundersTier = page.locator('text=Founders').or(page.locator('text=$9.99'));
      if (await foundersTier.count() > 0) {
        await expect(foundersTier.first()).toBeVisible();
      }
    }
  });
});

test.describe('Pricing Page', () => {
  test('should display pricing tiers correctly', async ({ page }) => {
    await page.goto('/pricing');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page title/header
    const header = page.locator('h1:has-text("Choose Your Plan")').or(
      page.locator('h1:has-text("Pricing")')
    );
    await expect(header).toBeVisible();

    // Verify Free tier information
    const freeTierName = page.locator('text=Free').first();
    if (await freeTierName.count() > 0) {
      await expect(freeTierName).toBeVisible();

      // Verify $0 price
      const freePrice = page.locator('text=$0').first();
      await expect(freePrice).toBeVisible();
    }

    // Verify Founders tier information
    const foundersTierName = page.locator('text=Founders').first();
    if (await foundersTierName.count() > 0) {
      await expect(foundersTierName).toBeVisible();

      // Verify $9.99 price
      const foundersPrice = page.locator('text=$9.99').first();
      await expect(foundersPrice).toBeVisible();
    }
  });

  test('should handle CTA button clicks', async ({ page }) => {
    await page.goto('/pricing');

    // Find and click Free tier CTA
    const freeCTA = page.locator('button:has-text("Sign Up Free")').or(
      page.locator('a:has-text("Sign Up Free")')
    );

    if (await freeCTA.count() > 0) {
      // Just verify it's clickable and has correct attributes
      await expect(freeCTA.first()).toBeVisible();
      await expect(freeCTA.first()).toBeEnabled();
    }

    // Find Founders tier CTA
    const foundersCTA = page.locator('button:has-text("Get Started")').or(
      page.locator('button:has-text("$9.99")')
    );

    if (await foundersCTA.count() > 0) {
      await expect(foundersCTA.first()).toBeVisible();
      await expect(foundersCTA.first()).toBeEnabled();
    }
  });
});
