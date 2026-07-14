import { config } from 'dotenv';
import { resolve } from 'path';
import { test, expect, type Page, type Locator } from '@playwright/test';

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

function editButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Edit ${programName}` });
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

async function submitSave(page: Page): Promise<void> {
  await programModal(page).getByRole('button', { name: 'Save', exact: true }).click();
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

async function openEditModal(page: Page, programName: string): Promise<void> {
  await goToPrograms(page);
  await editButton(page, programName).click();
  const modal = programModal(page);
  await expect(modal.getByLabel('Program Name')).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
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

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('TC-001: edit form opens pre-populated with current program data', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';

  await createProgram(page, programName, description);
  await openEditModal(page, programName);

  const modal = programModal(page);
  await expect(modal.getByLabel('Program Name')).toHaveValue(programName);
  await expect(modal.getByLabel('Description')).toHaveValue(description);
  await expect(modal.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
});

test('TC-002: program name update is saved and reflected in the program list', async ({
  page,
}) => {
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

test('TC-003: unchanged fields are preserved when only Description is edited', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const originalDescription = 'Full-stack web development program';
  const updatedDescription = 'Full-stack web development program — revised curriculum';

  await createProgram(page, programName, originalDescription);
  await openEditModal(page, programName);
  await fillProgramForm(page, { description: updatedDescription });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
  await expectDescriptionInEditForm(page, programName, updatedDescription);
});

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

  await expect(programModal(page).getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-007: whitespace-only Program Name is rejected on edit', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');

  await createProgram(page, programName, 'Full-stack web development program');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: '   ' });

  await expect(programModal(page).getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
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
  await expect(programRow(page, existingName)).toHaveCount(1);
  await expect(programRow(page, otherName)).toBeVisible();
});

test('TC-009: canceling edit does not persist changes', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';

  await createProgram(page, programName, description);
  await openEditModal(page, programName);
  await fillProgramForm(page, {
    name: uniqueName('Should Not Be Saved'),
    description: 'Temporary edit',
  });
  await programModal(page).getByRole('button', { name: 'Cancel', exact: true }).click();

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, description)).toBeVisible();
  await expectDescriptionInEditForm(page, programName, description);
});

test('TC-010: non-admin user cannot edit a program', async ({ page }) => {
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

  await expect(editButton(page, programName)).not.toBeVisible();
  await expect(page.getByLabel('Program Name')).not.toBeVisible();
});

test('TC-011: server/API failure does not corrupt program data', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const failedName = `${programName} - Failed Save`;

  await createProgram(page, programName, 'Full-stack web development program');

  await page.route('**/programs/**', (route) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'Internal server error' }) });
      return;
    }
    route.continue();
  });

  await openEditModal(page, programName);
  await fillProgramForm(page, { name: failedName });
  await submitSave(page);

  const errorMessage = page.getByText(/error|failed|unable|something went wrong/i);
  const modalOpen = await programModal(page).isVisible();

  expect(modalOpen || (await errorMessage.isVisible())).toBeTruthy();
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

test('TC-013: Program Name at maximum allowed length (255 characters) on edit', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const suffix = String(Date.now());
  const maxName = `${'M'.repeat(255 - suffix.length)}${suffix}`;

  await createProgram(page, programName, 'Maximum length boundary test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: maxName });
  await submitSave(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, maxName)).toBeVisible();
});

test('TC-014: Program Name exceeding maximum length is rejected on edit', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const suffix = String(Date.now());
  const overMaxName = `${'X'.repeat(256 - suffix.length)}${suffix}`;

  await createProgram(page, programName, 'Over max length test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: overMaxName });

  const saveButton = programModal(page).getByRole('button', { name: 'Save', exact: true });
  if (await saveButton.isEnabled()) {
    await saveButton.click();
  }

  const validationError = programModal(page).getByText(/too long|maximum|255|character/i);
  const modalStillOpen = await programModal(page).isVisible();

  expect(modalStillOpen || (await validationError.isVisible())).toBeTruthy();
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

test('TC-019: very long Description is handled per field limits on edit', async ({ page }) => {
  const programName = uniqueName('Cybersecurity Bootcamp');
  const longDescription = 'D'.repeat(2000);

  await createProgram(page, programName, 'Initial description');
  await openEditModal(page, programName);
  await fillProgramForm(page, { description: longDescription });
  await submitSave(page);

  const updatedRow = programRow(page, programName, longDescription);

  try {
    await expect(updatedRow).toBeVisible({ timeout: 10_000 });
    await expect(programModal(page)).not.toBeVisible();
  } catch {
    await expect(programModal(page)).toBeVisible();
    await expect(updatedRow).not.toBeVisible();
  }
});

test('TC-020: renaming to same name (case-only change) behavior is defined', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const caseChangedName = programName.toLowerCase();

  await createProgram(page, programName, 'Case sensitivity test');
  await openEditModal(page, programName);
  await fillProgramForm(page, { name: caseChangedName });
  await submitSave(page);

  const savedWithNewCase = programRow(page, caseChangedName);
  const validationError = programModal(page).getByText(/duplicate|already exists|not allowed/i);

  try {
    await expect(savedWithNewCase).toBeVisible({ timeout: 10_000 });
    await expect(programModal(page)).not.toBeVisible();
  } catch {
    expect(
      (await programModal(page).isVisible()) || (await validationError.isVisible()),
    ).toBeTruthy();
  }
});
