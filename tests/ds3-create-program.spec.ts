import { test, expect, type Page, type Locator } from '@playwright/test';
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

function requireEnv(name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set in the environment`);
  }
  return value;
}

async function login(page: Page): Promise<void> {
  await page.goto(LOGIN_URL);
  await page.getByRole('textbox', { name: 'Email' }).fill(requireEnv('DIDAXIS_EMAIL'));
  await page.getByRole('textbox', { name: 'Password' }).fill(requireEnv('DIDAXIS_PASSWORD'));
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

function duplicateNameError(page: Page): Locator {
  return programModal(page).getByText(/duplicate|already exists|not allowed|unique/i);
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
  await createButton(page).click();
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

test.beforeEach(async ({ page }) => {
  await login(page);
});

// ---------------------------------------------------------------------------
// DS-3 Jira Acceptance Criteria — strict requirements, no bypasses
// Source: https://legionqaschool.atlassian.net/browse/DS-3
// ---------------------------------------------------------------------------

test.describe('DS-3 Jira Acceptance Criteria', () => {
  test('AC-1: Reject program name with only whitespace', async ({ page }) => {
    await openNewProgramModal(page);
    await fillProgramForm(page, {
      name: '   ',
      description: 'Full-stack web development program',
    });

    await expect(createButton(page)).toBeDisabled();
    await expect(programModal(page)).toBeVisible();
    await expect(programModal(page).getByRole('heading', { name: 'New Program' })).toBeVisible();
  });

  test('AC-2: Accept program name with special characters', async ({ page }) => {
    const programName = uniqueName('Informatique & IA - Niveau 2');
    const description = 'Advanced informatics and AI track';

    await openNewProgramModal(page);
    await fillProgramForm(page, { name: programName, description });
    await submitCreate(page);

    await expect(programModal(page)).not.toBeVisible();
    await expect(programRow(page, programName, description)).toBeVisible();
  });

  test('AC-3: Reject duplicate program name', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, 'Initial program');

    await openNewProgramModal(page);
    await fillProgramForm(page, {
      name: programName,
      description: 'Duplicate attempt for existing program',
    });
    await submitCreate(page);

    await expect(programModal(page)).toBeVisible();
    await expect(duplicateNameError(page)).toBeVisible();
    await expect(programRow(page, programName)).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// Extended coverage — Confluence Program Setup specs; failures indicate bugs
// ---------------------------------------------------------------------------

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
  await expect(programModal(page).getByRole('alert')).toHaveCount(0);
});

test('TC-002: valid program name with leading and trailing spaces is trimmed and saved', async ({
  page,
}) => {
  const trimmedName = uniqueName('Cloud Computing 2026');
  const programName = `  ${trimmedName}  `;
  const description = 'Cloud infrastructure and services program';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await expect(createButton(page)).toBeEnabled();
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, trimmedName, description)).toBeVisible();
  await expect(programRow(page, programName)).toHaveCount(0);
});

test('TC-003: minimum-length Program Name (1 character) is accepted', async ({ page }) => {
  const programName = uniqueOneCharName();
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

  await expect(createButton(page)).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, description)).toHaveCount(0);
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
  await expect(programRow(page, programName, duplicateDescription)).toHaveCount(0);
});

test('TC-006: empty Program Name prevents program creation', async ({ page }) => {
  const description = `Full-stack web development program ${Date.now()}`;

  await openNewProgramModal(page);
  await fillProgramForm(page, { description });

  await expect(programModal(page).getByRole('textbox', { name: 'Program Name' })).toHaveValue('');
  await expect(createButton(page)).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, description)).toHaveCount(0);
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
  await expect(programRow(page, caseVariantName)).toHaveCount(0);
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

test('TC-009: Program Name at maximum allowed length (100 characters) is accepted', async ({
  page,
}) => {
  const programName = boundedName(NAME_MAX, 'M');
  const description = 'Maximum length boundary test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-010: Program Name exceeding maximum length (101 characters) is rejected', async ({
  page,
}) => {
  const programName = boundedName(NAME_MAX + 1, 'X');
  const description = 'Over max length test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });

  if (await createButton(page).isEnabled()) {
    await createButton(page).click();
  }

  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, programName)).toHaveCount(0);
});

test('TC-011: tab and newline-only Program Name is rejected as empty', async ({ page }) => {
  const description = `Whitespace variant test ${Date.now()}`;

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: '\t\n  \t', description });

  await expect(createButton(page)).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, description)).toHaveCount(0);
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

test('TC-014: program can be created with Program Name only (Description empty)', async ({
  page,
}) => {
  const programName = uniqueName('Finance + Accounting');

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName });
  await expect(createButton(page)).toBeEnabled();
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-015: HTML in Program Name is stored as literal text', async ({ page }) => {
  const programName = uniqueName('<b>DS3</b>');

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description: 'HTML literal test' });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
  await expect(page.locator('td b').filter({ hasText: 'DS3' })).toHaveCount(0);
});

test('TC-016: double-clicking Create creates only one program', async ({ page }) => {
  const programName = uniqueName('Double Click Guard');

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName });
  await createButton(page).dblclick();
  await page.waitForTimeout(1500);

  await expect(programRow(page, programName)).toHaveCount(1);
});
