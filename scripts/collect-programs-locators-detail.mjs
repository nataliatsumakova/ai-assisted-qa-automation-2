import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

async function extractDialogFields(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return [];
    const items = [];
    for (const el of dialog.querySelectorAll(
      'input, textarea, button, h1, h2, h3, h4, label, [role="slider"], select, [role="combobox"], [role="switch"]',
    )) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      let label;
      if (el.id) {
        const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        label = l?.textContent?.replace(/\s+/g, ' ').trim();
      }
      items.push({
        tag,
        role: el.getAttribute('role') || undefined,
        label,
        ariaLabel: el.getAttribute('aria-label') || undefined,
        placeholder: el.getAttribute('placeholder') || undefined,
        type: el.getAttribute('type') || undefined,
        text: text || undefined,
        disabled:
          el.hasAttribute('disabled') ||
          el.getAttribute('aria-disabled') === 'true',
      });
    }
    return items;
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill(process.env.DIDAXIS_EMAIL);
  await page.getByLabel('Password').fill(process.env.DIDAXIS_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));

  await page.goto(`${BASE_URL}/programs`);
  await page.waitForLoadState('networkidle');

  const labelChecks = {
    programNameExact: await page.getByLabel('Program Name').count(),
    programNameStar: await page.getByLabel('Program Name *').count(),
    description: await page.getByLabel('Description').count(),
  };

  await page.getByRole('button', { name: /New Program/ }).click();
  const modal = page.locator('[role="dialog"]').filter({
    has: page.getByLabel(/Program Name/),
  });
  await modal.waitFor();

  const createCollapsed = await extractDialogFields(page);

  await modal.getByRole('button', { name: /Show AI Generation Config/ }).click();
  await page.waitForTimeout(500);
  const createExpanded = await extractDialogFields(page);

  const createButtonDisabled = await modal
    .getByRole('button', { name: 'Create', exact: true })
    .isDisabled();

  await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  await modal.waitFor({ state: 'hidden' });

  const navButtons = await page.evaluate(() =>
    [...document.querySelectorAll('nav button, aside button, [class*="sidebar"] button, header ~ * button')]
      .filter((el) => el.textContent?.trim())
      .map((el) => ({
        text: el.textContent?.replace(/\s+/g, ' ').trim(),
        ariaLabel: el.getAttribute('aria-label'),
      })),
  );

  // Get unique nav from known sidebar buttons
  const sidebar = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')].filter((b) => {
      const t = b.textContent?.trim() ?? '';
      return /Dashboard|Programs|Calendar|Validation|Scheduler|Export|Settings|Sign out/.test(t);
    });
    return buttons.map((b) => ({
      text: b.textContent?.replace(/\s+/g, ' ').trim(),
      ariaLabel: b.getAttribute('aria-label'),
    }));
  });

  console.log(JSON.stringify({ labelChecks, createButtonDisabled, sidebar, createCollapsed, createExpanded }, null, 2));
  await browser.close();
}

main();
