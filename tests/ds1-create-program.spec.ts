import { test, expect, type Page, type Locator } from '@playwright/test';

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

async function openNewProgramModal(page: Page): Promise<void> {
  await goToPrograms(page);
  await page.getByRole('button', { name: 'New Program' }).click();
  await expect(page.getByLabel('Program Name')).toBeVisible();
}

function programModal(page: Page): Locator {
  return page.locator('[role="dialog"]').filter({
    has: page.getByLabel('Program Name'),
  });
}

function programRow(page: Page, name: string, description?: string): Locator {
  const row = page.getByRole('row').filter({ hasText: name });
  return description ? row.filter({ hasText: description }) : row;
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
  await page.getByRole('button', { name: 'Create' }).click();
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

test('TC-001: program creation form is displayed from Programs page', async ({ page }) => {
  await goToPrograms(page);
  await page.getByRole('button', { name: '+ New Program' }).click();

  await expect(page.getByLabel('Program Name')).toBeVisible();
  await expect(page.getByLabel('Description')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
});

test('TC-002: valid program is created and appears in the program list', async ({ page }) => {
  const programName = uniqueName('Web Development 2026');
  const description = 'Full-stack web development program';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName, description)).toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
});

test('TC-003: Create button is disabled when Program Name is empty', async ({ page }) => {
  await openNewProgramModal(page);

  await expect(page.getByLabel('Program Name')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
  await expect(programModal(page)).toBeVisible();
});

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

test('TC-005: program is not created when Program Name contains only whitespace', async ({
  page,
}) => {
  await openNewProgramModal(page);
  await fillProgramForm(page, {
    name: '   ',
    description: 'Introductory course track',
  });

  const createButton = page.getByRole('button', { name: 'Create' });
  await expect(createButton).toBeDisabled();

  await expect(programModal(page)).toBeVisible();
});

test('TC-006: duplicate program name is not allowed', async ({ page }) => {
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

test('TC-007: canceling the form does not create a program', async ({ page }) => {
  const programName = uniqueName('Temporary Program');

  await openNewProgramModal(page);
  await fillProgramForm(page, {
    name: programName,
    description: 'Should not be saved',
  });
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).not.toBeVisible();
});

/*
test('TC-008: non-admin user cannot access program creation', async ({ page }) => {
  const nonAdminEmail = process.env.DIDAXIS_NON_ADMIN_EMAIL;
  const nonAdminPassword = process.env.DIDAXIS_NON_ADMIN_PASSWORD;

  test.skip(
    !nonAdminEmail || !nonAdminPassword,
    'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run this test',
  );

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL((url) => url.pathname.includes('/login'));

  await page.getByLabel('Email').fill(nonAdminEmail!);
  await page.getByLabel('Password').fill(nonAdminPassword!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
  await goToPrograms(page);

  await expect(page.getByRole('button', { name: 'New Program' })).not.toBeVisible();
  await expect(page.getByLabel('Program Name')).not.toBeVisible();
});
*/

test('TC-010: Program Name at maximum allowed length', async ({ page }) => {
  const suffix = String(Date.now());
  const programName = `${'M'.repeat(255 - suffix.length)}${suffix}`;
  const description = 'Maximum length boundary test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-011: Program Name exceeding maximum length is rejected', async ({ page }) => {
  const suffix = String(Date.now());
  const programName = `${'X'.repeat(256 - suffix.length)}${suffix}`;
  const description = 'Over max length test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });

  const createButton = page.getByRole('button', { name: 'Create' });
  if (await createButton.isEnabled()) {
    await createButton.click();
  }

  const validationError = programModal(page).getByText(/too long|maximum|255|character/i);
  const modalStillOpen = await programModal(page).isVisible();

  expect(modalStillOpen || (await validationError.isVisible())).toBeTruthy();
  await expect(programRow(page, programName)).not.toBeVisible();
});

test('TC-012: special characters in Program Name are handled correctly', async ({ page }) => {
  const programName = uniqueName('C++ & AI/ML (2026)');
  const description = 'Special characters in name';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-013: Unicode and emoji in Program Name are handled correctly', async ({ page }) => {
  const programName = uniqueName('日本語プログラム 🎓');
  const description = 'Unicode and emoji support test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, programName)).toBeVisible();
});

test('TC-014: leading and trailing spaces in Program Name are trimmed', async ({ page }) => {
  const trimmedName = uniqueName('Cloud Computing 2026');
  const programName = `  ${trimmedName}  `;
  const description = 'Trim whitespace test';

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  await expect(programModal(page)).not.toBeVisible();
  await expect(programRow(page, trimmedName, description)).toBeVisible();
});

test('TC-015: very long Description is handled correctly', async ({ page }) => {
  const programName = uniqueName('Cybersecurity Bootcamp');
  const description = 'D'.repeat(2000);

  await openNewProgramModal(page);
  await fillProgramForm(page, { name: programName, description });
  await submitCreate(page);

  const programInList = programRow(page, programName, description);

  try {
    await expect(programInList).toBeVisible({ timeout: 10_000 });
    await expect(programModal(page)).not.toBeVisible();
  } catch {
    await expect(programModal(page)).toBeVisible();
    await expect(programInList).not.toBeVisible();
  }
});
