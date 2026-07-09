# Test Plan: TodoMVC

**Application under test:** https://demo.playwright.dev/todomvc  
**Scope:** Add, complete, and delete todo items  
**Date:** 2026-07-08

---

## Positive flows

### TC-001

**Title:** New todo appears in the list after Enter

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. Click the **What needs to be done?** textbox
2. Type `buy some carrots`
3. Press **Enter**

**Expected result**
- A todo item with text `buy some carrots` is visible in the list
- The **What needs to be done?** textbox is cleared
- The items counter shows `1 item left`

---

### TC-002

**Title:** Todo can be marked as completed

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list contains one active item: `feed the cat`

**Steps**
1. Click the **Toggle Todo** checkbox for `feed the cat`

**Expected result**
- The todo item has the `completed` class / completed styling
- The **Toggle Todo** checkbox is checked
- The items counter shows `0 items left`

---

### TC-003

**Title:** Todo can be removed from the list

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list contains one item: `walk the dog`

**Steps**
1. Hover over the todo item `walk the dog`
2. Click the **Destroy** (×) button for that item

**Expected result**
- `walk the dog` is no longer visible in the list
- The todo list is empty
- The footer / items counter is no longer displayed

---

### TC-004

**Title:** Multiple todos can be added in sequence

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. In **What needs to be done?**, type `task one` and press **Enter**
2. In **What needs to be done?**, type `task two` and press **Enter**
3. In **What needs to be done?**, type `task three` and press **Enter**

**Expected result**
- The list shows three items in order: `task one`, `task two`, `task three`
- The items counter shows `3 items left`

---

### TC-005

**Title:** Completed todo can be unmarked back to active

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list contains one completed item: `feed the cat`

**Steps**
1. Click the checked **Toggle Todo** checkbox for `feed the cat`

**Expected result**
- The todo item no longer has the `completed` class
- The **Toggle Todo** checkbox is unchecked
- The items counter shows `1 item left`

---

## Negative flows

### TC-006

**Title:** Empty input does not create a todo

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. Click the **What needs to be done?** textbox
2. Leave the field empty
3. Press **Enter**

**Expected result**
- No todo item is added
- The list remains empty
- The footer / items counter is not displayed

---

### TC-007

**Title:** Whitespace-only input does not create a todo

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. In **What needs to be done?**, type `   ` (spaces only)
2. Press **Enter**

**Expected result**
- No todo item is added
- The list remains empty

---

### TC-008

**Title:** Completing one todo does not complete other todos

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list contains two active items: `task one`, `task two`

**Steps**
1. Click the **Toggle Todo** checkbox for `task one` only

**Expected result**
- `task one` is completed
- `task two` remains active (unchecked, no `completed` class)
- The items counter shows `1 item left`

---

### TC-009

**Title:** Deleting one todo does not remove other todos

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list contains two items: `keep me`, `delete me`

**Steps**
1. Hover over `delete me`
2. Click its **Destroy** (×) button

**Expected result**
- `delete me` is removed
- `keep me` remains in the list
- The items counter shows `1 item left`

---

### TC-010

**Title:** Completed todo is not removed until Destroy is clicked

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list contains one active item: `buy milk`

**Steps**
1. Click the **Toggle Todo** checkbox for `buy milk`
2. Observe the list without clicking **Destroy**

**Expected result**
- `buy milk` remains visible in the list
- The item is marked completed, not deleted

---

## Edge cases

### TC-011

**Title:** Duplicate todo titles are both accepted

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. In **What needs to be done?**, type `buy milk` and press **Enter**
2. In **What needs to be done?**, type `buy milk` and press **Enter**

**Expected result**
- Two separate todo items both display text `buy milk`
- The items counter shows `2 items left`

---

### TC-012

**Title:** Special characters are stored and displayed correctly

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. In **What needs to be done?**, type `Buy <milk> & eggs! @home #1`
2. Press **Enter**

**Expected result**
- The todo title displays exactly `Buy <milk> & eggs! @home #1`
- Characters are not stripped or HTML-escaped in a way that changes visible text incorrectly

---

### TC-013

**Title:** Leading and trailing spaces are trimmed on add

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. In **What needs to be done?**, type `  buy some carrots  `
2. Press **Enter**

**Expected result**
- The todo title displays `buy some carrots` (no leading/trailing spaces)
- The item is created successfully

---

### TC-014

**Title:** Single-character todo is accepted

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. In **What needs to be done?**, type `a`
2. Press **Enter**

**Expected result**
- A todo item with text `a` appears in the list
- The items counter shows `1 item left`

---

### TC-015

**Title:** Very long todo title is accepted and remains usable

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. In **What needs to be done?**, paste a 300-character string (e.g. `A` repeated 300 times)
2. Press **Enter**
3. Hover the created item and confirm **Destroy** is still clickable
4. Click **Toggle Todo** on the item

**Expected result**
- The todo is created with the full 300-character title
- The item can still be completed and deleted
- Layout does not prevent interaction with **Toggle Todo** or **Destroy**

---

### TC-016

**Title:** Unicode and emoji characters are accepted

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list is empty

**Steps**
1. In **What needs to be done?**, type `купить молоко 🛒`
2. Press **Enter**

**Expected result**
- The todo title displays `купить молоко 🛒`
- The item can be completed and deleted normally

---

### TC-017

**Title:** Deleting the last remaining todo clears the list UI

**Preconditions**
- User is on https://demo.playwright.dev/todomvc
- Todo list contains exactly one item: `last task`

**Steps**
1. Hover over `last task`
2. Click **Destroy**

**Expected result**
- The list is empty
- Filters (**All** / **Active** / **Completed**) and the items counter are hidden
- Only the **todos** heading and **What needs to be done?** textbox remain in the main app

---

## Ambiguities and gaps in the acceptance criteria

1. **Typo in AC:** "liset" should be "list" — assumed to mean delete from the list.
2. **No edit AC:** The app supports double-click to edit a todo, but editing is not covered by the ACs.
3. **No filter AC:** Filters (**All**, **Active**, **Completed**) and **Clear completed** exist in the UI but are out of AC scope.
4. **Empty / whitespace behavior** is not specified — plan assumes empty and whitespace-only input should not create items (common TodoMVC behavior; needs confirmation).
5. **Trimming** of leading/trailing spaces is not specified — plan assumes trim on add.
6. **Duplicates** are not mentioned — plan assumes duplicates are allowed.
7. **Max length** is not defined — no documented character limit; TC-015 uses 300 characters as a practical stress value.
8. **Toggle all** and bulk complete/clear behaviors are not in scope of the ACs.
9. **Persistence** (localStorage / refresh) is not mentioned — not covered in this plan.
10. **Delete control name:** UI uses a destroy/× control revealed on hover; ACs only say "delete" without naming the control.
