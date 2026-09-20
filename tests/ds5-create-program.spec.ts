import { test, expect, type Dialog, type Page, type Locator } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${BASE_URL}/login`;
const PROGRAMS_URL = `${BASE_URL}/programs`;

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const EMPTY_STATE_COPY = 'No programs yet. Create your first program to get started.';

function uniqueName(base: string): string {
  return `${base} ${Date.now()}`;
}

function uniqueOneCharName(): string {
  return String.fromCharCode(0x4e00 + (Date.now() % 20992));
}

function boundedName(length: number, prefix = 'M'): string {
  const suffix = String(Date.now());
  if (suffix.length >= length) {
    return suffix.slice(0, length);
  }
  return `${prefix.repeat(length - suffix.length)}${suffix}`;
}

function boundedDescription(length: number): string {
  const suffix = String(Date.now());
  const prefix = 'This program covers enterprise architecture patterns, microservices, and cloud-native delivery. ';
  const filler = 'D'.repeat(Math.max(0, length - prefix.length - suffix.length));
  return `${prefix}${filler}${suffix}`.slice(0, length);
}

function requireEnv(
  name:
    | 'DIDAXIS_EMAIL'
    | 'DIDAXIS_PASSWORD'
    | 'DIDAXIS_NON_ADMIN_EMAIL'
    | 'DIDAXIS_NON_ADMIN_PASSWORD',
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set in the environment`);
  }
  return value;
}

function expectedConfirmMessage(programName: string): string {
  return `Delete program "${programName}"? All its semesters and courses will be removed. This cannot be undone.`;
}

async function login(page: Page, email?: string, password?: string): Promise<void> {
  await page.goto(LOGIN_URL);
  await page.getByRole('textbox', { name: 'Email' }).fill(email ?? requireEnv('DIDAXIS_EMAIL'));
  await page.getByRole('textbox', { name: 'Password' }).fill(password ?? requireEnv('DIDAXIS_PASSWORD'));
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
}

async function goToPrograms(page: Page): Promise<void> {
  await page.goto(PROGRAMS_URL);
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
  await expect(page.getByText('Manage academic programs and semesters')).toBeVisible();
}

function newProgramButton(page: Page): Locator {
  return page.getByRole('button', { name: '+ New Program' });
}

function emptyStateCopy(page: Page): Locator {
  return page.getByText(EMPTY_STATE_COPY);
}

function createProgramEmptyStateButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Create Program', exact: true });
}

