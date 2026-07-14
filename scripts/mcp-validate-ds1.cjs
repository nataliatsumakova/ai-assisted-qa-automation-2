module.exports = async (page) => {
  const { config } = require('dotenv');
  const { resolve } = require('path');
  config({ path: resolve(__dirname, '../.env') });

  const BASE = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) return { error: 'Missing DIDAXIS credentials in .env' };

  const ts = Date.now();
  const results = [];

  const programModal = () =>
    page.locator('[role="dialog"]').filter({ has: page.getByLabel('Program Name') });
  const programRow = (name, description) => {
    const row = page.getByRole('row').filter({ hasText: name });
    return description ? row.filter({ hasText: description }) : row;
  };

  async function record(id, title, fn) {
    try {
      const detail = await fn();
      results.push({ id, title, status: 'pass', ...detail });
    } catch (e) {
      results.push({ id, title, status: 'fail', error: e.message });
    }
  }

  // Login locators (TC precondition)
  await page.goto(`${BASE}/login`);
  await record('login', 'Login locators', async () => ({
    email: await page.getByLabel('Email').isVisible(),
    password: await page.getByLabel('Password').isVisible(),
    signIn: await page.getByRole('button', { name: 'Sign In' }).isVisible(),
  }));

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));

  await record('post-login', 'Post-login state', async () => ({
    url: page.url(),
    signOut: await page.getByRole('button', { name: 'Sign out' }).isVisible(),
  }));

  await page.goto(`${BASE}/programs`);

  // TC-001
  await record('TC-001', 'Program creation form displayed', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    const ok =
      (await page.getByLabel('Program Name').isVisible()) &&
      (await page.getByLabel('Description').isVisible()) &&
      (await page.getByRole('button', { name: 'Create' }).isVisible());
    if (!ok) throw new Error('Modal fields not visible');
    return {
      newProgramButton: await page.getByRole('button', { name: 'New Program' }).innerText(),
      dialogCount: await page.locator('[role="dialog"]').count(),
    };
  });

  // TC-003 (modal already open)
  await record('TC-003', 'Create disabled when name empty', async () => {
    await page.getByLabel('Program Name').fill('');
    const disabled = await page.getByRole('button', { name: 'Create' }).isDisabled();
    if (!disabled) throw new Error('Create should be disabled');
    return { createDisabled: disabled };
  });

  // TC-005
  await record('TC-005', 'Whitespace name rejected', async () => {
    await page.getByLabel('Program Name').fill('   ');
    await page.getByLabel('Description').fill('Introductory course track');
    const disabled = await page.getByRole('button', { name: 'Create' }).isDisabled();
    if (!disabled) throw new Error('Create should be disabled for whitespace');
    return { createDisabled: disabled, modalOpen: await programModal().isVisible() };
  });

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'New Program' }).waitFor();

  // TC-002
  const name2 = `Web Development 2026 ${ts}`;
  await record('TC-002', 'Valid program created', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name2);
    await page.getByLabel('Description').fill('Full-stack web development program');
    await page.getByRole('button', { name: 'Create' }).click();
    await programModal().waitFor({ state: 'hidden', timeout: 10000 });
    const visible = await programRow(name2, 'Full-stack web development program').isVisible();
    if (!visible) throw new Error('Program not in list');
    return { programName: name2 };
  });

  // TC-004
  const name4 = `Data Science Fundamentals ${ts}`;
  await record('TC-004', 'Program with name only', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name4);
    await page.getByRole('button', { name: 'Create' }).click();
    await programModal().waitFor({ state: 'hidden', timeout: 10000 });
    if (!(await programRow(name4).isVisible())) throw new Error('Program not in list');
    return { programName: name4 };
  });

  // TC-006
  const name6 = `Web Development 2026 dup ${ts}`;
  await record('TC-006', 'Duplicate name blocked', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name6);
    await page.getByLabel('Description').fill('Initial program');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('button', { name: 'New Program' }).waitFor();
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name6);
    await page.getByLabel('Description').fill('Duplicate attempt');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(1500);
    const modalOpen = await programModal().isVisible();
    const rowCount = await programRow(name6).count();
    if (!modalOpen || rowCount !== 1) {
      throw new Error(`Expected modal open and 1 row, got modal=${modalOpen} rows=${rowCount}`);
    }
    return { modalOpen, rowCount };
  });

  await page.getByRole('button', { name: 'Cancel' }).click().catch(() => {});
  await page.getByRole('button', { name: 'New Program' }).waitFor().catch(() => {});

  // TC-007
  const name7 = `Temporary Program ${ts}`;
  await record('TC-007', 'Cancel does not save', async () => {
    await page.goto(`${BASE}/programs`);
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name7);
    await page.getByLabel('Description').fill('Should not be saved');
    await page.getByRole('button', { name: 'Cancel' }).click();
    if (await programRow(name7).isVisible()) throw new Error('Program should not exist');
    return { programName: name7 };
  });

  // TC-008
  await record('TC-008', 'Non-admin access', async () => {
    const hasCreds = process.env.DIDAXIS_NON_ADMIN_EMAIL && process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    return {
      skipped: !hasCreds,
      reason: hasCreds ? undefined : 'No DIDAXIS_NON_ADMIN_* credentials in .env',
    };
  });

  // TC-010
  const suffix = String(ts);
  const name10 = `${'M'.repeat(255 - suffix.length)}${suffix}`;
  await record('TC-010', '255-char name accepted', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name10);
    await page.getByLabel('Description').fill('Maximum length boundary test');
    await page.getByRole('button', { name: 'Create' }).click();
    await programModal().waitFor({ state: 'hidden', timeout: 10000 });
    if (!(await programRow(name10).isVisible())) throw new Error('255-char program not in list');
    return { nameLength: name10.length };
  });

  // TC-011
  const name11 = `${'X'.repeat(256 - suffix.length)}${suffix}`;
  await record('TC-011', '256-char name rejected', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name11);
    await page.getByLabel('Description').fill('Over max length test');
    const create = page.getByRole('button', { name: 'Create' });
    if (await create.isEnabled()) await create.click();
    await page.waitForTimeout(1500);
    const modalOpen = await programModal().isVisible();
    const inList = await programRow(name11).isVisible();
    if (!modalOpen && inList) throw new Error('256-char program was created');
    if (!modalOpen && !inList) throw new Error('Unexpected state');
    return { modalOpen, inList, nameLength: name11.length };
  });

  await page.getByRole('button', { name: 'Cancel' }).click().catch(() => {});

  // TC-012
  const name12 = `C++ & AI/ML (2026) ${ts}`;
  await record('TC-012', 'Special characters accepted', async () => {
    await page.goto(`${BASE}/programs`);
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name12);
    await page.getByLabel('Description').fill('Special characters in name');
    await page.getByRole('button', { name: 'Create' }).click();
    await programModal().waitFor({ state: 'hidden', timeout: 10000 });
    if (!(await programRow(name12).isVisible())) throw new Error('Program not in list');
    return { programName: name12 };
  });

  // TC-013
  const name13 = `日本語プログラム 🎓 ${ts}`;
  await record('TC-013', 'Unicode and emoji accepted', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name13);
    await page.getByLabel('Description').fill('Unicode and emoji support test');
    await page.getByRole('button', { name: 'Create' }).click();
    await programModal().waitFor({ state: 'hidden', timeout: 10000 });
    if (!(await programRow(name13).isVisible())) throw new Error('Program not in list');
    return { programName: name13 };
  });

  // TC-014
  const trimmed14 = `Cloud Computing 2026 ${ts}`;
  await record('TC-014', 'Leading/trailing spaces trimmed', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(`  ${trimmed14}  `);
    await page.getByLabel('Description').fill('Trim whitespace test');
    await page.getByRole('button', { name: 'Create' }).click();
    await programModal().waitFor({ state: 'hidden', timeout: 10000 });
    if (!(await programRow(trimmed14, 'Trim whitespace test').isVisible())) {
      throw new Error('Trimmed name not in list');
    }
    return { trimmedName: trimmed14 };
  });

  // TC-015
  const name15 = `Cybersecurity Bootcamp ${ts}`;
  await record('TC-015', 'Long description handled', async () => {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(name15);
    await page.getByLabel('Description').fill('D'.repeat(2000));
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(3000);
    const created = await programRow(name15).isVisible();
    const modalOpen = await programModal().isVisible();
    if (!created && !modalOpen) throw new Error('Unexpected state after long description');
    return { created, modalOpen, descriptionLength: 2000 };
  });

  return {
    summary: {
      total: results.length,
      passed: results.filter((r) => r.status === 'pass').length,
      failed: results.filter((r) => r.status === 'fail').length,
      skipped: results.filter((r) => r.skipped).length,
    },
    results,
  };
};
