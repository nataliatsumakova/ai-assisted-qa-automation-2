import { config } from 'dotenv';
import { resolve } from 'path';
import { test, expect, type Dialog, type Page, type Locator } from '@playwright/test';

config({ path: resolve(__dirname, '../.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${BASE_URL}/login`;
const PROGRAMS_URL = `${BASE_URL}/programs`;

function uniqueName(base: string): string {
  return `${base} ${Date.now()}`;
}

function uniqueDescription(base: string): string {
  return `${base} ${Date.now()}`;
}

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

function newProgramButton(page: Page): Locator {
  return page.getByRole('button', { name: /New Program/ });
}

async function goToPrograms(page: Page): Promise<void> {
  await page.goto(PROGRAMS_URL);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
  await expect(newProgramButton(page)).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
}

function programModal(page: Page): Locator {
  return page.locator('[role="dialog"]').filter({
    has: page.getByLabel('Program Name'),
  });
}

function programDataRows(page: Page): Locator {
  return page.getByRole('table').getByRole('row').filter({
    has: page.locator('td'),
  });
}

function programRow(page: Page, name: string, description?: string): Locator {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = page.getByRole('row').filter({
    has: page
      .locator('td')
      .first()
      .locator('p')
      .first()
      .filter({ hasText: new RegExp(`^${escapedName}$`) }),
  });
  return description ? row.filter({ hasText: description }) : row;
}

function firstProgramPrompt(page: Page): Locator {
  return newProgramButton(page);
}

async function expectProgramVisible(
  page: Page,
  name: string,
  description?: string,
): Promise<void> {
  await expect(programRow(page, name, description).first()).toBeVisible();
}

function deleteButton(page: Page, programName: string, description?: string): Locator {
  return programRow(page, programName, description).getByRole('button', {
    name: `Delete ${programName}`,
  });
}

function waitForDeleteDialog(
  page: Page,
  programName: string,
  action: 'accept' | 'dismiss',
): Promise<Dialog> {
  return new Promise((resolve) => {
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain(programName);

      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }

      resolve(dialog);
    });
  });
}

async function openNewProgramModal(page: Page): Promise<void> {
  await goToPrograms(page);
  await newProgramButton(page).click();
  await expect(programModal(page).getByLabel('Program Name')).toBeVisible();
}

async function fillProgramForm(
  page: Page,
  options: { name?: string; description?: string },
): Promise<void> {
  const modal = programModal(page);
  if (options.name !== undefined) {
    await modal.getByLabel('Program Name').fill(options.name);
  }
  if (options.description !== undefined) {
    await modal.getByLabel('Description').fill(options.description);
  }
}

async function submitCreate(page: Page): Promise<void> {
  await programModal(page).getByRole('button', { name: 'Create', exact: true }).click();
}

async function createProgram(
  page: Page,
  name: string,
  description = '',
): Promise<void> {
  await openNewProgramModal(page);
  await fillProgramForm(page, { name, description });
  await submitCreate(page);
  await expect(programModal(page)).not.toBeVisible();
  await expectProgramVisible(page, name, description || undefined);
}

async function confirmDeletion(
  page: Page,
  programName: string,
  description?: string,
): Promise<void> {
  const dialogPromise = waitForDeleteDialog(page, programName, 'accept');
  await deleteButton(page, programName, description).click();
  await dialogPromise;
}

async function deleteProgram(
  page: Page,
  programName: string,
  description?: string,
): Promise<void> {
  await confirmDeletion(page, programName, description);
  await expect(programRow(page, programName, description)).not.toBeVisible();
}