function programModal(page: Page): Locator {
  return page.locator('[role="dialog"]').filter({
    has: page.getByRole('textbox', { name: 'Program Name' }),
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

function programNameCell(page: Page, name: string): Locator {
  return programRow(page, name).locator('td').first().locator('p').first();
}

function programDescriptionCell(page: Page, name: string): Locator {
  return programRow(page, name).locator('td').first().locator('p').nth(1);
}

function deleteButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Delete ${programName}`, exact: true });
}

function waitForDeleteDialog(
  page: Page,
  programName: string,
  action: 'accept' | 'dismiss',
): Promise<Dialog> {
  return new Promise((resolve, reject) => {
    page.once('dialog', async (dialog) => {
      try {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toBe(expectedConfirmMessage(programName));

        if (action === 'accept') {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }

        resolve(dialog);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function openNewProgramModal(page: Page): Promise<void> {
  await goToPrograms(page);
  await expect(newProgramButton(page)).toBeVisible();
  await newProgramButton(page).click();
  await expect(programModal(page).getByRole('heading', { name: 'New Program' })).toBeVisible();
  await expect(programModal(page).getByRole('textbox', { name: 'Program Name' })).toBeVisible();
}

async function fillProgramForm(
  page: Page,
  options: { name?: string; description?: string },
): Promise<void> {
  const modal = programModal(page);
  if (options.name !== undefined) {
    await modal.getByRole('textbox', { name: 'Program Name' }).fill(options.name);
  }
  if (options.description !== undefined) {
    await modal.getByRole('textbox', { name: 'Description' }).fill(options.description);
  }
}

async function submitCreate(page: Page): Promise<void> {
  await programModal(page).getByRole('button', { name: 'Create', exact: true }).click();
}

async function createProgram(page: Page, name: string, description = ''): Promise<void> {
  await openNewProgramModal(page);
  await fillProgramForm(page, { name, description });
  await submitCreate(page);
  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, name, description || undefined)).toBeVisible();
}

async function confirmDeletion(page: Page, programName: string): Promise<void> {
  const dialogPromise = waitForDeleteDialog(page, programName, 'accept');
  await deleteButton(page, programName).click();
  await dialogPromise;
}

async function mockEmptyProgramList(page: Page): Promise<void> {
  await page.route('**/api/programs', async (route) => {
    const pathOnly = route.request().url().split('?')[0].replace(/\/$/, '');
    const isListGet = route.request().method() === 'GET' && pathOnly.endsWith('/api/programs');
    if (!isListGet) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });
}

async function expectEmptyState(page: Page): Promise<void> {
  await expect(emptyStateCopy(page)).toBeVisible();
  await expect(createProgramEmptyStateButton(page)).toBeVisible();
  await expect(page.locator('main').getByText('🎓')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(newProgramButton(page)).toBeVisible();
}

async function expectNoEmptyState(page: Page): Promise<void> {
  await expect(emptyStateCopy(page)).toHaveCount(0);
  await expect(createProgramEmptyStateButton(page)).toHaveCount(0);
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Program' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('DS-5 Jira Acceptance Criteria', () => {
  test('AC-1: program list displays each program name and description', async ({ page }) => {
    const webDevName = uniqueName('Web Development 2026');
    const cloudName = uniqueName('Cloud Computing 2026');
    const webDevDescription = 'Full-stack web development program';
    const cloudDescription = 'Cloud infrastructure and services program';

    await createProgram(page, webDevName, webDevDescription);
    await createProgram(page, cloudName, cloudDescription);
    await goToPrograms(page);

    await expect(programNameCell(page, webDevName)).toHaveText(webDevName);
    await expect(programDescriptionCell(page, webDevName)).toHaveText(webDevDescription);
    await expect(programNameCell(page, cloudName)).toHaveText(cloudName);
    await expect(programDescriptionCell(page, cloudName)).toHaveText(cloudDescription);
    await expectNoEmptyState(page);
  });

  test('AC-2: empty state is shown when no programs exist', async ({ page }) => {
    await mockEmptyProgramList(page);
    await goToPrograms(page);
    await expectEmptyState(page);
  });
});

test('TC-001: program list displays each program name and description', async ({ page }) => {
  const webDevName = uniqueName('Web Development 2026');
  const cloudName = uniqueName('Cloud Computing 2026');
  const webDevDescription = 'Full-stack web development program';
  const cloudDescription = 'Cloud infrastructure and services program';

  await createProgram(page, webDevName, webDevDescription);
  await createProgram(page, cloudName, cloudDescription);
  await goToPrograms(page);

  await expect(programRow(page, webDevName, webDevDescription)).toBeVisible();
  await expect(programRow(page, cloudName, cloudDescription)).toBeVisible();
  await expect(programNameCell(page, webDevName)).toHaveText(webDevName);
  await expect(programDescriptionCell(page, webDevName)).toHaveText(webDevDescription);
  await expect(programDataRows(page)).not.toHaveCount(0);
});

test('TC-002: empty state message and first-program prompt are shown when no programs exist', async ({
  page,
}) => {
  await mockEmptyProgramList(page);
  await goToPrograms(page);

  await expectEmptyState(page);
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
  await expect(page.getByText('Select a program to manage semesters')).toHaveCount(0);
});

test('TC-003: newly created program is displayed correctly in the list', async ({ page }) => {
  const programName = uniqueName('Test Program');
  const description = 'Sample program for deletion testing';

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programDataRows(page).filter({ hasText: programName })).toHaveCount(1);
  await expect(programRow(page, programName, description)).toBeVisible();
  await expectNoEmptyState(page);
});

test('TC-004: newly created program appears in the list without manual refresh', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';

  await goToPrograms(page);
  await newProgramButton(page).click();
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(page).toHaveURL(/\/programs/);
  await expect(programRow(page, programName, description)).toBeVisible();
  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expectNoEmptyState(page);
});

test('TC-005: empty-state copy is not shown when programs exist', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programRow(page, programName, description)).toBeVisible();
  await expectNoEmptyState(page);
  await expect(page.getByText('Select a program to manage semesters')).toBeVisible();
});

test('TC-006: Programs page has no search or filter controls', async ({ page }) => {
  await goToPrograms(page);

  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(page.getByPlaceholder(/search|filter|find/i)).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: /search|filter|find/i })).toHaveCount(0);
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await expect(page.getByRole('table')).toBeVisible();
});

test('TC-007: program description is not hidden when description exists', async ({ page }) => {
  const programName = uniqueName('Cloud Computing 2026');
  const description = 'Cloud infrastructure and services program';

  await createProgram(page, programName, description);
  await goToPrograms(page);

  const row = programRow(page, programName, description);
  await expect(row).toBeVisible();
  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
  await expect(programDescriptionCell(page, programName)).toBeVisible();
});

test('TC-008: deleted program does not remain visible in the list', async ({ page }) => {
  const testProgramName = uniqueName('Test Program');
  const webDevName = uniqueName('Web Development 2026');

  await createProgram(page, testProgramName, 'Sample program for deletion testing');
  await createProgram(page, webDevName, 'Full-stack web development program');
  await goToPrograms(page);

  await confirmDeletion(page, testProgramName);

  await expect(programRow(page, testProgramName)).toHaveCount(0);
  await expect(programRow(page, webDevName, 'Full-stack web development program')).toBeVisible();
  await expectNoEmptyState(page);
});

test('TC-009: program with empty Description is listed with name only', async ({ page }) => {
  const programName = uniqueName('Data Science Fundamentals');

  await createProgram(page, programName);
  await goToPrograms(page);

  const row = programRow(page, programName);
  await expect(row).toBeVisible();
  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveCount(0);
  await expect(row.getByText(/—|N\/A|no description|placeholder/i)).toHaveCount(0);
});

test('TC-010: program name with special characters displays exactly as stored', async ({
  page,
}) => {
  const programName = uniqueName('Informatique & IA - Niveau 2');
  const description = 'Advanced informatics and AI track';

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
  await expect(page.getByText('&amp;')).toHaveCount(0);
});

test('TC-011: program name with extended special characters displays correctly', async ({
  page,
}) => {
  const programName = uniqueName('C++ & AI/ML (2026)');
  const description = 'Advanced C++ and machine learning curriculum';

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
});

test('TC-012: program name with Unicode and emoji displays correctly', async ({ page }) => {
  const programName = uniqueName('日本語プログラム 🎓');
  const description = 'Japanese-language academic program';

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
  await expect(page.getByText(/&#x1F393;|&#127891;/)).toHaveCount(0);
});

test('TC-013: minimum-length program name displays correctly in the list', async ({ page }) => {
  const programName = uniqueOneCharName();
  const description = `Single-character name boundary test ${Date.now()}`;

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programRow(page, programName, description)).toBeVisible();
  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
});

test('TC-014: max-length program name and description display in the list', async ({ page }) => {
  const programName = boundedName(NAME_MAX);
  const description = boundedDescription(DESCRIPTION_MAX);

  expect(programName.length).toBe(NAME_MAX);
  expect(description.length).toBe(DESCRIPTION_MAX);

  await createProgram(page, programName, description);
  await goToPrograms(page);

  const row = programRow(page, programName, description);
  await expect(row).toBeVisible();
  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
  await expect(page.getByRole('table')).toBeVisible();
});

test('TC-015: multiple programs with similar names are displayed as separate distinct entries', async ({
  page,
}) => {
  const baseName = uniqueName('Web Development 2026');
  const updatedName = `${baseName} - Updated`;
  const baseDescription = 'Full-stack web development program';
  const updatedDescription = 'Full-stack web development program — revised curriculum';

  await createProgram(page, baseName, baseDescription);
  await createProgram(page, updatedName, updatedDescription);
  await goToPrograms(page);

  await expect(programRow(page, baseName, baseDescription)).toBeVisible();
  await expect(programRow(page, updatedName, updatedDescription)).toBeVisible();
  await expect(programRow(page, baseName)).toHaveCount(1);
  await expect(programRow(page, updatedName)).toHaveCount(1);
});

test('TC-016: empty state appears when the program list is empty after the last program is gone', async ({
  page,
}) => {
  await mockEmptyProgramList(page);
  await goToPrograms(page);

  await expectEmptyState(page);
  await expect(createProgramEmptyStateButton(page)).toBeVisible();
  await expect(newProgramButton(page)).toBeVisible();
});

test('TC-017: HTML-like program name displays as literal text', async ({ page }) => {
  const programName = uniqueName('<b>DS5</b>');
  const description = 'HTML literal test';

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
  await expect(programRow(page, programName).locator('b')).toHaveCount(0);
});

test('TC-018: case-variant program names display as separate list entries', async ({ page }) => {
  const stamp = Date.now();
  const lowerName = `finance + accounting ${stamp}`;
  const titleName = `Finance + Accounting ${stamp}`;

  await createProgram(page, lowerName, 'Case-variant lowercase');
  await createProgram(page, titleName, 'Case-variant title case');
  await goToPrograms(page);

  await expect(programRow(page, lowerName, 'Case-variant lowercase')).toBeVisible();
  await expect(programRow(page, titleName, 'Case-variant title case')).toBeVisible();
});

test('TC-019: viewer can see program name and description in the list', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';
  const viewerEmail = requireEnv('DIDAXIS_NON_ADMIN_EMAIL');
  const viewerPassword = requireEnv('DIDAXIS_NON_ADMIN_PASSWORD');

  await createProgram(page, programName, description);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL((url) => url.pathname.includes('/login'));
  await login(page, viewerEmail, viewerPassword);
  await goToPrograms(page);

  await expect(programRow(page, programName, description)).toBeVisible();
  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
  await expect(newProgramButton(page)).toHaveCount(0);
});

test('TC-020: selecting a program row keeps name and description visible', async ({ page }) => {
  const programName = uniqueName('Selected Row Display');
  const description = 'Row select must not hide list details';

  await createProgram(page, programName, description);
  await goToPrograms(page);

  await programNameCell(page, programName).click();

  await expect(page).toHaveURL(/\/programs/);
  await expect(programNameCell(page, programName)).toHaveText(programName);
  await expect(programDescriptionCell(page, programName)).toHaveText(description);
  await expect(page.getByText('Semesters & scheduling config')).toBeVisible();
  await expect(page.getByText('No semesters yet')).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Semester' })).toBeVisible();
  await expect(page.getByText('Select a program to manage semesters')).toHaveCount(0);
});
