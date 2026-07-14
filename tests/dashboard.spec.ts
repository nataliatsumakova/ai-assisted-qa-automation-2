import { test, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../page-objects/dashboard.page';

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${BASE_URL}/login`;

function requireEnv(name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set in the environment`);
  }
  return value;
}

async function login(page: Page): Promise<void> {
  await page.goto(LOGIN_URL);
  await page.getByLabel('Email').fill(requireEnv('DIDAXIS_EMAIL'));
  await page.getByLabel('Password').fill(requireEnv('DIDAXIS_PASSWORD'));
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays all dashboard components', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    await expect(dashboard.logo).toBeVisible();
    await expect(dashboard.brandName).toBeVisible();
    await expect(dashboard.dashboardNav).toBeVisible();
    await expect(dashboard.programsNav).toBeVisible();
    await expect(dashboard.userAvatar).toBeVisible();
    await expect(dashboard.userName).toBeVisible();
    await expect(dashboard.userOrg).toBeVisible();
    await expect(dashboard.signOut).toBeVisible();

    await expect(dashboard.programsCount).toHaveText(/^\d+$/);
    await expect(dashboard.calendarAction).toHaveText('View');
    await expect(dashboard.validationAction).toHaveText('Check');
    await expect(dashboard.aiAssistAction).toHaveText('Open');

    await expect(dashboard.quickStartHeading).toBeVisible();
    await expect(dashboard.quickStartInstructions).toContainText(
      '1. Create a Program',
    );
    await expect(dashboard.connectionBadge).toHaveText(
      /Connected|Disconnected/i,
    );
  });

  test('action cards navigate to the correct pages', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.openProgramsViaCard();
    await expect(page).toHaveURL(/\/programs/);

    await dashboard.goto();
    await dashboard.openCalendarViaCard();
    await expect(page).toHaveURL(/\/calendar/);

    await dashboard.goto();
    await dashboard.openValidationViaCard();
    await expect(page).toHaveURL(/\/validation/);
  });
});