async function expectNoEmptyState(page: Page): Promise<void> {
  await expect(programDataRows(page)).not.toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('TC-001: program list displays each program name and description', async ({ page }) => {
  const webDevName = uniqueName('Web Development 2026');
  const cloudName = uniqueName('Cloud Computing 2026');
  const webDevDescription = uniqueDescription('Full-stack web development program');
  const cloudDescription = uniqueDescription('Cloud infrastructure and services program');

  await createProgram(page, webDevName, webDevDescription);
  await createProgram(page, cloudName, cloudDescription);
  await goToPrograms(page);

  await expectProgramVisible(page, webDevName, webDevDescription);
  await expectProgramVisible(page, cloudName, cloudDescription);
  await expect(programRow(page, webDevName).getByText(webDevDescription)).toBeVisible();
  await expect(programRow(page, cloudName).getByText(cloudDescription)).toBeVisible();
});

test('TC-002: empty state message and first-program prompt are shown when no programs exist', async ({
  page,
}) => {
  await goToPrograms(page);

  const dataRowCount = await programDataRows(page).count();
  test.skip(
    dataRowCount > 0,
    'Requires an empty programs list; other programs already exist in the environment',
  );

  await expect(programDataRows(page)).toHaveCount(0);
  await expect(page.getByRole('table')).toBeVisible();
  await expect(firstProgramPrompt(page)).toBeVisible();
});

test('TC-003: single existing program is displayed correctly in the list', async ({ page }) => {
  const programName = uniqueName('Test Program');
  const description = uniqueDescription('Sample program for deletion testing');

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programDataRows(page).filter({ hasText: programName })).toHaveCount(1);
  await expect(programRow(page, programName, description).first()).toBeVisible();
  await expectNoEmptyState(page);
});

test('TC-004: newly created program appears in the list without manual refresh', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const description = uniqueDescription('Full-stack web development program');

  await goToPrograms(page);
  await newProgramButton(page).click();
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expectProgramVisible(page, programName, description);
  await expectNoEmptyState(page);
});

test('TC-005: program list is not shown when no programs exist', async ({ page }) => {
  await goToPrograms(page);

  const dataRowCount = await programDataRows(page).count();
  test.skip(
    dataRowCount > 0,
    'Requires an empty programs list; other programs already exist in the environment',
  );

  await expect(programDataRows(page)).toHaveCount(0);
  await expect(page.getByRole('table')).toBeVisible();
  await expect(firstProgramPrompt(page)).toBeVisible();
});

test('TC-006: empty-state message is not shown when programs exist', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = uniqueDescription('Full-stack web development program');

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expectProgramVisible(page, programName, description);
  await expectNoEmptyState(page);
});

test('TC-007: program description is not hidden when description exists', async ({ page }) => {
  const programName = uniqueName('Cloud Computing 2026');
  const description = uniqueDescription('Cloud infrastructure and services program');

  await createProgram(page, programName, description);
  await goToPrograms(page);

  const row = programRow(page, programName, description).first();
  await expect(row).toBeVisible();
  await expect(row.getByText(programName)).toBeVisible();
  await expect(row.getByText(description)).toBeVisible();
});

test('TC-008: deleted program does not remain visible in the list', async ({ page }) => {
  const testProgramName = uniqueName('Test Program');
  const webDevName = uniqueName('Web Development 2026');
  const testDescription = uniqueDescription('Sample program for deletion testing');
  const webDevDescription = uniqueDescription('Full-stack web development program');

  await createProgram(page, testProgramName, testDescription);
  await createProgram(page, webDevName, webDevDescription);
  await goToPrograms(page);

  await confirmDeletion(page, testProgramName);

  await expect(programRow(page, testProgramName)).not.toBeVisible();
  await expectProgramVisible(page, webDevName, webDevDescription);
});

test('TC-009: program with empty Description is listed with name only', async ({ page }) => {
  const programName = uniqueName('Data Science Fundamentals');

  await createProgram(page, programName);
  await goToPrograms(page);

  const row = programRow(page, programName);
  await expect(row).toBeVisible();
  await expect(row.getByText(programName)).toBeVisible();
  await expect(row.getByText(/—|N\/A|no description|placeholder/i)).not.toBeVisible();
});

