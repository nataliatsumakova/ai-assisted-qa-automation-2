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

async function goToPrograms(page: Page): Promise<void> {
  await page.goto(PROGRAMS_URL);
  await expect(page.getByRole('button', { name: 'New Program' })).toBeVisible();
}

async function goToProgramsPage(page: Page): Promise<void> {
  await page.goto(PROGRAMS_URL);
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
}

function programModal(page: Page): Locator {
  return page.locator('[role="dialog"]').filter({
    has: page.getByLabel('Program Name'),
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
  await page.getByRole('button', { name: 'New Program' }).click();
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
  if (description) {
    await expect(programRow(page, name, description)).toBeVisible();
  } else {
    await expect(programRow(page, name)).toBeVisible();
  }
}

async function confirmDeletion(
  page: Page,
  programName: string,
  description?: string,
): Promise<void> {
  await goToPrograms(page);
  const dialogPromise = waitForDeleteDialog(page, programName, 'accept');
  await deleteButton(page, programName, description).click();
  await dialogPromise;
}

async function cancelDeletion(
  page: Page,
  programName: string,
  description?: string,
): Promise<void> {
  await goToPrograms(page);
  const dialogPromise = waitForDeleteDialog(page, programName, 'dismiss');
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

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('TC-001: confirmed deletion removes the program from the program list', async ({ page }) => {
  const programName = uniqueName('Test Program');
  const description = 'Sample program for deletion testing';

  await createProgram(page, programName, description);
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName)).not.toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
});

test('TC-002: canceling deletion keeps the program in the program list', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');

  await createProgram(page, programName, 'Full-stack web development program');
  await cancelDeletion(page, programName);

  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-003: deleting one program does not affect other programs in the list', async ({
  page,
}) => {
  const targetName = uniqueName('Test Program');
  const otherNameOne = uniqueName('Web Development 2026');
  const otherNameTwo = uniqueName('Cloud Computing 2026');

  await createProgram(page, targetName, 'Primary delete target');
  await createProgram(page, otherNameOne, 'Secondary program one');
  await createProgram(page, otherNameTwo, 'Secondary program two');

  await expect(programRow(page, targetName)).toBeVisible();
  await expect(programRow(page, otherNameOne)).toBeVisible();
  await expect(programRow(page, otherNameTwo)).toBeVisible();

  await confirmDeletion(page, targetName);

  await expect(programRow(page, targetName)).not.toBeVisible();
  await expect(programRow(page, otherNameOne)).toBeVisible();
  await expect(programRow(page, otherNameTwo)).toBeVisible();
});

test('TC-004: program is not deleted without confirming the dialog', async ({ page }) => {
  const programName = uniqueName('Data Science Fundamentals');

  await createProgram(page, programName, 'Introductory data science track');

  let dialogShown = false;
  page.once('dialog', async (dialog) => {
    dialogShown = true;
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain(programName);
    await dialog.dismiss();
  });

  await goToPrograms(page);
  await deleteButton(page, programName, 'Introductory data science track').click();

  expect(dialogShown).toBe(true);
  await expect(programRow(page, programName, 'Introductory data science track')).toBeVisible();
});

test('TC-005: non-admin user cannot delete a program', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const nonAdminEmail = process.env.DIDAXIS_NON_ADMIN_EMAIL;
  const nonAdminPassword = process.env.DIDAXIS_NON_ADMIN_PASSWORD;

  test.skip(
    !nonAdminEmail || !nonAdminPassword,
    'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run this test',
  );

  await createProgram(page, programName, 'Full-stack web development program');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL((url) => url.pathname.includes('/login'));

  await page.getByLabel('Email').fill(nonAdminEmail!);
  await page.getByLabel('Password').fill(nonAdminPassword!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
  await goToProgramsPage(page);

  const deleteBtn = deleteButton(page, programName, 'Full-stack web development program');
  if (await deleteBtn.isVisible()) {
    const dialogPromise = waitForDeleteDialog(page, programName, 'accept');
    await deleteBtn.click();
    await dialogPromise;
  }

  await expect(programRow(page, programName, 'Full-stack web development program')).toBeVisible();
});

test('TC-006: canceling deletion does not show the program as deleted', async ({ page }) => {
  const programName = uniqueName('Cloud Computing 2026');
  const description = 'Cloud infrastructure and services program';

  await createProgram(page, programName, description);
  await cancelDeletion(page, programName);

  await expect(programRow(page, programName, description)).toBeVisible();
  await expect(page.getByText(/deleted|removed successfully/i)).not.toBeVisible();
});

test('TC-007: deleting a non-existent program is not possible from the UI', async ({ page }) => {
  const programName = uniqueName('Test Program');

  await goToProgramsPage(page);

  await expect(programRow(page, programName)).not.toBeVisible();
  await expect(deleteButton(page, programName)).not.toBeVisible();
});

test('TC-008: program with special characters in the name can be deleted after confirmation', async ({
  page,
}) => {
  const programName = uniqueName('Informatique & IA - Niveau 2');

  await createProgram(page, programName, 'Advanced informatics and AI track');
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-009: minimum-length program name (1 character) can be deleted after confirmation', async ({
  page,
}) => {
  const programName = 'A';
  const description = `Minimum length delete test ${Date.now()}`;

  await goToPrograms(page);
  if (await programRow(page, programName, description).count()) {
    await deleteProgram(page, programName, description);
  }

  await createProgram(page, programName, description);
  await deleteProgram(page, programName, description);
});

test('TC-010: maximum-length program name (255 characters) can be deleted after confirmation', async ({
  page,
}) => {
  const suffix = String(Date.now());
  const programName = `${'M'.repeat(255 - suffix.length)}${suffix}`;

  await createProgram(page, programName, 'Maximum length delete test');
  await deleteProgram(page, programName);
});

test('TC-011: unicode program name can be deleted after confirmation', async ({ page }) => {
  const programName = uniqueName('日本語プログラム 🎓');

  await createProgram(page, programName, 'Unicode and emoji delete test');
  await deleteProgram(page, programName);
});

test('TC-012: canceling deletion of a program with special characters preserves the program', async ({
  page,
}) => {
  const programName = uniqueName('C++ & AI/ML (2026)');

  await createProgram(page, programName, 'Extended special character test');
  await cancelDeletion(page, programName);

  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-013: deleting the only program in the list leaves an empty program list', async ({
  page,
}) => {
  const programName = uniqueName('Test Program');

  await createProgram(page, programName, 'Single program delete test');
  await deleteProgram(page, programName);

  await expect(programRow(page, programName)).not.toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
});

test('TC-014: deleted program name can be reused for a new program', async ({ page }) => {
  const programName = uniqueName('Test Program');
  const recreatedDescription = 'Recreated after deletion';

  await createProgram(page, programName, 'Initial program for reuse test');
  await deleteProgram(page, programName);

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description: recreatedDescription });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, recreatedDescription)).toBeVisible();

  await deleteProgram(page, programName);
});
