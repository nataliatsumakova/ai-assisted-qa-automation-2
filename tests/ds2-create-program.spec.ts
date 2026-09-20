import { test, expect, type Page, type Locator } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${BASE_URL}/login`;
const PROGRAMS_URL = `${BASE_URL}/programs`;

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

function uniqueName(base: string): string {
  return `${base} ${Date.now()}`;
}

function requireEnv(
  name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD' | 'DIDAXIS_NON_ADMIN_EMAIL' | 'DIDAXIS_NON_ADMIN_PASSWORD',
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set in the environment`);
  }
  return value;
}

async function login(page: Page, email?: string, password?: string): Promise<void> {
  await page.goto(LOGIN_URL);
  await page.getByLabel('Email').fill(email ?? requireEnv('DIDAXIS_EMAIL'));
  await page.getByLabel('Password').fill(password ?? requireEnv('DIDAXIS_PASSWORD'));
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
    has: page.getByLabel('Program Name'),
  });
}

function saveButton(page: Page): Locator {
  return programModal(page).getByRole('button', { name: 'Save', exact: true });
}

function createButton(page: Page): Locator {
  return programModal(page).getByRole('button', { name: 'Create', exact: true });
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

function editButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Edit ${programName}` });
}

async function openNewProgramModal(page: Page): Promise<void> {
  await goToPrograms(page);
  await page.getByRole('button', { name: '+ New Program' }).click();
  await expect(programModal(page).getByRole('heading', { name: 'New Program' })).toBeVisible();
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
  await createButton(page).click();
}

async function submitSave(page: Page): Promise<void> {
  await saveButton(page).click();
}

async function createProgram(page: Page, name: string, description = ''): Promise<void> {
  await openNewProgramModal(page);
  await fillProgramForm(page, { name, description });
  await submitCreate(page);
  await expect(programModal(page)).not.toBeVisible();
  if (description) {
    await expect(programRow(page, name, description).first()).toBeVisible();
  } else {
    await expect(programRow(page, name).first()).toBeVisible();
  }
}

async function openEditModal(page: Page, programName: string): Promise<void> {
  await goToPrograms(page);
  await editButton(page, programName).first().click();
  const modal = programModal(page);
  await expect(modal.getByRole('heading', { name: 'Edit Program' })).toBeVisible();
  await expect(modal.getByLabel('Program Name')).toBeVisible();
  await expect(saveButton(page)).toBeVisible();
}

async function expectDescriptionInEditForm(
  page: Page,
  programName: string,
  expectedDescription: string,
): Promise<void> {
  await openEditModal(page, programName);
  await expect(programModal(page).getByLabel('Description')).toHaveValue(expectedDescription);
  await programModal(page).getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(programModal(page)).not.toBeVisible();
}

function boundedName(length: number, prefix = 'N'): string {
  const suffix = String(Date.now());
  if (suffix.length >= length) {
    return suffix.slice(0, length);
  }
  return `${prefix.repeat(length - suffix.length)}${suffix}`;
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

// ---------------------------------------------------------------------------
// DS-2 Jira Acceptance Criteria — strict requirements, no bypasses
// Source: https://legionqaschool.atlassian.net/browse/DS-2
// ---------------------------------------------------------------------------

test.describe('DS-2 Jira Acceptance Criteria', () => {
  test('AC-1: Open program for editing', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';

    await createProgram(page, programName, description);
    await openEditModal(page, programName);

    const modal = programModal(page);
    await expect(modal.getByRole('heading', { name: 'Edit Program' })).toBeVisible();
    await expect(modal.getByLabel('Program Name')).toHaveValue(programName);
    await expect(modal.getByLabel('Description')).toHaveValue(description);
    await expect(saveButton(page)).toBeVisible();
    await expect(saveButton(page)).toBeEnabled();
    await expect(modal.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Show AI Generation Config/ })).toBeVisible();
  });

  test('AC-2: Successfully edit a program name', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedName = `${programName} - Updated`;

    await createProgram(page, programName, 'Full-stack web development program');
    await openEditModal(page, programName);
    await fillProgramForm(page, { name: updatedName });
    await submitSave(page);

    await expect(programModal(page)).not.toBeVisible();
    await expect(programRow(page, updatedName)).toBeVisible();
    await expect(programRow(page, programName)).not.toBeVisible();
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('AC-3: Edit preserves unchanged fields', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const originalDescription = 'Full-stack web development program';
    const updatedDescription = 'Full-stack web development program — revised curriculum';

    await createProgram(page, programName, originalDescription);
    await openEditModal(page, programName);

    const modal = programModal(page);
    await expect(modal.getByLabel('Default Session Hours')).toHaveValue('4');
    await expect(modal.getByLabel('Default Exam Hours')).toHaveValue('3');

    await fillProgramForm(page, { description: updatedDescription });
    await submitSave(page);

    await expect(programModal(page)).not.toBeVisible();
    await expect(programRow(page, programName)).toBeVisible();

    await openEditModal(page, programName);
    await expect(programModal(page).getByLabel('Program Name')).toHaveValue(programName);
    await expect(programModal(page).getByLabel('Description')).toHaveValue(updatedDescription);
    await expect(programModal(page).getByLabel('Default Session Hours')).toHaveValue('4');
    await expect(programModal(page).getByLabel('Default Exam Hours')).toHaveValue('3');
  });
});

// ---------------------------------------------------------------------------
// Extended coverage — Confluence Program Setup specs; failures indicate bugs
// ---------------------------------------------------------------------------

test('TC-004: description-only edit succeeds with Program Name unchanged', async ({ page }) => {
  const programName = uniqueName('Data Science Fundamentals');
  const description = 'Introductory data science track';

  await createProgram(page, programName);
  await openEditModal(page, programName);
  await fillProgramForm(page, { description });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
  await expectDescriptionInEditForm(page, programName, description);
});

test('TC-005: save with no changes keeps program data unchanged', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';

  await createProgram(page, programName, description);
  await openEditModal(page, programName);
  await expect(saveButton(page)).toBeEnabled();
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, description)).toBeVisible();
  await expectDescriptionInEditForm(page, programName, description);
});

test('TC-006: empty Program Name prevents save', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');

  await createProgram(page, programName, 'Full-stack web development program');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: '' });

  await expect(saveButton(page)).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-007: whitespace-only Program Name is rejected on edit', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');

  await createProgram(page, programName, 'Full-stack web development program');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: '   ' });

  const save = saveButton(page);
  if (await save.isEnabled()) {
    await save.click();
  }

  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-008: duplicate Program Name is not allowed on edit', async ({ page }) => {
  const existingName = uniqueName('Web Development 2026');
  const otherName = uniqueName('Cloud Computing 2026');

  await createProgram(page, existingName, 'Existing program');
  await createProgram(page, otherName, 'Other program');

  await openEditModal(page, otherName);
  await fillProgramForm(page, { name: existingName });
  await submitSave(page);

  await expect(programModal(page)).toBeVisible();
  await expect(page.getByText(/duplicate|already exists|not allowed|unique/i)).toBeVisible();
  await expect(programRow(page, existingName)).toHaveCount(1);
  await expect(programRow(page, otherName)).toBeVisible();
});

test('TC-009: canceling edit does not persist changes', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';
  const discardedName = uniqueName('Should Not Be Saved');

  await createProgram(page, programName, description);
  await openEditModal(page, programName);
  await fillProgramForm(page, {
    name: discardedName,
    description: 'Temporary edit',
  });
  await programModal(page).getByRole('button', { name: 'Cancel', exact: true }).click();

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, description)).toBeVisible();
  await expect(programRow(page, discardedName)).not.toBeVisible();
  await expectDescriptionInEditForm(page, programName, description);
});

test('TC-010: viewer cannot edit a program', async ({ page }) => {
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

  await login(page, nonAdminEmail, nonAdminPassword);
  await page.goto(PROGRAMS_URL);
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();

  await expect(editButton(page, programName)).not.toBeVisible();
  await expect(page.getByLabel('Program Name')).not.toBeVisible();
});

test('TC-011: server/API failure does not corrupt program data', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const failedName = `${programName} - Failed Save`;

  await createProgram(page, programName, 'Full-stack web development program');

  await page.route('**/api/programs/**', (route) => {
    const method = route.request().method();
    if (method === 'PUT' || method === 'PATCH') {
      void route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' }),
      });
      return;
    }
    void route.continue();
  });

  await openEditModal(page, programName);
  await fillProgramForm(page, { name: failedName });
  await submitSave(page);

  await expect(page.getByText(/error|failed|unable|something went wrong/i)).toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
  await expect(programRow(page, failedName)).not.toBeVisible();
});

test('TC-012: Program Name at minimum valid length (1 character) on edit', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = `Minimum length test ${Date.now()}`;
  const newName = 'A';

  await createProgram(page, programName, description);
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: newName });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, newName, description)).toBeVisible();
});

test('TC-013: Program Name at maximum allowed length (100 characters) on edit', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const maxName = boundedName(NAME_MAX, 'M');

  await createProgram(page, programName, 'Maximum length boundary test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: maxName });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, maxName)).toBeVisible();
});

test('TC-014: Program Name exceeding maximum length (101 characters) is rejected on edit', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const overMaxName = boundedName(NAME_MAX + 1, 'X');

  await createProgram(page, programName, 'Over max length test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: overMaxName });

  if (await saveButton(page).isEnabled()) {
    await saveButton(page).click();
  }

  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, overMaxName)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-015: special characters in Program Name are handled correctly on edit', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const specialName = uniqueName('C++ & AI/ML (2026)');

  await createProgram(page, programName, 'Special characters test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: specialName });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, specialName)).toBeVisible();
});

test('TC-016: Unicode and emoji in Program Name are handled correctly on edit', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const unicodeName = uniqueName('日本語プログラム 🎓');

  await createProgram(page, programName, 'Unicode and emoji test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: unicodeName });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, unicodeName)).toBeVisible();
});

test('TC-017: leading and trailing spaces in Program Name are trimmed on edit', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const trimmedName = uniqueName('Cloud Computing 2026');
  const paddedName = `  ${trimmedName}  `;

  await createProgram(page, programName, 'Trim whitespace test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: paddedName });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, trimmedName)).toBeVisible();
});

test('TC-018: Description can be cleared on edit', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';

  await createProgram(page, programName, description);
  await openEditModal(page, programName);
  await fillProgramForm(page, { description: '' });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
  await expectDescriptionInEditForm(page, programName, '');
});

test('TC-019: Description at maximum allowed length (500 characters) is accepted on edit', async ({
  page,
}) => {
  const programName = uniqueName('Cybersecurity Bootcamp');
  const longDescription = 'D'.repeat(DESCRIPTION_MAX);

  await createProgram(page, programName, 'Initial description');
  await openEditModal(page, programName);
  await fillProgramForm(page, { description: longDescription });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expectDescriptionInEditForm(page, programName, longDescription);
});

test('TC-020: Description exceeding maximum length (501 characters) is rejected on edit', async ({
  page,
}) => {
  const programName = uniqueName('Cybersecurity Bootcamp');
  const originalDescription = 'Initial description';
  const overMaxDescription = 'D'.repeat(DESCRIPTION_MAX + 1);

  await createProgram(page, programName, originalDescription);
  await openEditModal(page, programName);
  await fillProgramForm(page, { description: overMaxDescription });
  if (await saveButton(page).isEnabled()) {
    await saveButton(page).click();
  }

  await expect(programModal(page)).toBeVisible();
  await programModal(page).getByRole('button', { name: 'Cancel', exact: true }).click();
  await expectDescriptionInEditForm(page, programName, originalDescription);
});

test('TC-021: case-only Program Name change on the same program is saved', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const caseChangedName = programName.toLowerCase();

  await createProgram(page, programName, 'Case sensitivity test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: caseChangedName });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, caseChangedName)).toHaveCount(1);
});

test('TC-022: double-clicking Save updates the program only once', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const updatedName = uniqueName('Double Click Guard');

  await createProgram(page, programName, 'Double-click save test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: updatedName });
  await saveButton(page).dblclick();
  await page.waitForTimeout(1500);

  await expect(programRow(page, updatedName)).toHaveCount(1);
});

test('TC-023: closing edit modal via X or Escape does not persist changes', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const discardedName = uniqueName('Unsaved Via X');

  await createProgram(page, programName, 'Full-stack web development program');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: discardedName });
  await page.keyboard.press('Escape');

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, discardedName)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-024: HTML in Program Name is stored as literal text', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const htmlName = uniqueName('<b>DS2</b>');

  await createProgram(page, programName, 'HTML literal test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: htmlName });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, htmlName)).toBeVisible();
  await expect(page.locator('td b').filter({ hasText: 'DS2' })).toHaveCount(0);
});

test('TC-025: renaming to another program name with different casing is rejected', async ({
  page,
}) => {
  const existingName = uniqueName('Alpha Track');
  const otherName = uniqueName('Beta Track');

  await createProgram(page, existingName, 'Existing program');
  await createProgram(page, otherName, 'Other program');

  await openEditModal(page, otherName);
  await fillProgramForm(page, { name: existingName.toLowerCase() });
  await submitSave(page);

  await expect(programModal(page)).toBeVisible();
  await expect(page.getByText(/duplicate|already exists|not allowed|unique/i)).toBeVisible();
  await expect(programRow(page, otherName)).toBeVisible();
  await expect(programRow(page, existingName)).toHaveCount(1);
});

test('TC-026: clicking the program row does not open the edit modal', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');

  await createProgram(page, programName, 'Row click vs edit');
  await goToPrograms(page);
  await programRow(page, programName).locator('td').first().click();

  await expect(programModal(page)).not.toBeVisible();
  await expect(page.getByText('Select a program to manage semesters')).not.toBeVisible();
});
