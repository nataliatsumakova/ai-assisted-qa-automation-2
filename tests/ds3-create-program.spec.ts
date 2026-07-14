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

function duplicateNameError(page: Page): Locator {
  return page.getByText(/duplicate|already exists|not allowed/i);
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

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('TC-001: program with special characters in name is created successfully', async ({
  page,
}) => {
  const programName = uniqueName('Informatique & IA - Niveau 2');
  const description = 'Advanced informatics and AI track';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, description)).toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
});

test('TC-002: valid program name with leading and trailing spaces is trimmed and saved', async ({
  page,
}) => {
  const trimmedName = uniqueName('Cloud Computing 2026');
  const programName = `  ${trimmedName}  `;
  const description = 'Cloud infrastructure and services program';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, trimmedName, description)).toBeVisible();
  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-003: minimum-length Program Name (1 character) is accepted', async ({ page }) => {
  const programName = 'A';
  const description = `Single-character name boundary test ${Date.now()}`;

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, description)).toBeVisible();
});

test('TC-004: whitespace-only Program Name is rejected and form is not submitted', async ({
  page,
}) => {
  const description = `Full-stack web development program ${Date.now()}`;

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: '   ', description });

  const createButton = programModal(page).getByRole('button', { name: 'Create', exact: true });
  await expect(createButton).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, description)).not.toBeVisible();
});

test('TC-005: duplicate Program Name is rejected with an error message', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const duplicateDescription = `Duplicate attempt for existing program ${Date.now()}`;

  await createProgram(page, programName, 'Initial program');

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description: duplicateDescription });
  await submitCreate(page);

  await expect(programModal(page)).toBeVisible();
  await expect(duplicateNameError(page)).toBeVisible();
  await expect(programRow(page, programName)).toHaveCount(1);
});

test('TC-006: empty Program Name prevents program creation', async ({ page }) => {
  const description = `Full-stack web development program ${Date.now()}`;

  await openNewProgramModal(page);
  await fillProgramForm(page, { description });

  const createButton = programModal(page).getByRole('button', { name: 'Create', exact: true });
  await expect(createButton).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, description)).not.toBeVisible();
});

test('TC-007: duplicate name with different casing is rejected', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const caseVariantName = programName.toLowerCase();
  const description = `Case-variant duplicate attempt ${Date.now()}`;

  await createProgram(page, programName, 'Existing program');

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: caseVariantName, description });
  await submitCreate(page);

  await expect(programModal(page)).toBeVisible();
  await expect(duplicateNameError(page)).toBeVisible();
  await expect(programRow(page, programName)).toHaveCount(1);
});

test('TC-008: duplicate name with extra surrounding whitespace is rejected after trim', async ({
  page,
}) => {
  const programName = uniqueName('Web Development 2026');
  const paddedName = `  ${programName}  `;
  const description = `Whitespace-padded duplicate attempt ${Date.now()}`;

  await createProgram(page, programName, 'Existing program');

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: paddedName, description });
  await submitCreate(page);

  await expect(programModal(page)).toBeVisible();
  await expect(duplicateNameError(page)).toBeVisible();
  await expect(programRow(page, programName)).toHaveCount(1);
});

test('TC-009: Program Name at maximum allowed length (255 characters) is accepted', async ({
  page,
}) => {
  const suffix = String(Date.now());
  const programName = `${'M'.repeat(255 - suffix.length)}${suffix}`;
  const description = 'Maximum length boundary test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-010: Program Name exceeding maximum length (256 characters) is rejected', async ({
  page,
}) => {
  const suffix = String(Date.now());
  const programName = `${'X'.repeat(256 - suffix.length)}${suffix}`;
  const description = 'Over max length test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });

  const createButton = programModal(page).getByRole('button', { name: 'Create', exact: true });
  if (await createButton.isEnabled()) {
    await createButton.click();
  }

  const validationError = programModal(page).getByText(/too long|maximum|255|character/i);
  const modalStillOpen = await programModal(page).isVisible();

  expect(modalStillOpen || (await validationError.isVisible())).toBeTruthy();
  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-011: tab and newline-only Program Name is rejected as empty', async ({ page }) => {
  const description = `Whitespace variant test ${Date.now()}`;

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: '\t\n  \t', description });

  const createButton = programModal(page).getByRole('button', { name: 'Create', exact: true });
  await expect(createButton).toBeDisabled();

  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, description)).not.toBeVisible();
});

test('TC-012: Unicode and emoji in Program Name are accepted', async ({ page }) => {
  const programName = uniqueName('日本語プログラム 🎓');
  const description = 'Unicode and emoji support test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, description)).toBeVisible();
});

test('TC-013: Program Name with additional special characters is accepted', async ({ page }) => {
  const programName = uniqueName('C++ & AI/ML (2026)');
  const description = 'Extended special character test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, description)).toBeVisible();
});
