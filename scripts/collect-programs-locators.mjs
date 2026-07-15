import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const EMAIL = process.env.DIDAXIS_EMAIL;
const PASSWORD = process.env.DIDAXIS_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be set in .env');
  process.exit(1);
}

async function extractElements(page, scope = page) {
  return scope.evaluate(() => {
    const results = [];
    const seen = new Set();

    function describe(el) {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || undefined;
      const ariaLabel = el.getAttribute('aria-label') || undefined;
      const id = el.id || undefined;
      const name = el.getAttribute('name') || undefined;
      const type = el.getAttribute('type') || undefined;
      const placeholder = el.getAttribute('placeholder') || undefined;
      const href = el.getAttribute('href') || undefined;
      const testId = el.getAttribute('data-testid') || undefined;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      const visible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const disabled =
        el.hasAttribute('disabled') ||
        el.getAttribute('aria-disabled') === 'true' ||
        el.closest('[disabled]') !== null;

      let labelText;
      if (el.id) {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) labelText = label.textContent?.replace(/\s+/g, ' ').trim();
      }
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      if (ariaLabelledBy && !labelText) {
        labelText = ariaLabelledBy
          .split(/\s+/)
          .map((idPart) => document.getElementById(idPart)?.textContent?.trim())
          .filter(Boolean)
          .join(' ');
      }

      const key = `${tag}|${role}|${ariaLabel}|${labelText}|${text}|${id}|${name}|${testId}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        tag,
        role,
        ariaLabel,
        label: labelText,
        id,
        name,
        type,
        placeholder,
        href,
        testId,
        text: text || undefined,
        visible,
        disabled,
      };
    }

    const selectors =
      'a, button, input, textarea, select, [role], h1, h2, h3, h4, h5, h6, table, thead, tbody, tr, th, td, label, [data-testid]';
    for (const el of document.querySelectorAll(selectors)) {
      const info = describe(el);
      if (info && info.visible) results.push(info);
    }
    return results;
  });
}

function suggestLocator(el) {
  const parts = [];
  if (el.testId) parts.push(`page.getByTestId('${el.testId}')`);
  if (el.label) parts.push(`page.getByLabel('${el.label.replace(/'/g, "\\'")}')`);
  if (el.role && el.ariaLabel) {
    parts.push(
      `page.getByRole('${el.role}', { name: '${el.ariaLabel.replace(/'/g, "\\'")}' })`,
    );
  } else if (el.role && el.text) {
    const shortText = el.text.slice(0, 80).replace(/'/g, "\\'");
    if (['button', 'link', 'heading', 'row', 'cell', 'columnheader'].includes(el.role)) {
      parts.push(`page.getByRole('${el.role}', { name: '${shortText}' })`);
    }
  }
  if (el.role === 'button' && el.text) {
    parts.push(`page.getByRole('button', { name: '${el.text.slice(0, 80).replace(/'/g, "\\'")}' })`);
  }
  if (el.tag === 'input' && el.placeholder) {
    parts.push(`page.getByPlaceholder('${el.placeholder.replace(/'/g, "\\'")}')`);
  }
  if (el.id) parts.push(`page.locator('#${el.id}')`);
  if (el.name) parts.push(`page.locator('[name="${el.name}"]')`);
  return [...new Set(parts)];
}

function formatSection(title, elements) {
  const lines = [`\n## ${title}\n`];
  for (const el of elements) {
    const locators = suggestLocator(el);
    lines.push(`### ${el.tag}${el.role ? ` [role=${el.role}]` : ''}`);
    if (el.text) lines.push(`- **Text:** ${el.text}`);
    if (el.label) lines.push(`- **Label:** ${el.label}`);
    if (el.ariaLabel) lines.push(`- **aria-label:** ${el.ariaLabel}`);
    if (el.id) lines.push(`- **id:** ${el.id}`);
    if (el.name) lines.push(`- **name:** ${el.name}`);
    if (el.type) lines.push(`- **type:** ${el.type}`);
    if (el.placeholder) lines.push(`- **placeholder:** ${el.placeholder}`);
    if (el.href) lines.push(`- **href:** ${el.href}`);
    if (el.testId) lines.push(`- **data-testid:** ${el.testId}`);
    lines.push(`- **disabled:** ${el.disabled}`);
    if (locators.length) {
      lines.push('- **Suggested Playwright locators:**');
      for (const loc of locators) lines.push(`  - \`${loc}\``);
    }
    lines.push('');
  }
  return lines.join('\n');
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await login(page);
  await page.goto(`${BASE_URL}/programs`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('heading', { name: 'Programs' }).waitFor();

  const programsPageElements = await extractElements(page);

  // Open New Program modal
  await page.getByRole('button', { name: /New Program/ }).click();
  await page.getByLabel('Program Name').waitFor();
  const modal = page.locator('[role="dialog"]').filter({
    has: page.getByLabel('Program Name'),
  });
  const createModalElements = await extractElements(page, modal);

  // Close modal
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  await modal.waitFor({ state: 'hidden' });

  // Try to open edit modal if programs exist
  let editModalElements = [];
  const editButtons = page.getByRole('button', { name: /^Edit / });
  const editCount = await editButtons.count();
  if (editCount > 0) {
    const firstEditName = (await editButtons.first().getAttribute('aria-label'))?.replace(/^Edit /, '') ?? '';
    await editButtons.first().click();
    await page.getByLabel('Program Name').waitFor();
    const editModal = page.locator('[role="dialog"]').filter({
      has: page.getByLabel('Program Name'),
    });
    editModalElements = await extractElements(page, editModal);
    await editModal.getByRole('button', { name: 'Cancel', exact: true }).click();
    await editModal.waitFor({ state: 'hidden' });
  }

  // Table structure
  const tableInfo = await page.evaluate(() => {
    const table = document.querySelector('table');
    if (!table) return null;
    const headers = [...table.querySelectorAll('thead th')].map((th) =>
      th.textContent?.replace(/\s+/g, ' ').trim(),
    );
    const firstRow = table.querySelector('tbody tr');
    const cells = firstRow
      ? [...firstRow.querySelectorAll('td')].map((td, i) => ({
          index: i,
          text: td.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100),
        }))
      : [];
    const rowCount = table.querySelectorAll('tbody tr').length;
    return { headers, firstRowCells: cells, rowCount };
  });

  const output = [
    '# Didaxis /programs Page Locators (Admin)',
    '',
    `**URL:** ${BASE_URL}/programs`,
    `**Collected:** ${new Date().toISOString()}`,
    '',
    '---',
    formatSection('Programs Page (List View)', programsPageElements),
    '---',
    formatSection('New Program Modal (Create)', createModalElements),
  ];

  if (editModalElements.length) {
    output.push('---', formatSection('Edit Program Modal', editModalElements));
  }

  output.push(
    '\n---\n',
    '## Table Structure\n',
    `- **Locator:** \`page.getByRole('table')\``,
    `- **Row count:** ${tableInfo?.rowCount ?? 0}`,
  );
  if (tableInfo?.headers?.length) {
    output.push(`- **Column headers:** ${tableInfo.headers.join(' | ')}`);
    output.push('- **Header locators:**');
    for (const h of tableInfo.headers) {
      if (h) output.push(`  - \`page.getByRole('columnheader', { name: '${h}' })\``);
    }
  }
  if (tableInfo?.firstRowCells?.length) {
    output.push('- **Sample first row cells:**');
    for (const cell of tableInfo.firstRowCells) {
      output.push(`  - Column ${cell.index}: "${cell.text}"`);
    }
  }

  output.push(
    '\n---\n',
    '## Composite / Helper Locators (from existing tests)\n',
    '```typescript',
    'const PROGRAMS_URL = `${BASE_URL}/programs`;',
    '',
    '// Page-level',
    "page.getByRole('heading', { name: 'Programs' })",
    "page.getByRole('button', { name: 'New Program' })",
    "page.getByRole('button', { name: /New Program/ })",
    "page.getByRole('button', { name: 'Sign out' })",
    "page.getByRole('table')",
    '',
    '// Program modal',
    'page.locator(\'[role="dialog"]\').filter({ has: page.getByLabel(\'Program Name\') })',
    "modal.getByLabel('Program Name')",
    "modal.getByLabel('Description')",
    "modal.getByRole('button', { name: 'Create', exact: true })",
    "modal.getByRole('button', { name: 'Save', exact: true })",
    "modal.getByRole('button', { name: 'Cancel', exact: true })",
    '',
    '// Table rows',
    "page.getByRole('row').filter({ has: page.locator('td').first().locator('p').first().filter({ hasText: /^ProgramName$/ }) })",
    "page.getByRole('button', { name: `Edit ${programName}` })",
    "page.getByRole('button', { name: `Delete ${programName}` })",
    '',
    '// Delete confirmation (native dialog)',
    "page.once('dialog', ...) // type: 'confirm', message contains program name",
    '```',
  );

  console.log(output.join('\n'));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
