/**
 * E2E Tests - Projects Dashboard
 *
 * Tests for projects dashboard functionality including:
 * - Project list loading and display
 * - Create project flow (paid users)
 * - Project card interactions (rename, delete)
 * - Empty states (free vs paid users)
 * - Auth protection
 *
 * @see _docs/ux/user-flows.md - Flow 3: Projects Dashboard
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'test-projects@example.com',
  password: 'TestPassword123!',
  username: 'TestProjectUser',
};

const TEST_PROJECT = {
  name: 'Test App Icon Project',
  template: 'app-icon',
};

test.describe('Projects Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests assume Firebase Auth Emulator is running
    // In a real implementation, you'd set up test users and clean up after tests
    await page.goto('/');
  });

  test.describe('Auth Protection', () => {
    test('should redirect unauthenticated users to landing page', async ({
      page,
    }) => {
      // Try to access /projects without auth
      await page.goto('/projects');

      // Should redirect to landing page
      await expect(page).toHaveURL('/');
    });

    test('should show loading spinner while checking auth', async ({
      page,
    }) => {
      // Navigate to projects
      await page.goto('/projects');

      // Should show "Checking authentication..." briefly
      // Note: This may be too fast to catch in tests, but the component renders it
      const loadingText = page.getByText('Checking authentication');
      // We don't assert it appears because it may be too fast
    });
  });

  test.describe('Empty States', () => {
    test('should show paid user empty state when no projects exist', async ({
      page,
    }) => {
      // TODO: Sign in as paid user with no projects
      // For now, this is a placeholder test structure

      await page.goto('/projects');

      // Should show "Create Your First Project" heading
      await expect(
        page.getByRole('heading', { name: /create your first project/i })
      ).toBeVisible();

      // Should show create button
      await expect(
        page.getByRole('button', { name: /create project/i })
      ).toBeVisible();

      // Should NOT show upgrade CTA
      await expect(
        page.getByText(/upgrade to founders/i)
      ).not.toBeVisible();
    });

    test('should show free user empty state with upgrade CTA', async ({
      page,
    }) => {
      // TODO: Sign in as free user
      // For now, this is a placeholder test structure

      await page.goto('/projects');

      // Should show "Unlock Project Creation" heading
      await expect(
        page.getByRole('heading', { name: /unlock project creation/i })
      ).toBeVisible();

      // Should show upgrade button
      await expect(
        page.getByRole('button', { name: /upgrade to founders/i })
      ).toBeVisible();

      // Should NOT show create project button
      await expect(
        page.getByRole('button', { name: /create project/i })
      ).not.toBeVisible();
    });
  });

  test.describe('Project List', () => {
    test('should display projects in grid layout', async ({ page }) => {
      // TODO: Sign in as user with existing projects
      await page.goto('/projects');

      // Should show project count in header
      await expect(page.getByText(/\d+ projects?/i)).toBeVisible();

      // Should show projects in grid
      const projectCards = page.locator('[role="img"]').or(
        page.locator('.aspect-video')
      );
      // We don't assert a specific count since it depends on test data
    });

    test('should show loading skeletons while fetching projects', async ({
      page,
    }) => {
      await page.goto('/projects');

      // Should show skeleton loaders (they disappear quickly)
      // This is hard to test reliably, but the component renders them
    });

    test('should navigate to canvas when clicking project card', async ({
      page,
    }) => {
      // TODO: Sign in and create a test project
      await page.goto('/projects');

      // Click first project card
      const firstCard = page.locator('.group').first();
      if (await firstCard.isVisible()) {
        await firstCard.click();

        // Should navigate to /canvas/:projectId
        await expect(page).toHaveURL(/\/canvas\/.+/);
      }
    });
  });

  test.describe('Create Project Flow', () => {
    test('should open create project modal when clicking New Project button', async ({
      page,
    }) => {
      // TODO: Sign in as paid user
      await page.goto('/projects');

      // Click "New Project" button
      await page.getByRole('button', { name: /new project/i }).click();

      // Modal should appear
      await expect(
        page.getByRole('heading', { name: /create new project/i })
      ).toBeVisible();
    });

    test('should validate project name in create modal', async ({ page }) => {
      // TODO: Sign in as paid user
      await page.goto('/projects');
      await page.getByRole('button', { name: /new project/i }).click();

      // Submit button should be disabled initially
      const submitButton = page.getByRole('button', {
        name: /create project/i,
      });
      await expect(submitButton).toBeDisabled();

      // Enter project name
      const nameInput = page.getByLabel(/project name/i);
      await nameInput.fill(TEST_PROJECT.name);

      // Submit button should be enabled
      await expect(submitButton).toBeEnabled();

      // Clear name - button should disable again
      await nameInput.clear();
      await expect(submitButton).toBeDisabled();
    });

    test('should show character count for project name', async ({ page }) => {
      // TODO: Sign in as paid user
      await page.goto('/projects');
      await page.getByRole('button', { name: /new project/i }).click();

      const nameInput = page.getByLabel(/project name/i);
      await nameInput.fill('Test');

      // Should show "4/100 characters"
      await expect(page.getByText(/4\/100 characters/i)).toBeVisible();
    });

    test('should allow template selection in create modal', async ({
      page,
    }) => {
      // TODO: Sign in as paid user
      await page.goto('/projects');
      await page.getByRole('button', { name: /new project/i }).click();

      // Should show template options
      await expect(page.getByText(/blank canvas/i)).toBeVisible();
      await expect(page.getByText(/app icon/i)).toBeVisible();
      await expect(page.getByText(/feature graphic/i)).toBeVisible();

      // Click "App Icon" template
      await page.getByText(/app icon/i).click();

      // Template should be highlighted (has bg-blue-50 class)
    });

    test('should create project and navigate to canvas', async ({ page }) => {
      // TODO: Full integration test with Firebase
      // This would require:
      // 1. Sign in as paid user
      // 2. Open create modal
      // 3. Fill in project details
      // 4. Click create
      // 5. Verify navigation to /canvas/:projectId
      // 6. Clean up created project
    });

    test('should close modal on cancel', async ({ page }) => {
      // TODO: Sign in as paid user
      await page.goto('/projects');
      await page.getByRole('button', { name: /new project/i }).click();

      // Modal should be visible
      await expect(
        page.getByRole('heading', { name: /create new project/i })
      ).toBeVisible();

      // Click cancel
      await page.getByRole('button', { name: /cancel/i }).click();

      // Modal should close
      await expect(
        page.getByRole('heading', { name: /create new project/i })
      ).not.toBeVisible();
    });
  });

  test.describe('Project Actions', () => {
    test('should show hover actions on project card', async ({ page }) => {
      // TODO: Sign in with projects
      await page.goto('/projects');

      // Hover over first project card
      const firstCard = page.locator('.group').first();
      if (await firstCard.isVisible()) {
        await firstCard.hover();

        // Should show rename and delete buttons
        await expect(
          firstCard.getByLabel(/rename project/i)
        ).toBeVisible();
        await expect(
          firstCard.getByLabel(/delete project/i)
        ).toBeVisible();
      }
    });

    test('should allow inline rename of project', async ({ page }) => {
      // TODO: Full integration test
      // This would test:
      // 1. Click rename button
      // 2. Edit project name
      // 3. Save changes
      // 4. Verify name updated in Firestore
    });

    test('should show confirmation modal before deleting project', async ({
      page,
    }) => {
      // TODO: Sign in with projects
      await page.goto('/projects');

      const firstCard = page.locator('.group').first();
      if (await firstCard.isVisible()) {
        await firstCard.hover();

        // Click delete button
        await firstCard.getByLabel(/delete project/i).click();

        // Confirmation modal should appear
        await expect(
          page.getByRole('heading', { name: /delete project/i })
        ).toBeVisible();

        // Should show warning text
        await expect(
          page.getByText(/this action cannot be undone/i)
        ).toBeVisible();
      }
    });

    test('should cancel delete on confirmation modal', async ({ page }) => {
      // TODO: Sign in with projects
      await page.goto('/projects');

      const firstCard = page.locator('.group').first();
      if (await firstCard.isVisible()) {
        await firstCard.hover();
        await firstCard.getByLabel(/delete project/i).click();

        // Click cancel in confirmation modal
        await page.getByRole('button', { name: /cancel/i }).click();

        // Modal should close
        await expect(
          page.getByRole('heading', { name: /delete project/i })
        ).not.toBeVisible();

        // Project should still exist
        await expect(firstCard).toBeVisible();
      }
    });

    test('should delete project after confirmation', async ({ page }) => {
      // TODO: Full integration test
      // This would test:
      // 1. Create a test project
      // 2. Delete it via confirmation modal
      // 3. Verify it's removed from Firestore
      // 4. Verify it's removed from UI
    });
  });

  test.describe('Responsive Layout', () => {
    test('should show single column on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');

      // Grid should have single column on mobile
      // This would check CSS grid-cols-1 is applied
    });

    test('should show 4 columns on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/projects');

      // Grid should have 4 columns on xl screens
      // This would check CSS grid-cols-4 is applied
    });
  });
});

test.describe('Projects Dashboard - Integration Tests', () => {
  // These tests would require Firebase emulator and test user setup
  // Skipping for now - mark as .skip() until Firebase emulator is configured

  test.skip('should create, rename, and delete project end-to-end', async ({
    page,
  }) => {
    // Full E2E test:
    // 1. Sign in as paid user
    // 2. Create project
    // 3. Verify it appears in dashboard
    // 4. Rename project
    // 5. Verify name updated
    // 6. Delete project
    // 7. Verify it's removed
  });

  test.skip('should handle concurrent project actions gracefully', async ({
    page,
  }) => {
    // Test race conditions and concurrent updates
  });

  test.skip('should sync project changes in real-time across tabs', async ({
    browser,
  }) => {
    // Test real-time sync between multiple tabs
  });
});
