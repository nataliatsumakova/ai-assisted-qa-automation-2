const { chromium } = require('@playwright/test');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const email = process.env.DIDAXIS_EMAIL;
const password = process.env.DIDAXIS_PASSWORD;

if (!email || !password) {
  throw new Error('Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));

  await page.goto(`${BASE_URL}/programs`);
  await page.getByRole('heading', { name: 'Programs' }).waitFor();

  let deleted = 0;

  while (true) {
    const deleteButtons = page.getByRole('button', { name: /^Delete / });
    if ((await deleteButtons.count()) === 0) break;

    const btn = deleteButtons.first();
    const name =
      (await btn.getAttribute('aria-label'))?.replace(/^Delete\s+/, '') ??
      `program #${deleted + 1}`;

    await btn.click();

    for (const confirm of [
      page.getByRole('button', { name: 'Delete', exact: true }),
      page.getByRole('button', { name: 'Confirm' }),
      page.getByRole('button', { name: 'Yes' }),
    ]) {
      if (await confirm.isVisible({ timeout: 1500 }).catch(() => false)) {
        await confirm.click();
        break;
      }
    }

    await page.waitForTimeout(800);
    deleted += 1;
    console.log(`Deleted: ${name}`);
  }

  const remaining = await page.getByRole('button', { name: /^Delete / }).count();
  console.log(`Done. Deleted ${deleted} program(s). Remaining: ${remaining}.`);

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
