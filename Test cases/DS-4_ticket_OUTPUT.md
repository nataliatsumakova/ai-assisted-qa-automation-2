# DS-4 — Ticket Output: Test Cases for Delete Program with Confirmation

**Jira:** [DS-4](https://legionqaschool.atlassian.net/browse/DS-4) — Delete program with confirmation  
**Environment:** https://test.didaxis.studio  
**Confluence:** [Architecture Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233013249/Architecture+Overview), [Program Setup — Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233046017/Program+Setup+Overview), [Program Setup — Field Definitions](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233078785/Program+Setup+Field+Definitions), [Program Setup — Validation Rules](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233111553/Program+Setup+Validation+Rules), [Program Setup — UI Behavior](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233111568/Program+Setup+UI+Behavior)  
**Last verified:** 2026-09-09 — live Programs page explored via Playwright MCP; tests aligned to Jira ACs + Confluence; failures logged as bugs, not bypassed

## Jira bugs logged (2026-09-09)

| Sub-task (parent [DS-4](https://legionqaschool.atlassian.net/browse/DS-4)) | Test | Requirement | Status |
|---|---|---|---|
| [DS-218](https://legionqaschool.atlassian.net/browse/DS-218) | TC-015 | Double-click delete opens two confirmation dialogs | Open |

Evidence screenshot: `evidence/DS-4/TC-015-double-click-two-confirms.png`

## Test policy

- **Jira ACs are strict requirements.** Tests must not bypass failures (`test.fail`, `test.skip` for known bugs).
- If the app does not meet an AC or Confluence delete rule, the test **fails**.
- Use a **newly created unique program** for every mutating case. Do not depend on a singleton **Test Program** or **Web Development 2026** row — the live list contains 765+ programs and many similarly prefixed names.
- Confirmation is a **native `window.confirm`**, not an in-app Mantine modal. There is no **Confirm** / **Delete** button inside `role="dialog"`. Buttons are the browser **OK** and **Cancel**.

## Confluence — Architecture Overview (summary)

Pulled via Atlassian MCP from [Architecture Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233013249/Architecture+Overview) (page id `233013249`, space **DS**, version 1, created 2026-04-03).

Didaxis Studio uses a **three-layer architecture** separating curriculum intent from schedule and student workload:

| Layer | Purpose | Example |
|---|---|---|
| Layer 1 — Session Templates | Curriculum structure without dates. Defines what sessions should exist. | Lecture: Introduction to Java, Lab: Build REST API |
| Layer 2 — Scheduled Sessions | Calendar entries with `source` (MANUAL \| GENERATED \| TEMPLATE) and `status` (LOCKED \| PLANNED) | Sep 8 — Java Lecture — Intro to Java — Room 301 |
| Layer 3 — Assignments | Student deliverables with `assigned_date`, `due_date`, `estimated_hours` (two calendar events) | Lab Report due Sep 15, 4 hours estimated |

**Key invariants:** Calendar is the live data source — changes propagate to hour totals, template status, and validation; MANUAL and LOCKED sessions are immovable anchors (generator cannot move them); validation runs after every mutation (debounced 500 ms); generator is deterministic (same inputs produce identical schedules).

Programs deleted via DS-4 are the top-level container that feeds this architecture (semesters → courses → session templates). A confirmed delete is therefore **cascading and irreversible** — the confirmation copy warns that all semesters and courses will be removed.

## Confluence — Program Setup (rules used by these tests)

| Rule | Source | Expected on delete |
|---|---|---|
| Delete control is the 🗑 icon on the program row | UI Behavior + Overview | Accessible name: `Delete {program name}` |
| Native browser confirmation dialog | UI Behavior + Validation Rules | `window.confirm`, not an in-app `role="dialog"` |
| Dialog text | UI Behavior + Validation Rules | `Delete program "{name}"? All its semesters and courses will be removed. This cannot be undone.` |
| Confirm = **OK**; abort = **Cancel** | Validation Rules | OK fires delete API; Cancel takes no action |
| After delete, list **must** refresh immediately (no manual reload) | UI Behavior | Row gone without `location.reload()` |
| Empty list copy | UI Behavior | 🎓 + “No programs yet. Create your first program to get started.” + **Create Program** |
| Program Name max **100** characters, unique per organization | Field Definitions + Validation Rules | Boundary delete cases use 100, not 255 |
| ADMIN has full CRUD; EDITOR can create/edit; VIEWER is read-only | Overview | Viewer must not see an enabled delete control |
| **+ New Program** is ADMIN / EDITOR only | UI Behavior | Viewer does not see the create button |

## Live app locators (Playwright MCP — 2026-09-09)

**Login** (`/login`)

| Control | Accessible name / role |
|---|---|
| Heading copy | Sign in to your account |
| Email | `textbox "Email"` — label **Email \***, placeholder `you@college.edu` |
| Password | `textbox "Password"` — label **Password \***, placeholder `Your password` |
| Submit | `button "Sign In"` |
| After admin login | `button "Sign out"`; sidebar user **Admin** |
| After viewer login | `button "Sign out"`; sidebar user **Viewer** (`viewer@didaxis.studio`) |

**Programs page** (`/programs`)

| Control | Accessible name / role |
|---|---|
| Nav | `button "🎓 Programs"` |
| Heading | `heading "Programs"` (level 2) |
| Subtitle | Manage academic programs and semesters |
| Create (admin) | `button "+ New Program"` |
| Create (viewer) | **Not present** |
| Table | `columnheader "Program"`; each row: name in first `<p>`, description preview in second `<p>` |
| Edit | `button "Edit {program name}"` — Mantine ActionIcon, Tabler pencil SVG, `aria-label="Edit {name}"` |
| Delete | `button "Delete {program name}"` — Mantine ActionIcon, Tabler trash SVG, `aria-label="Delete {name}"` |
| Empty semester panel (no row selected) | Select a program to manage semesters |
| Selected program panel | **Semesters** header, **No semesters yet**, `button "+ Semester"`, `button "✨ Generate Curriculum"` (disabled with no hours) |
| Scale | **765** program rows at verification time |

**Delete confirmation** (native `confirm`, not `role="dialog"`)

| Control | Live value |
|---|---|
| Type | `confirm` |
| Message | `Delete program "{name}"? All its semesters and courses will be removed. This cannot be undone.` |
| Accept | Browser **OK** |
| Dismiss | Browser **Cancel** (or Escape) |
| In-app modal | None — no **Confirm** / **Delete** / **X** / overlay dismiss |

**New Program modal** (used only to seed unique programs)

| Control | Accessible name / role |
|---|---|
| Title | `heading "New Program"` |
| Name | `textbox "Program Name"` — label **Program Name \***, placeholder `e.g. Computer Science BSc` |
| Description | `textbox "Description"` — placeholder `Brief description` |
| Submit | `button "Create"` |
| Dismiss | `button "Cancel"` |

API: `GET /api/programs`, `POST /api/programs` (201 on create), `GET /api/programs/{id}/semesters` after row click. Confirmed delete is expected on `DELETE /api/programs/{id}`. Canceling confirm sent **no** DELETE request.

## Live app vs previous plan (findings applied)

| Topic | Previous plan | Live app / Confluence | Test update |
|---|---|---|---|
| Confirm UI | In-app dialog with **Confirm** / **Delete** | Native `window.confirm` with **OK** / **Cancel** | All confirm/cancel steps use native dialog |
| Dialog copy | Unspecified / program name only | Exact cascade warning including the name | Assert full message |
| Create button | `New Program` | `+ New Program` | Locators use `+ New Program` |
| Max Program Name | 255 characters | Confluence **100** | TC-010 uses 100-character name |
| Empty list | Assumed blank list | Specified empty-state copy; live env has 765 rows | TC-013 documents empty state; automation asserts immediate row removal |
| Viewer delete | Assumed hidden | **Viewer still sees 765 Edit + Delete icons**; only **+ New Program** is hidden | TC-005 asserts delete is hidden (must fail until authorization is fixed) |
| Unique **Test Program** | Used as a singleton | Many `Test Program-*` rows exist | Tests create a unique name first |
| Leave dialog open | “Do not click Confirm or Cancel” | Native confirm **blocks** until OK or Cancel | TC-004 rewritten: no delete until OK |
| Double-click delete | Not covered | Related bugs (duplicate confirm / duplicate DELETE) | TC-015 |
| Similar names | Not covered | Hundreds of `Web Development 2026*` rows | TC-016 deletes only the exact row |
| HTML in name | Not covered | Literal text in aria-label and confirm (`<b>DS3</b> 1788983974679` exists) | TC-017 |
| Row select vs delete | Not covered | Clicking a row opens the semester panel; row layout is extremely wide | TC-018 |

## Jira Acceptance Criteria

**Title:** Delete program with confirmation  
**User story:** As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.

```gherkin
Scenario: Delete program with confirmation
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  Then I see a confirmation dialog
  When I confirm deletion
  Then "Test Program" is removed from the program list

Scenario: Cancel program deletion
  Given I click the delete icon for a program
  When I see the confirmation dialog
  And I click Cancel
  Then the program still exists in the list
```

---

## Positive Flows

### TC-001 — Confirmed deletion removes the program from the program list

**Priority:** High  
**Maps to:** AC-1

**Preconditions**
- User is logged in as admin
- A unique program **Test Program {timestamp}** exists with Description **Sample program for deletion testing**
- User is on `/programs`

**Steps**
1. Locate **Test Program {timestamp}** in the program list (first cell, first `<p>`)
2. Click `button "Delete Test Program {timestamp}"`
3. Verify a native `confirm` dialog is displayed with the cascade warning and the exact program name
4. Click **OK**

**Expected result**
- Dialog type is `confirm`
- Message is `Delete program "Test Program {timestamp}"? All its semesters and courses will be removed. This cannot be undone.`
- Dialog closes after **OK**
- The row is removed from the program list immediately (no manual refresh)
- No in-app `role="dialog"` was used for confirmation
- No error `alert` is displayed

**Gherkin**
```gherkin
Feature: Delete program with confirmation

  Scenario: Delete program with confirmation
    Given I am logged in as admin
    And a program "Test Program {timestamp}" exists with Description "Sample program for deletion testing"
    And I am on the Programs page
    When I click the delete icon on "Test Program {timestamp}"
    Then I see a native confirmation dialog
    And the dialog message names "Test Program {timestamp}" and warns that semesters and courses will be removed
    When I confirm deletion with OK
    Then "Test Program {timestamp}" is removed from the program list
```

---

### TC-002 — Canceling deletion keeps the program in the program list

**Priority:** High  
**Maps to:** AC-2

**Preconditions**
- User is logged in as admin
- A unique program **Web Development 2026 {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click `button "Delete Web Development 2026 {timestamp}"`
2. Verify the native confirmation dialog is displayed
3. Click **Cancel**

**Expected result**
- Dialog closes
- **Web Development 2026 {timestamp}** remains in the program list with the same name and description
- No DELETE request is sent
- No deletion success message is shown

**Gherkin**
```gherkin
  Scenario: Cancel program deletion
    Given I am logged in as admin
    And a program "Web Development 2026 {timestamp}" exists
    And I am on the Programs page
    When I click the delete icon on "Web Development 2026 {timestamp}"
    Then I see a native confirmation dialog
    When I click Cancel
    Then "Web Development 2026 {timestamp}" still exists in the program list
```

---

### TC-003 — Deleting one program does not affect other programs in the list

**Priority:** High  
**Maps to:** AC-1 (isolation)

**Preconditions**
- User is logged in as admin
- Unique programs **Test Program {timestamp}**, **Web Development 2026 {timestamp}**, and **Cloud Computing 2026 {timestamp}** exist
- User is on `/programs`

**Steps**
1. Click the delete icon on **Test Program {timestamp}**
2. Confirm deletion with **OK**
3. Review the program list

**Expected result**
- **Test Program {timestamp}** is removed
- The other two unique programs remain
- Program count decreases by exactly one for those seeded rows (do not assert global 765−1 against concurrent testers)

**Gherkin**
```gherkin
  Scenario: Deleting one program leaves other programs intact
    Given I am logged in as admin
    And unique programs "Test Program {timestamp}", "Web Development 2026 {timestamp}", and "Cloud Computing 2026 {timestamp}" exist
    And I am on the Programs page
    When I click the delete icon on "Test Program {timestamp}"
    And I confirm deletion with OK
    Then "Test Program {timestamp}" is removed from the program list
    And "Web Development 2026 {timestamp}" still exists in the program list
    And "Cloud Computing 2026 {timestamp}" still exists in the program list
```

---

### TC-004 — Program list refreshes immediately after confirmed deletion

**Priority:** High  
**Maps to:** AC-1 + UI Behavior (list refresh)

**Preconditions**
- User is logged in as admin
- A unique program **Immediate Refresh {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click the delete icon on **Immediate Refresh {timestamp}**
2. Confirm with **OK**
3. Do not reload the page

**Expected result**
- URL remains `/programs`
- The deleted row is gone without `location.reload()`
- Remaining rows continue to render

**Gherkin**
```gherkin
  Scenario: Program list refreshes immediately after delete
    Given I am logged in as admin
    And a program "Immediate Refresh {timestamp}" exists
    And I am on the Programs page
    When I click the delete icon on "Immediate Refresh {timestamp}"
    And I confirm deletion with OK
    Then "Immediate Refresh {timestamp}" is removed from the program list
    And I did not reload the page
```

---

## Negative Flows

### TC-005 — Viewer cannot delete a program

**Priority:** High  
**Maps to:** Program Setup — Overview (VIEWER is read-only)

**Preconditions**
- Admin has created unique program **Web Development 2026 {timestamp}**
- User is then logged in as **Viewer** (`DIDAXIS_NON_ADMIN_EMAIL`)
- User is on `/programs`

**Steps**
1. Locate **Web Development 2026 {timestamp}** in the program list
2. Look for `button "Delete Web Development 2026 {timestamp}"`
3. Look for `button "+ New Program"`

**Expected result**
- Delete icon is **not** visible or is disabled
- Edit icon is **not** visible or is disabled
- **+ New Program** is not visible
- The program row is still listed (read-only)

**Live finding (2026-09-09):** Viewer session hid **+ New Program** but still rendered Edit and Delete on every row (765 icons). This test must **fail** until authorization matches Confluence.

**Gherkin**
```gherkin
  Scenario: Viewer cannot delete a program
    Given I am logged in as a viewer
    And a program "Web Development 2026 {timestamp}" exists
    And I am on the Programs page
    Then I do not see the delete icon on "Web Development 2026 {timestamp}"
    And I do not see the "+ New Program" button
    And "Web Development 2026 {timestamp}" still exists in the program list
```

---

### TC-006 — Canceling deletion does not show the program as deleted

**Priority:** Medium  
**Maps to:** AC-2 (no side effects)

**Preconditions**
- User is logged in as admin
- Unique program **Cloud Computing 2026 {timestamp}** exists with a known description
- User is on `/programs`

**Steps**
1. Click the delete icon on **Cloud Computing 2026 {timestamp}**
2. Click **Cancel**
3. Scan the program list for the same name and description

**Expected result**
- The program is still visible with unchanged **Program Name** and **Description**
- No success/deletion toast or banner is shown
- No DELETE API call occurred

**Gherkin**
```gherkin
  Scenario: Cancel does not trigger deletion side effects
    Given I am logged in as admin
    And a program "Cloud Computing 2026 {timestamp}" exists
    And I am on the Programs page
    When I click the delete icon on "Cloud Computing 2026 {timestamp}"
    And I click Cancel
    Then "Cloud Computing 2026 {timestamp}" still exists in the program list
    And I do not see a deletion success message
```

---

### TC-007 — Deleting a non-existent program is not possible from the UI

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- No program named **Missing Program {timestamp}** exists
- User is on `/programs`

**Steps**
1. Review the program list for **Missing Program {timestamp}**

**Expected result**
- The name is not listed
- No `button "Delete Missing Program {timestamp}"` exists
- No deletion action can be initiated

**Gherkin**
```gherkin
  Scenario: Non-existent program cannot be deleted
    Given I am logged in as admin
    And no program "Missing Program {timestamp}" exists
    And I am on the Programs page
    Then I do not see "Missing Program {timestamp}" in the program list
    And I cannot delete "Missing Program {timestamp}"
```

---

### TC-008 — Program is not deleted unless OK is pressed

**Priority:** High  
**Maps to:** AC-1 / AC-2 (native confirm is blocking)

**Preconditions**
- User is logged in as admin
- Unique program **Data Science Fundamentals {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click the delete icon on **Data Science Fundamentals {timestamp}**
2. Observe that a native confirm appears and the page is blocked
3. Dismiss with **Cancel** (native confirm cannot be left open)

**Expected result**
- A `confirm` dialog appeared (deletion is gated)
- After dismiss, the program is still in the list
- Confirming is the only path that removes the row

**Gherkin**
```gherkin
  Scenario: Program is not deleted without OK
    Given I am logged in as admin
    And a program "Data Science Fundamentals {timestamp}" exists
    And I am on the Programs page
    When I click the delete icon on "Data Science Fundamentals {timestamp}"
    Then I see a native confirmation dialog
    When I dismiss the dialog
    Then "Data Science Fundamentals {timestamp}" still exists in the program list
    And no deletion has occurred
```

---

## Edge Cases

### TC-009 — Program with special characters in the name can be deleted after confirmation

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **Informatique & IA - Niveau 2 {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click the delete icon on **Informatique & IA - Niveau 2 {timestamp}**
2. Read the confirm message
3. Confirm with **OK**

**Expected result**
- Confirm message contains the exact name, including `&`, spaces, and hyphens
- Accessible delete name is `Delete Informatique & IA - Niveau 2 {timestamp}`
- The program is removed after **OK**

**Gherkin**
```gherkin
  Scenario: Delete program with special characters in name
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2 {timestamp}" exists
    And I am on the Programs page
    When I click the delete icon on "Informatique & IA - Niveau 2 {timestamp}"
    Then the confirmation message contains "Informatique & IA - Niveau 2 {timestamp}"
    When I confirm deletion with OK
    Then "Informatique & IA - Niveau 2 {timestamp}" is removed from the program list
```

---

### TC-010 — Minimum-length program name (1 character) can be deleted after confirmation

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- A 1-character unique program name exists (do not reuse a shared **A** row)
- User is on `/programs`

**Steps**
1. Click the delete icon on that 1-character program
2. Confirm with **OK**

**Expected result**
- Confirm dialog is shown and includes the 1-character name
- The row is removed after confirmation

**Gherkin**
```gherkin
  Scenario: Delete program with minimum-length name
    Given I am logged in as admin
    And a unique 1-character program exists
    And I am on the Programs page
    When I click the delete icon on that program
    And I confirm deletion with OK
    Then the 1-character program is removed from the program list
```

---

### TC-011 — Maximum-length program name (100 characters) can be deleted after confirmation

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- A program whose **Program Name** is exactly **100** characters exists (Confluence max)
- User is on `/programs`

**Steps**
1. Click `button "Delete {100-character name}"`
2. Confirm with **OK**

**Expected result**
- Confirm message includes the full 100-character name
- The row is removed after confirmation

**Gherkin**
```gherkin
  Scenario: Delete program with maximum-length name
    Given I am logged in as admin
    And a program with a 100-character Program Name exists
    And I am on the Programs page
    When I click the delete icon on the 100-character program
    And I confirm deletion with OK
    Then the 100-character program is removed from the program list
```

---

### TC-012 — Unicode program name can be deleted after confirmation

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Unique program **日本語プログラム 🎓 {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click the delete icon on **日本語プログラム 🎓 {timestamp}**
2. Confirm with **OK**

**Expected result**
- Confirm message handles unicode and emoji without mojibake
- The row is removed after confirmation

**Gherkin**
```gherkin
  Scenario: Delete program with unicode name
    Given I am logged in as admin
    And a program "日本語プログラム 🎓 {timestamp}" exists
    And I am on the Programs page
    When I click the delete icon on "日本語プログラム 🎓 {timestamp}"
    And I confirm deletion with OK
    Then "日本語プログラム 🎓 {timestamp}" is removed from the program list
```

---

### TC-013 — Canceling deletion of a program with special characters preserves the program

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **C++ & AI/ML (2026) {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click the delete icon on **C++ & AI/ML (2026) {timestamp}**
2. Click **Cancel**

**Expected result**
- The program remains in the list
- Name is unchanged and displayed correctly (`+`, `&`, `/`, parentheses)

**Gherkin**
```gherkin
  Scenario: Cancel deletion of program with special characters
    Given I am logged in as admin
    And a program "C++ & AI/ML (2026) {timestamp}" exists
    And I am on the Programs page
    When I click the delete icon on "C++ & AI/ML (2026) {timestamp}"
    And I click Cancel
    Then "C++ & AI/ML (2026) {timestamp}" still exists in the program list
```

---

### TC-014 — Deleted program name can be reused for a new program

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on `/programs`
- Unique name **Test Program {timestamp}** is not currently in the list (or was just deleted)

**Steps**
1. Click **+ New Program**
2. Enter **Test Program {timestamp}** in **Program Name**
3. Enter **Recreated after deletion** in **Description**
4. Click **Create**
5. Click the delete icon and confirm with **OK**
6. Click **+ New Program** again and create the same name with Description **Recreated after deletion**
7. Delete the recreated program with confirmation

**Expected result**
- After the first delete, the same name can be created again
- Each delete shows the same native confirm and removes that row

**Gherkin**
```gherkin
  Scenario: Reuse program name after deletion
    Given I am logged in as admin
    And no program "Test Program {timestamp}" exists
    And I am on the Programs page
    When I click "+ New Program"
    And I fill in Program Name with "Test Program {timestamp}"
    And I fill in Description with "Recreated after deletion"
    And I click Create
    Then the program list shows "Test Program {timestamp}"
    When I click the delete icon on "Test Program {timestamp}"
    And I confirm deletion with OK
    Then "Test Program {timestamp}" is removed from the program list
    When I click "+ New Program"
    And I fill in Program Name with "Test Program {timestamp}"
    And I fill in Description with "Recreated after deletion"
    And I click Create
    Then the program list shows "Test Program {timestamp}"
    When I click the delete icon on "Test Program {timestamp}"
    And I confirm deletion with OK
    Then "Test Program {timestamp}" is removed from the program list
```

---

### TC-015 — Double-clicking delete shows one confirmation and issues one delete

**Priority:** High  
**Maps to:** edge case (related Jira: duplicate confirm / duplicate DELETE)

**Preconditions**
- User is logged in as admin
- Unique program **Double Click Guard {timestamp}** exists
- User is on `/programs`

**Steps**
1. Double-click `button "Delete Double Click Guard {timestamp}"`
2. Handle the native confirm with **Cancel** (or **OK** on a dedicated throwaway program)

**Expected result**
- Exactly **one** `confirm` dialog is shown
- At most one DELETE request is sent if **OK** is chosen
- The program is not deleted twice / no uncaught second dialog hangs the page

**Gherkin**
```gherkin
  Scenario: Double-click delete shows a single confirmation
    Given I am logged in as admin
    And a program "Double Click Guard {timestamp}" exists
    And I am on the Programs page
    When I double-click the delete icon on "Double Click Guard {timestamp}"
    Then I see exactly one native confirmation dialog
    When I click Cancel
    Then "Double Click Guard {timestamp}" still exists in the program list
```

---

### TC-016 — Deleting a program does not remove a similarly named program

**Priority:** High

**Preconditions**
- User is logged in as admin
- Programs **Web Development 2026 {timestamp}** and **Web Development 2026 {timestamp} extra** exist
- User is on `/programs`

**Steps**
1. Click the delete icon on the exact **Web Development 2026 {timestamp}** row
2. Confirm with **OK**

**Expected result**
- Only the exact-name row is removed
- The `… extra` sibling remains
- Confirm message names only the targeted program

**Gherkin**
```gherkin
  Scenario: Delete targets only the exact program name
    Given I am logged in as admin
    And a program "Web Development 2026 {timestamp}" exists
    And a program "Web Development 2026 {timestamp} extra" exists
    And I am on the Programs page
    When I click the delete icon on "Web Development 2026 {timestamp}"
    And I confirm deletion with OK
    Then "Web Development 2026 {timestamp}" is removed from the program list
    And "Web Development 2026 {timestamp} extra" still exists in the program list
```

---

### TC-017 — HTML-like program name is shown literally in the confirm dialog and can be deleted

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **\<b\>DS4\</b\> {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click `button "Delete <b>DS4</b> {timestamp}"`
2. Read the confirm message
3. Confirm with **OK**

**Expected result**
- Confirm message contains the literal characters `<b>DS4</b>`, not a bold rendering
- The row is removed after **OK**
- No HTML is interpreted in the list cell

**Gherkin**
```gherkin
  Scenario: Delete program with HTML-like name
    Given I am logged in as admin
    And a program "<b>DS4</b> {timestamp}" exists
    And I am on the Programs page
    When I click the delete icon on "<b>DS4</b> {timestamp}"
    Then the confirmation message contains "<b>DS4</b> {timestamp}"
    When I confirm deletion with OK
    Then "<b>DS4</b> {timestamp}" is removed from the program list
```

---

### TC-018 — Delete icon remains usable after the program row is selected

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **Selected Row Delete {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click the program row (not the delete icon) to open the semester panel
2. Verify the panel shows **No semesters yet** (new program)
3. Click `button "Delete Selected Row Delete {timestamp}"`
4. Confirm with **OK**

**Expected result**
- Semester panel opened without navigating away from `/programs`
- Delete icon remains visible and clickable after selection
- Confirm + **OK** removes the program
- UI does not enter a broken state (clipped hit-target that cannot be clicked)

**Live finding:** Selected rows can expand to an extremely large layout width. Icons were still on-screen at 1578×856; the test still requires the delete control to be actionable.

**Gherkin**
```gherkin
  Scenario: Delete remains available after selecting the program row
    Given I am logged in as admin
    And a program "Selected Row Delete {timestamp}" exists
    And I am on the Programs page
    When I click the "Selected Row Delete {timestamp}" row
    Then I see the semester panel
    When I click the delete icon on "Selected Row Delete {timestamp}"
    And I confirm deletion with OK
    Then "Selected Row Delete {timestamp}" is removed from the program list
```

---

### TC-019 — Empty-state copy is shown when the last program is deleted

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Either the organization has exactly one program, or this case is exercised in an isolated tenant
- Shared test.didaxis.studio had **765** programs at verification — do **not** delete the entire shared list

**Steps**
1. Confirm-delete the last remaining program

**Expected result** (from UI Behavior)
- 🎓 icon
- Text: **No programs yet. Create your first program to get started.**
- **Create Program** button visible
- No errors or broken table chrome

**Automation on the shared env:** assert immediate removal of the seeded row (same as TC-001 / TC-004). Do not attempt to empty 765 rows.

**Gherkin**
```gherkin
  Scenario: Delete the only program in the list
    Given I am logged in as admin
    And only one program exists
    And I am on the Programs page
    When I click the delete icon on that program
    And I confirm deletion with OK
    Then the program is removed from the program list
    And I see "No programs yet. Create your first program to get started."
```

---

## Coverage Summary

| AC / rule | Test ID |
|---|---|
| Delete program with confirmation (AC-1) | TC-001, TC-003, TC-004 |
| Cancel program deletion (AC-2) | TC-002, TC-006, TC-008, TC-013 |
| Viewer is read-only (Confluence Overview) | TC-005 |
| Immediate list refresh (UI Behavior) | TC-001, TC-004 |
| Native confirm copy + cascade warning | TC-001, TC-009, TC-017 |
| Empty state (UI Behavior) | TC-019 |

| Category | Test IDs | Count |
|---|---|---|
| Positive flows | TC-001 – TC-004 | 4 |
| Negative flows | TC-005 – TC-008 | 4 |
| Edge cases | TC-009 – TC-019 | 11 |
| **Total** | | **19** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Confirm UI** — Jira says “confirmation dialog” and “click Cancel”. Confluence and the live app use native `window.confirm` (**OK** / **Cancel**), not an in-app **Confirm** / **Delete** modal. Related: [DS-?] Programs: Delete uses native browser confirm instead of in-app dialog.
2. **Dialog copy** — Jira does not specify the cascade warning. Confluence does: semesters and courses are removed and the action cannot be undone.
3. **Soft vs hard delete** — Jira does not say whether the name can be reused. Confluence uniqueness is per organization; TC-014 expects reuse after delete.
4. **Authorization** — Jira ACs are admin-only. Confluence says Viewer is read-only, but the live Viewer session still shows Edit/Delete on every row.
5. **Empty list** — Jira does not define empty-state UI. Confluence does; the shared tenant is never empty (765+ rows).
6. **Double-click / rapid delete** — Not in the ACs; live/related bugs report two confirms and two DELETE calls.
7. **Dependencies** — Dialog warns about cascade, but there is no AC for deleting a program that still has semesters, courses, or locked calendar sessions (Architecture Overview: MANUAL/LOCKED anchors).
8. **Error handling** — No AC for failed DELETE (network / 500) or a user-visible error. Related tickets report missing error messages.
9. **Success feedback** — Only list removal is specified; no toast. Live cancel showed no message (correct). Live confirm was not re-clicked after approval was declined; tests still require list removal and no error alert.
10. **Duplicate names** — If historical duplicates exist, Jira does not say whether delete targets one row or all matching names. Tests delete by exact `aria-label` on one row.
11. **Dismiss without Cancel** — Native confirm can also be dismissed with Escape; there is no **X** or overlay click.
12. **Max length** — Previous DS-4 plan used 255. Field Definitions cap Program Name at **100**.