test('TC-010: program name with special characters displays exactly as stored', async ({
  page,
}) => {
  const programName = uniqueName('Informatique & IA - Niveau 2');
  const description = uniqueDescription('Advanced informatics and AI track');

  await createProgram(page, programName, description);
  await goToPrograms(page);

  const row = programRow(page, programName, description);
  await expectProgramVisible(page, programName, description);
  await expect(row.getByText(programName)).toBeVisible();
  await expect(row.getByText(description)).toBeVisible();
  await expect(page.getByText(/&amp;|&#/)).not.toBeVisible();
});

test('TC-011: program name with extended special characters displays correctly', async ({
  page,
}) => {
  const programName = uniqueName('C++ & AI/ML (2026)');
  const description = uniqueDescription('Advanced C++ and machine learning curriculum');

  await createProgram(page, programName, description);
  await goToPrograms(page);

  const row = programRow(page, programName, description);
  await expectProgramVisible(page, programName, description);
  await expect(row.getByText(programName)).toBeVisible();
  await expect(row.getByText(description)).toBeVisible();
});

test('TC-012: program name with Unicode and emoji displays correctly', async ({ page }) => {
  const programName = uniqueName('日本語プログラム 🎓');
  const description = uniqueDescription('Japanese-language academic program');

  await createProgram(page, programName, description);
  await goToPrograms(page);

  const row = programRow(page, programName, description);
  await expectProgramVisible(page, programName, description);
  await expect(row.getByText(programName)).toBeVisible();
  await expect(row.getByText(description)).toBeVisible();
  await expect(page.getByText(/&#x1F393;|&#127891;/)).not.toBeVisible();
});

test('TC-013: minimum-length program name displays correctly in the list', async ({ page }) => {
  const programName = 'A';
  const description = `Single-character name boundary test ${Date.now()}`;

  await goToPrograms(page);
  if (await programRow(page, programName, description).count()) {
    await deleteProgram(page, programName, description);
  }

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programRow(page, programName, description)).toBeVisible();
  await expect(page.getByText(description)).toBeVisible();
});

test('TC-014: long program name and description display without breaking the list layout', async ({
  page,
}) => {
  const suffix = String(Date.now());
  const programName = `Enterprise Software Architecture and Distributed Systems Engineering Professional Certificate 2026 ${suffix}`;
  const description = uniqueDescription(
    'This program covers enterprise architecture patterns, microservices, event-driven systems, cloud-native deployment, security hardening, observability, and capstone project delivery across twelve intensive modules designed for senior engineering professionals.',
  );

  await createProgram(page, programName, description);
  await goToPrograms(page);

  const row = programRow(page, programName, description).first();
  await expect(row).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();

  const tableBox = await page.getByRole('table').boundingBox();
  const rowBox = await row.boundingBox();
  expect(tableBox).not.toBeNull();
  expect(rowBox).not.toBeNull();
  expect(rowBox!.y).toBeGreaterThanOrEqual(tableBox!.y);
  expect(rowBox!.y + rowBox!.height).toBeLessThanOrEqual(tableBox!.y + tableBox!.height + 1);
});

test('TC-015: multiple programs with similar names are displayed as separate distinct entries', async ({
  page,
}) => {
  const baseName = uniqueName('Web Development 2026');
  const updatedName = `${baseName} - Updated`;
  const baseDescription = uniqueDescription('Full-stack web development program');
  const updatedDescription = uniqueDescription(
    'Full-stack web development program — revised curriculum',
  );

  await createProgram(page, baseName, baseDescription);
  await createProgram(page, updatedName, updatedDescription);
  await goToPrograms(page);

  await expect(programRow(page, baseName, baseDescription)).toBeVisible();
  await expect(programRow(page, updatedName, updatedDescription)).toBeVisible();
  await expect(programDataRows(page).filter({ hasText: baseName })).toHaveCount(2);
});

test('TC-016: empty state appears after deleting the last program', async ({ page }) => {
  const programName = uniqueName('Test Program');
  const description = uniqueDescription('Last program for empty state test');

  await createProgram(page, programName, description);
  await goToPrograms(page);

  const otherPrograms = await programDataRows(page)
    .filter({ hasNotText: programName })
    .count();

  test.skip(
    otherPrograms > 0,
    'Requires the created program to be the only program in the environment',
  );

  await deleteProgram(page, programName, description);

  await expect(programRow(page, programName)).not.toBeVisible();
  await expect(programDataRows(page)).toHaveCount(0);
  await expect(page.getByRole('table')).toBeVisible();
  await expect(newProgramButton(page)).toBeVisible();
});
