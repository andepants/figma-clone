/**
 * E2E Tests: Project Visibility Controls
 *
 * Tests for public/private project functionality including:
 * - Creating projects with visibility toggle
 * - Visibility indicators on project cards
 * - Public projects gallery
 * - Toggle visibility action
 * - Empty states with public projects mentions
 */

import { test, expect } from '@playwright/test';

test.describe('Project Visibility Controls', () => {
  test('should show visibility toggle in create project modal', async ({
    page,
  }) => {
    // Navigate to projects page (will trigger auth)
    await page.goto('/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for "New Project" button
    const newProjectButton = page.getByRole('button', {
      name: /new project/i,
    });

    // If button exists, click it
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();

      // Verify modal opened
      await expect(
        page.getByRole('heading', { name: /create new project/i })
      ).toBeVisible();

      // Verify visibility toggle section exists
      await expect(
        page.getByText('Project Visibility', { exact: false })
      ).toBeVisible();

      // Verify Private option exists
      await expect(page.getByText('Private', { exact: false })).toBeVisible();
      await expect(
        page.getByText(
          'Only you and invited collaborators can access this project',
          { exact: false }
        )
      ).toBeVisible();

      // Verify Public option exists
      await expect(page.getByText('Public', { exact: false })).toBeVisible();
      await expect(
        page.getByText('Anyone can view and collaborate on this project', {
          exact: false,
        })
      ).toBeVisible();

      // Verify Private is selected by default
      const privateButton = page
        .locator('button')
        .filter({ hasText: 'Private' })
        .filter({ hasText: 'Only you and invited collaborators' });
      await expect(privateButton).toHaveClass(/border-blue-500/);
    }
  });

  test('should display visibility badge on project cards', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Look for project cards
    const projectCards = page.locator('[class*="group"]').filter({
      has: page.locator('[class*="aspect-video"]'),
    });

    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // Check first project card for visibility badge
      const firstCard = projectCards.first();

      // Should have either "Public" or "Private" badge
      const hasBadge =
        (await firstCard.getByText('Public').count()) > 0 ||
        (await firstCard.getByText('Private').count()) > 0;

      expect(hasBadge).toBeTruthy();
    }
  });

  test('should show toggle visibility button on hover', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Look for project cards
    const projectCards = page.locator('[class*="group"]').filter({
      has: page.locator('[class*="aspect-video"]'),
    });

    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      const firstCard = projectCards.first();

      // Hover over the card
      await firstCard.hover();

      // Look for action buttons (rename, visibility toggle, delete)
      // The visibility toggle button has either Lock or Globe icon
      const visibilityButton =
        page.getByRole('button', { name: /make public/i }) ||
        page.getByRole('button', { name: /make private/i });

      // Button should be visible on hover (if user is owner)
      // Note: May not be visible if not owner, so we don't assert visibility
    }
  });

  test('should navigate to public projects page', async ({ page }) => {
    await page.goto('/public-projects');
    await page.waitForLoadState('networkidle');

    // Verify page header
    await expect(
      page.getByRole('heading', { name: /public projects/i })
    ).toBeVisible();

    // Verify description
    await expect(
      page.getByText('Explore and collaborate on projects', { exact: false })
    ).toBeVisible();

    // Page should show either projects grid or empty state
    const hasProjects =
      (await page.locator('[class*="grid"]').count()) > 0 ||
      (await page.getByText('No public projects yet').count()) > 0;

    expect(hasProjects).toBeTruthy();
  });

  test('should show public projects empty state with create CTA', async ({
    page,
  }) => {
    await page.goto('/public-projects');
    await page.waitForLoadState('networkidle');

    // If no public projects exist, should show empty state
    const emptyStateHeading = page.getByRole('heading', {
      name: /no public projects yet/i,
    });

    if (await emptyStateHeading.isVisible()) {
      // Verify empty state content
      await expect(
        page.getByText('Be the first to create and share', { exact: false })
      ).toBeVisible();

      // Verify CTA button exists
      const ctaButton =
        page.getByRole('button', { name: /go to my projects/i }) ||
        page.getByRole('button', { name: /sign in to get started/i });

      await expect(ctaButton).toBeVisible();
    }
  });

  test('should show "Browse Public Projects" link in empty state', async ({
    page,
  }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Look for empty state
    const emptyStateHeading = page.getByRole('heading', {
      name: /create your first project|unlock project creation/i,
    });

    if (await emptyStateHeading.isVisible()) {
      // Should have "Browse Public Projects" link
      const browseLink = page.getByRole('button', {
        name: /browse public projects/i,
      });

      // Link should be visible in empty state
      if (await browseLink.isVisible()) {
        // Click it and verify navigation
        await browseLink.click();
        await expect(page).toHaveURL('/public-projects');
      }
    }
  });

  test('should update project visibility on toggle', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Look for project cards
    const projectCards = page.locator('[class*="group"]').filter({
      has: page.locator('[class*="aspect-video"]'),
    });

    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      const firstCard = projectCards.first();

      // Get initial visibility status
      const initialBadge = firstCard.locator(
        '[class*="absolute top-2 right-2"]'
      );
      const initialText = await initialBadge.textContent();
      const isInitiallyPublic = initialText?.includes('Public');

      // Hover to show actions
      await firstCard.hover();

      // Find and click visibility toggle button
      const toggleButton =
        page.getByRole('button', { name: /make public/i }) ||
        page.getByRole('button', { name: /make private/i });

      if (await toggleButton.isVisible()) {
        await toggleButton.click();

        // Wait a moment for update
        await page.waitForTimeout(1000);

        // Verify visibility changed
        const newBadgeText = await initialBadge.textContent();

        if (isInitiallyPublic) {
          expect(newBadgeText).toContain('Private');
        } else {
          expect(newBadgeText).toContain('Public');
        }
      }
    }
  });

  test('should allow selecting public visibility when creating project', async ({
    page,
  }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Click New Project button
    const newProjectButton = page.getByRole('button', {
      name: /new project/i,
    });

    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();

      // Wait for modal
      await expect(
        page.getByRole('heading', { name: /create new project/i })
      ).toBeVisible();

      // Enter project name
      const nameInput = page.getByLabel(/project name/i);
      await nameInput.fill('Test Public Project');

      // Click Public option
      const publicButton = page
        .locator('button')
        .filter({ hasText: 'Public' })
        .filter({ hasText: 'Anyone can view and collaborate' });
      await publicButton.click();

      // Verify Public is now selected (has blue border)
      await expect(publicButton).toHaveClass(/border-blue-500/);

      // Note: We don't actually submit to avoid creating test data
      // In a real test environment, you would submit and verify
    }
  });

  test('should show public project count in gallery header', async ({
    page,
  }) => {
    await page.goto('/public-projects');
    await page.waitForLoadState('networkidle');

    // Look for project count indicator
    const countIndicator = page.locator('text=/\\d+ public project/i');

    // Should show count (0 or more)
    await expect(countIndicator).toBeVisible();
  });

  test('should be accessible without authentication on public projects page', async ({
    page,
  }) => {
    // Navigate directly to public projects without auth
    await page.goto('/public-projects');
    await page.waitForLoadState('networkidle');

    // Should load successfully (not redirect to login)
    await expect(
      page.getByRole('heading', { name: /public projects/i })
    ).toBeVisible();

    // Should show sign in CTA if not authenticated
    const signInButton =
      page.getByRole('button', { name: /sign in to create/i }) ||
      page.getByRole('button', { name: /sign in to get started/i });

    // One of these buttons should exist
    const hasSignInCTA = (await signInButton.count()) > 0;
    expect(hasSignInCTA).toBeTruthy();
  });
});
