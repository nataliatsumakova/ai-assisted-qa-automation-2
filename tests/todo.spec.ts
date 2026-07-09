import { test, expect, type Page } from '@playwright/test';

const TODO_URL = 'https://demo.playwright.dev/todomvc';

async function addTodo(page: Page, text: string) {
  const input = page.getByPlaceholder('What needs to be done?');
  await input.fill(text);
  await input.press('Enter');
}

function todoItem(page: Page, text: string) {
  return page.getByRole('listitem').filter({ has: page.getByText(text, { exact: true }) });
}

test.beforeEach(async ({ page }) => {
  await page.goto(TODO_URL);
});

test('TC-001: new todo appears in the list after Enter', async ({ page }) => {
  const input = page.getByPlaceholder('What needs to be done?');

  await input.click();
  await input.fill('buy some carrots');
  await input.press('Enter');

  await expect(todoItem(page, 'buy some carrots')).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-002: todo can be marked as completed', async ({ page }) => {
  await addTodo(page, 'feed the cat');

  const item = todoItem(page, 'feed the cat');
  await item.getByRole('checkbox', { name: 'Toggle Todo' }).check();

  await expect(item).toHaveClass(/completed/);
  await expect(item.getByRole('checkbox', { name: 'Toggle Todo' })).toBeChecked();
  await expect(page.getByText('0 items left')).toBeVisible();
});

test('TC-003: todo can be removed from the list', async ({ page }) => {
  await addTodo(page, 'walk the dog');

  const item = todoItem(page, 'walk the dog');
  await item.hover();
  await item.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('walk the dog')).not.toBeVisible();
  await expect(page.getByText(/items? left/)).not.toBeVisible();
});

test('TC-004: multiple todos can be added in sequence', async ({ page }) => {
  await addTodo(page, 'task one');
  await addTodo(page, 'task two');
  await addTodo(page, 'task three');

  await expect(todoItem(page, 'task one')).toBeVisible();
  await expect(todoItem(page, 'task two')).toBeVisible();
  await expect(todoItem(page, 'task three')).toBeVisible();
  await expect(page.getByText('3 items left')).toBeVisible();
});

test('TC-005: completed todo can be unmarked back to active', async ({ page }) => {
  await addTodo(page, 'feed the cat');

  const item = todoItem(page, 'feed the cat');
  const checkbox = item.getByRole('checkbox', { name: 'Toggle Todo' });
  await checkbox.check();
  await checkbox.uncheck();

  await expect(item).not.toHaveClass(/completed/);
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-006: empty input does not create a todo', async ({ page }) => {
  const input = page.getByPlaceholder('What needs to be done?');

  await input.click();
  await input.press('Enter');

  await expect(page.getByRole('listitem').filter({ hasText: /./ })).toHaveCount(0);
  await expect(page.getByText(/items? left/)).not.toBeVisible();
});

test('TC-007: whitespace-only input does not create a todo', async ({ page }) => {
  const input = page.getByPlaceholder('What needs to be done?');

  await input.fill('   ');
  await input.press('Enter');

  await expect(page.getByRole('listitem').filter({ hasText: /^\s+$/ })).toHaveCount(0);
  await expect(page.getByText(/items? left/)).not.toBeVisible();
});

test('TC-008: completing one todo does not complete other todos', async ({ page }) => {
  await addTodo(page, 'task one');
  await addTodo(page, 'task two');

  const taskOne = todoItem(page, 'task one');
  const taskTwo = todoItem(page, 'task two');
  await taskOne.getByRole('checkbox', { name: 'Toggle Todo' }).check();

  await expect(taskOne).toHaveClass(/completed/);
  await expect(taskTwo).not.toHaveClass(/completed/);
  await expect(taskTwo.getByRole('checkbox', { name: 'Toggle Todo' })).not.toBeChecked();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-009: deleting one todo does not remove other todos', async ({ page }) => {
  await addTodo(page, 'keep me');
  await addTodo(page, 'delete me');

  const deleteItem = todoItem(page, 'delete me');
  await deleteItem.hover();
  await deleteItem.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('delete me')).not.toBeVisible();
  await expect(todoItem(page, 'keep me')).toBeVisible();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-010: completed todo is not removed until Delete is clicked', async ({ page }) => {
  await addTodo(page, 'buy milk');

  const item = todoItem(page, 'buy milk');
  await item.getByRole('checkbox', { name: 'Toggle Todo' }).check();

  await expect(page.getByText('buy milk')).toBeVisible();
  await expect(item).toHaveClass(/completed/);
});

test('TC-011: duplicate todo titles are both accepted', async ({ page }) => {
  await addTodo(page, 'buy milk');
  await addTodo(page, 'buy milk');

  await expect(todoItem(page, 'buy milk')).toHaveCount(2);
  await expect(page.getByText('2 items left')).toBeVisible();
});

test('TC-012: special characters are stored and displayed correctly', async ({ page }) => {
  const title = 'Buy <milk> & eggs! @home #1';

  await addTodo(page, title);

  await expect(page.getByText(title)).toBeVisible();
});

test('TC-013: leading and trailing spaces are trimmed on add', async ({ page }) => {
  await addTodo(page, '  buy some carrots  ');

  await expect(todoItem(page, 'buy some carrots')).toBeVisible();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-014: single-character todo is accepted', async ({ page }) => {
  await addTodo(page, 'a');

  await expect(todoItem(page, 'a')).toBeVisible();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-015: very long todo title is accepted and remains usable', async ({ page }) => {
  const longTitle = 'A'.repeat(300);

  await addTodo(page, longTitle);

  const item = todoItem(page, longTitle);
  await expect(item).toBeVisible();

  await item.hover();
  await expect(item.getByRole('button', { name: 'Delete' })).toBeVisible();
  await item.getByRole('checkbox', { name: 'Toggle Todo' }).check();
  await expect(item).toHaveClass(/completed/);
});

test('TC-016: unicode and emoji characters are accepted', async ({ page }) => {
  const title = 'купить молоко 🛒';

  await addTodo(page, title);

  const item = todoItem(page, title);
  await expect(item).toBeVisible();

  await item.getByRole('checkbox', { name: 'Toggle Todo' }).check();
  await expect(item).toHaveClass(/completed/);

  await item.hover();
  await item.getByRole('button', { name: 'Delet' }).click();
  await expect(page.getByText(title)).not.toBeVisible();
});

test('TC-017: deleting the last remaining todo clears the list UI', async ({ page }) => {
  await addTodo(page, 'last task');

  const item = todoItem(page, 'last task');
  await item.hover();
  await item.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('last task')).not.toBeVisible();
  await expect(page.getByText(/items? left/)).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'All' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Active' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Completed' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'todos' })).toBeVisible();
  await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
});
