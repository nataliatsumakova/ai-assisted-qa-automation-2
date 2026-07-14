module.exports = async (page) => {
  const { config } = require('dotenv');
  const { resolve } = require('path');
  config({ path: resolve(__dirname, '../.env') });

  const BASE = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) return { error: 'Missing DIDAXIS credentials in .env' };

  const findings = [];

  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));

  findings.push({
    step: 'login',
    url: page.url(),
    signOut: await page.getByRole('button', { name: 'Sign out' }).isVisible(),
  });

  await page.goto(`${BASE}/programs`);
  findings.push({
    step: 'programs-page',
    newProgramLabel: await page.getByRole('button', { name: 'New Program' }).innerText(),
    deleteCount: await page.getByRole('button', { name: /^Delete / }).count(),
  });

  await page.getByRole('button', { name: 'New Program' }).click();
  findings.push({
    step: 'modal-open',
    programNameLabel: await page.getByLabel('Program Name').isVisible(),
    descriptionLabel: await page.getByLabel('Description').isVisible(),
    createVisible: await page.getByRole('button', { name: 'Create' }).isVisible(),
    cancelVisible: await page.getByRole('button', { name: 'Cancel' }).isVisible(),
    createDisabledEmpty: await page.getByRole('button', { name: 'Create' }).isDisabled(),
    dialogRoleCount: await page.locator('[role="dialog"]').count(),
  });

  await page.getByLabel('Program Name').fill('   ');
  findings.push({
    step: 'TC-005',
    createDisabledWhitespace: await page.getByRole('button', { name: 'Create' }).isDisabled(),
  });

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'New Program' }).waitFor();

  const ts = Date.now();
  const dup = `MCP Dup ${ts}`;
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'New Program' }).click();
    await page.getByLabel('Program Name').fill(dup);
    await page.getByLabel('Description').fill(`attempt ${i + 1}`);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('button', { name: 'New Program' }).waitFor({ timeout: 10000 });
  }
  findings.push({
    step: 'TC-006',
    duplicateRowCount: await page.getByRole('row').filter({ hasText: dup }).count(),
  });

  return findings;
};
