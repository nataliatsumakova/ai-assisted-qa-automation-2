import { test, expect, type Dialog, type Page, type Locator } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${BASE_URL}/login`;
const PROGRAMS_URL = `${BASE_URL}/programs`;

const NAME_MAX = 100;

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
  await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible();
}

function programModal(page: Page): Locator {
  return page.locator('[role="dialog"]').filter({
    has: page.getByRole('textbox', { name: 'Program Name' }),
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
  await page.getByRole('button', { name: '+ New Program' }).click();
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
  if (description) {
    await expect(programRow(page, name, description)).toBeVisible();
  } else {
    await expect(programRow(page, name)).toBeVisible();
  }
}

async function confirmDeletion(page: Page, programName: string): Promise<void> {
  await goToPrograms(page);
  const dialogPromise = waitForDeleteDialog(page, programName, 'accept');
  await deleteButton(page, programName).click();
  await dialogPromise;
}

async function cancelDeletion(page: Page, programName: string): Promise<void> {
  await goToPrograms(page);
  const dialogPromise = waitForDeleteDialog(page, programName, 'dismiss');
  await deleteButton(page, programName).click();
  await dialogPromise;
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

// ---------------------------------------------------------------------------
// DS-4 Jira Acceptance Criteria — strict requirements, no bypasses
// Source: https://legionqaschool.atlassian.net/browse/DS-4
// ---------------------------------------------------------------------------

test.describe('DS-4 Jira Acceptance Criteria', () => {
  test('AC-1: confirmed deletion removes the program from the program list', async ({
    page,
  }) => {
    const programName = uniqueName('Test Program');
    const description = 'Sample program for deletion testing';

    await createProgram(page, programName, description);
    await confirmDeletion(page, programName);

    await expect(programRow(page, programName)).not.toBeVisible();
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('AC-2: canceling deletion keeps the program in the program list', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, 'Full-stack web development program');
    await cancelDeletion(page, programName);

    await expect(programRow(page, programName)).toBeVisible();
  });
});

test('TC-001: confirmed deletion removes the program from the program list', async ({
  page,
}) => {
  const programName = uniqueName('Test Program');
  const description = 'Sample program for deletion testing';

  await createProgram(page, programName, description);
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName, description)).not.toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});

test('TC-002: canceling deletion keeps the program in the program list', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';

  await createProgram(page, programName, description);
  await cancelDeletion(page, programName);

  await expect(programRow(page, programName, description)).toBeVisible();
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

test('TC-004: program list refreshes immediately after confirmed deletion', async ({
  page,
}) => {
  const programName = uniqueName('Immediate Refresh');

  await createProgram(page, programName, 'Immediate list refresh after delete');
  await confirmDeletion(page, programName);

  await expect(page).toHaveURL(/\/programs/);
  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-005: viewer cannot delete a program', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const viewerEmail = requireEnv('DIDAXIS_NON_ADMIN_EMAIL');
  const viewerPassword = requireEnv('DIDAXIS_NON_ADMIN_PASSWORD');

  await createProgram(page, programName, 'Full-stack web development program');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL((url) => url.pathname.includes('/login'));

  await login(page, viewerEmail, viewerPassword);
  await page.goto(PROGRAMS_URL);
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();

  await expect(page.getByRole('button', { name: '+ New Program' })).not.toBeVisible();
  await expect(deleteButton(page, programName)).not.toBeVisible();
  await expect(page.getByRole('button', { name: `Edit ${programName}`, exact: true })).not.toBeVisible();
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

test('TC-007: deleting a non-existent program is not possible from the UI', async ({
  page,
}) => {
  const programName = uniqueName('Missing Program');

  await goToPrograms(page);

  await expect(programRow(page, programName)).not.toBeVisible();
  await expect(deleteButton(page, programName)).not.toBeVisible();
});

test('TC-008: program is not deleted unless OK is pressed', async ({ page }) => {
  const programName = uniqueName('Data Science Fundamentals');

  await createProgram(page, programName, 'Introductory data science track');

  let dialogShown = false;
  page.once('dialog', async (dialog) => {
    dialogShown = true;
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toBe(expectedConfirmMessage(programName));
    await dialog.dismiss();
  });

  await goToPrograms(page);
  await deleteButton(page, programName).click();

  expect(dialogShown).toBe(true);
  await expect(programRow(page, programName, 'Introductory data science track')).toBeVisible();
});

test('TC-009: program with special characters in the name can be deleted after confirmation', async ({
  page,
}) => {
  const programName = uniqueName('Informatique & IA - Niveau 2');

  await createProgram(page, programName, 'Advanced informatics and AI track');
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-010: minimum-length program name (1 character) can be deleted after confirmation', async ({
  page,
}) => {
  const programName = uniqueOneCharName();
  const description = `Minimum length delete test ${Date.now()}`;

  await createProgram(page, programName, description);
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName, description)).not.toBeVisible();
});

test('TC-011: maximum-length program name (100 characters) can be deleted after confirmation', async ({
  page,
}) => {
  const programName = boundedName(NAME_MAX);

  await createProgram(page, programName, 'Maximum length delete test');
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-012: unicode program name can be deleted after confirmation', async ({ page }) => {
  const programName = uniqueName('日本語プログラム 🎓');

  await createProgram(page, programName, 'Unicode and emoji delete test');
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-013: canceling deletion of a program with special characters preserves the program', async ({
  page,
}) => {
  const programName = uniqueName('C++ & AI/ML (2026)');

  await createProgram(page, programName, 'Extended special character test');
  await cancelDeletion(page, programName);

  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-014: deleted program name can be reused for a new program', async ({ page }) => {
  const programName = uniqueName('Test Program');
  const recreatedDescription = 'Recreated after deletion';

  await createProgram(page, programName, 'Initial program for reuse test');
  await confirmDeletion(page, programName);
  await expect(programRow(page, programName)).not.toBeVisible();

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description: recreatedDescription });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, recreatedDescription)).toBeVisible();

  await confirmDeletion(page, programName);
  await expect(programRow(page, programName, recreatedDescription)).not.toBeVisible();
});

test('TC-015: double-clicking delete shows a single confirmation', async ({ page }) => {
  const programName = uniqueName('Double Click Guard');

  await createProgram(page, programName, 'Double-click delete guard');

  let dialogCount = 0;
  page.on('dialog', async (dialog) => {
    dialogCount += 1;
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toBe(expectedConfirmMessage(programName));
    await dialog.dismiss();
  });

  await goToPrograms(page);
  await deleteButton(page, programName).dblclick();
  await page.waitForTimeout(500);

  expect(dialogCount).toBe(1);
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-016: deleting a program does not remove a similarly named program', async ({
  page,
}) => {
  const stamp = Date.now();
  const targetName = `Web Development 2026 ${stamp}`;
  const siblingName = `Web Development 2026 ${stamp} extra`;

  await createProgram(page, targetName, 'Exact delete target');
  await createProgram(page, siblingName, 'Similar name sibling');

  await confirmDeletion(page, targetName);

  await expect(programRow(page, targetName)).not.toBeVisible();
  await expect(programRow(page, siblingName)).toBeVisible();
});

test('TC-017: HTML-like program name is shown literally in confirm and can be deleted', async ({
  page,
}) => {
  const programName = uniqueName('<b>DS4</b>');

  await createProgram(page, programName, 'HTML literal delete test');
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName)).not.toBeVisible();
  await expect(page.locator('td b').filter({ hasText: 'DS4' })).toHaveCount(0);
});

test('TC-018: delete icon remains usable after the program row is selected', async ({
  page,
}) => {
  const programName = uniqueName('Selected Row Delete');

  await createProgram(page, programName, 'Row select then delete');
  await goToPrograms(page);
  await programRow(page, programName).locator('td').first().click();
  await expect(page.getByText('No semesters yet')).toBeVisible();

  const dialogPromise = waitForDeleteDialog(page, programName, 'accept');
  await deleteButton(page, programName).click();
  await dialogPromise;

  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-019: confirmed deletion of a seeded program removes that row immediately', async ({
  page,
}) => {
  const programName = uniqueName('Test Program');

  await createProgram(page, programName, 'Single program delete test');
  await confirmDeletion(page, programName);

  await expect(programRow(page, programName)).not.toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
});
