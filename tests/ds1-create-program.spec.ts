import { test, expect, type Page, type Locator } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${BASE_URL}/login`;
const PROGRAMS_URL = `${BASE_URL}/programs`;

/** Exact values from DS-1 Jira acceptance criteria */
const JIRA_PROGRAM_NAME = 'Web Development 2026';
const JIRA_PROGRAM_DESCRIPTION = 'Full-stack web development program';

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
  await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible();
}

function programModal(page: Page): Locator {
  return page.locator('[role="dialog"]').filter({
    has: page.getByLabel('Program Name'),
  });
}

function createButton(page: Page): Locator {
  return programModal(page).getByRole('button', { name: 'Create', exact: true });
}

function programRow(page: Page, name: string, description?: string): Locator {
  const row = page.getByRole('row').filter({
    has: page.getByText(name, { exact: true }),
  });
  return description ? row.filter({ hasText: description }) : row;
}

async function openNewProgramModal(page: Page): Promise<void> {
  await goToPrograms(page);
  await page.getByRole('button', { name: '+ New Program' }).click();
  await expect(page.getByLabel('Program Name')).toBeVisible();
}

async function fillProgramForm(
  page: Page,
  options: { name?: string; description?: string },
): Promise<void> {
  if (options.name !== undefined) {
    await page.getByLabel('Program Name').fill(options.name);
  }
  if (options.description !== undefined) {
    await page.getByLabel('Description').fill(options.description);
  }
}

async function submitCreate(page: Page): Promise<void> {
  await createButton(page).click();
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

// ---------------------------------------------------------------------------
// DS-1 Jira Acceptance Criteria — strict requirements, no bypasses
// Source: https://legionqaschool.atlassian.net/browse/DS-1
// ---------------------------------------------------------------------------

test.describe('DS-1 Jira Acceptance Criteria', () => {
  test('AC-1: Navigate to program creation form', async ({ page }) => {
    // Given I am logged in as admin
    // When I navigate to the Programs page
    await goToPrograms(page);
    // And I click "+ New Program"
    await page.getByRole('button', { name: '+ New Program' }).click();
    // Then I see the program creation form with fields: Program Name, Description
    await expect(page.getByLabel('Program Name')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
  });

  test('AC-2: Successfully create a program', async ({ page }) => {
    // Given I am on the program creation form
    await openNewProgramModal(page);
    const rowsBefore = await programRow(
      page,
      JIRA_PROGRAM_NAME,
      JIRA_PROGRAM_DESCRIPTION,
    ).count();
    // When I fill in Program Name with "Web Development 2026"
    // And I fill in Description with "Full-stack web development program"
    await fillProgramForm(page, {
      name: JIRA_PROGRAM_NAME,
      description: JIRA_PROGRAM_DESCRIPTION,
    });
    // And I click Create
    await submitCreate(page);
    // Then the modal closes
    await expect(programModal(page)).not.toBeVisible();
    // And the program list shows "Web Development 2026"
    await expect(
      programRow(page, JIRA_PROGRAM_NAME, JIRA_PROGRAM_DESCRIPTION),
    ).toHaveCount(rowsBefore + 1);
  });

  test('AC-3: Validation prevents empty program name', async ({ page }) => {
    // Given I am on the program creation form
    await openNewProgramModal(page);
    // When I leave the Program Name field empty
    await expect(page.getByLabel('Program Name')).toHaveValue('');
    // Then the Create button is disabled
    await expect(createButton(page)).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Extended coverage — Confluence specs; failures indicate bugs under DS-1
// ---------------------------------------------------------------------------

test('TC-004: program can be created with Program Name only (Description empty)', async ({
  page,
}) => {
  const programName = uniqueName('Data Science Fundamentals');

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-006: program is not created when Program Name contains only whitespace', async ({
  page,
}) => {
  await openNewProgramModal(page);
  await fillProgramForm(page, {
    name: '   ',
    description: 'Introductory course track',
  });

  await expect(createButton(page)).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
});

test('TC-007: duplicate program name is not allowed', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');

  await createProgram(page, programName, 'Initial program');

  await openNewProgramModal(page);
  await fillProgramForm(page, {
    name: programName,
    description: 'Duplicate attempt',
  });
  await submitCreate(page);

  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, programName)).toHaveCount(1);
});

test('TC-008: canceling the form does not create a program', async ({ page }) => {
  const programName = uniqueName('Temporary Program');

  await openNewProgramModal(page);
  await fillProgramForm(page, {
    name: programName,
    description: 'Should not be saved',
  });
  await programModal(page).getByRole('button', { name: 'Cancel' }).click();

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-012: Program Name exceeding maximum length is rejected', async ({ page }) => {
  const suffix = String(Date.now());
  const programName = `${'X'.repeat(101 - suffix.length)}${suffix}`;
  const description = 'Over max length test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-017: Description exceeding maximum length (501 characters) is rejected', async ({
  page,
}) => {
  const programName = uniqueName('Cybersecurity Bootcamp');
  const description = 'D'.repeat(501);

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).toBeVisible();
  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-018: double-clicking Create creates only one program', async ({ page }) => {
  const programName = uniqueName('Double Click Guard');

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName });
  await createButton(page).dblclick();
  await page.waitForTimeout(1500);

  await expect(programRow(page, programName)).toHaveCount(1);
});
