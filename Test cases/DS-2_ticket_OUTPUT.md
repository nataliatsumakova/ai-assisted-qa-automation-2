# DS-2 — Ticket Output: Test Cases for Edit Existing Program Details

**Jira:** [DS-2](https://legionqaschool.atlassian.net/browse/DS-2) — Edit existing program details  
**Environment:** https://test.didaxis.studio  
**Confluence:** [Architecture Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233013249/Architecture+Overview), [Program Setup — Field Definitions](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233078785/Program+Setup+Field+Definitions), [Program Setup — Validation Rules](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233111553/Program+Setup+Validation+Rules), [Program Setup — UI Behavior](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233111568/Program+Setup+UI+Behavior)  
**Last verified:** 2026-09-08 — live Programs page explored via Playwright MCP; tests aligned to Jira ACs + Confluence; failures logged as bugs, not bypassed

## Test policy

- **Jira ACs are strict requirements.** Tests must not bypass failures (`test.fail`, `test.skip` for known bugs).
- If the app does not meet an AC or Confluence validation rule, the test **fails**.
- Use a **newly created unique program** for every mutating case. Do not depend on a singleton **Web Development 2026** row — the live list contains hundreds of similarly named programs.

## Confluence — Architecture Overview (summary)

Didaxis Studio uses a **three-layer architecture** separating curriculum intent from schedule and student workload:

| Layer | Purpose | Example |
|---|---|---|
| Layer 1 — Session Templates | Curriculum structure without dates | Lecture: Introduction to Java, Lab: Build REST API |
| Layer 2 — Scheduled Sessions | Calendar entries with `source` (MANUAL \| GENERATED \| TEMPLATE) and `status` (LOCKED \| PLANNED) | Sep 8 — Java Lecture — Room 301 |
| Layer 3 — Assignments | Student deliverables with assigned/due dates and estimated hours | Lab Report due Sep 15 |

**Key invariants:** Calendar is the live data source; MANUAL/LOCKED sessions are immovable anchors; validation runs after every mutation (debounced 500 ms); generator is deterministic.

Programs edited via DS-2 remain the top-level container that feeds this architecture (semesters → courses → session templates). A stale or incorrect program name after Save would propagate into generated schedules.

## Confluence — Program Setup (rules used by these tests)

| Rule | Source | Expected on edit |
|---|---|---|
| Program Name required, max **100** characters, unique per organization | Field Definitions + Validation Rules | Save disabled when empty; 101+ rejected; duplicate name shows error (400/409) |
| Description optional, max **500** characters | Field Definitions + Validation Rules | Empty allowed; 501+ rejected |
| Name trimmed on submit; whitespace-only blocked | Validation Rules | Modal stays open; original row unchanged |
| Save disabled when Program Name is empty | UI Behavior | Same as Create |
| After edit, list **must** refresh immediately (no manual reload) | UI Behavior | Updated name/description visible in the table |
| Edit control is the ✏️ / pencil icon on the row; modal title **Edit Program**; submit **Save** | UI Behavior | Accessible name: `Edit {program name}` |
| Collapsible **AI Generation Config** fields exist on create and edit | Field Definitions | Unchanged AI fields must survive a description-only save |
| ADMIN + EDITOR can edit; VIEWER is read-only | Program Setup — Overview | Viewer must not see an enabled edit control |

## Live app locators (Playwright MCP — 2026-09-08)

**Login** (`/login`)

| Control | Accessible name / role |
|---|---|
| Heading copy | Sign in to your account |
| Email | `textbox "Email"` — label **Email \***, placeholder `you@college.edu` |
| Password | `textbox "Password"` — label **Password \***, placeholder `Your password` |
| Submit | `button "Sign In"` |
| After login | `button "Sign out"`; sidebar user **Admin** |

**Programs page** (`/programs`)

| Control | Accessible name / role |
|---|---|
| Nav | `button "🎓 Programs"` |
| Heading | `heading "Programs"` (level 2) |
| Subtitle | Manage academic programs and semesters |
| Create | `button "+ New Program"` |
| Table | `columnheader "Program"`; each row: name in first `<p>`, description preview in second `<p>` |
| Edit | `button "Edit {program name}"` — Mantine ActionIcon, Tabler pencil SVG, `aria-label="Edit {name}"` |
| Delete | `button "Delete {program name}"` |
| Empty semester panel | Select a program to manage semesters |

**Shared program modal** (`role="dialog"`)

| Control | Create | Edit (Confluence + same form) |
|---|---|---|
| Title | `heading "New Program"` | `heading "Edit Program"` |
| Name | `textbox "Program Name"` — label **Program Name \***, placeholder `e.g. Computer Science BSc` | pre-populated |
| Description | `textbox "Description"` — placeholder `Brief description` | pre-populated |
| AI toggle | `button "▸ Show AI Generation Config"` | same |
| AI fields | **Total Program Hours**, **Default Session Hours** (default `4`), **Default Exam Hours** (default `3`), **Target Audience**, **Focus Areas**, **Sync/Async Ratio** slider (default 70% sync) | same, pre-populated |
| Dismiss | `button "Cancel"`; unlabeled close in dialog banner; overlay click | same |
| Submit | `button "Create"` (disabled while name empty) | `button "Save"` (disabled while name empty) |

No `maxlength` attribute on Name or Description. API list: `GET /api/programs`. Updates expected on `PUT`/`PATCH /api/programs/{id}`.

## Jira Acceptance Criteria

```gherkin
Scenario: Open program for editing
  Given I am on the Programs page
  And a program "Web Development 2026" exists
  When I click the edit icon on "Web Development 2026"
  Then I see the edit form pre-populated with the program's current data

Scenario: Successfully edit a program name
  Given I am editing "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows "Web Development 2026 - Updated"

Scenario: Edit preserves unchanged fields
  Given I am editing a program
  When I only change the Description
  And I click Save
  Then the Name and other fields remain unchanged
```

---

## Positive Flows

### TC-001 — Edit form opens pre-populated with current program data

**Priority:** High  
**Maps to:** AC-1

**Preconditions**
- User is logged in as admin
- A unique program exists (created in setup) with Program Name **Web Development 2026 {timestamp}** and Description **Full-stack web development program**
- User is on `/programs`

**Steps**
1. Locate the program row whose first cell paragraph exactly matches the unique name
2. Click **Edit {program name}** (pencil ActionIcon)

**Expected result**
- `role="dialog"` opens with heading **Edit Program**
- **Program Name** is pre-populated with the unique name
- **Description** is pre-populated with **Full-stack web development program**
- **Save** is visible and enabled
- **Cancel** is visible
- **▸ Show AI Generation Config** is present
- Default Session Hours is **4**, Default Exam Hours is **3** (form defaults when those fields were not set on create)

**Gherkin**
```gherkin
Feature: Edit existing program details

  Scenario: Open program for editing
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026 {timestamp}" exists with Description "Full-stack web development program"
    When I click the "Edit Web Development 2026 {timestamp}" button
    Then I see the "Edit Program" modal
    And Program Name is pre-populated with "Web Development 2026 {timestamp}"
    And Description is pre-populated with "Full-stack web development program"
    And I see the Save button
```

---

### TC-002 — Program name update is saved and reflected in the program list immediately

**Priority:** High  
**Maps to:** AC-2

**Preconditions**
- User is logged in as admin
- Unique program **Web Development 2026 {timestamp}** exists
- User is editing that program

**Steps**
1. Change **Program Name** to **Web Development 2026 {timestamp} - Updated** (keep total length ≤ 100)
2. Click **Save**

**Expected result**
- Modal closes without a page reload
- Program list shows a row whose name paragraph is exactly **Web Development 2026 {timestamp} - Updated**
- The previous exact name is gone
- No error alert is displayed

**Gherkin**
```gherkin
  Scenario: Successfully edit a program name
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "Web Development 2026 {timestamp} - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 {timestamp} - Updated"
    And the program list does not show "Web Development 2026 {timestamp}"
```

---

### TC-003 — Unchanged fields are preserved when only Description is edited

**Priority:** High  
**Maps to:** AC-3

**Preconditions**
- User is logged in as admin
- Unique program exists with Description **Full-stack web development program** and default AI config
- User is editing that program

**Steps**
1. Leave **Program Name** unchanged
2. Change **Description** to **Full-stack web development program — revised curriculum**
3. Leave AI Generation Config fields unchanged
4. Click **Save**
5. Re-open the edit modal

**Expected result**
- Modal closes after Save
- List still shows the original Program Name
- Re-opened form shows the new Description
- Default Session Hours is still **4**, Default Exam Hours is still **3**, Sync/Async Ratio still **70% sync**

**Gherkin**
```gherkin
  Scenario: Edit preserves unchanged fields
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}" with Description "Full-stack web development program"
    When I only change Description to "Full-stack web development program — revised curriculum"
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 {timestamp}"
    And the program has Description "Full-stack web development program — revised curriculum"
    And Default Session Hours is still "4"
    And Default Exam Hours is still "3"
```

---

### TC-004 — Description-only edit succeeds on a program that had an empty Description

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **Data Science Fundamentals {timestamp}** exists with empty Description (row has only the name paragraph)

**Steps**
1. Open **Edit {name}**
2. Enter **Introductory data science track** in **Description**
3. Leave **Program Name** unchanged
4. Click **Save**

**Expected result**
- Modal closes
- List shows the same Program Name
- Re-opened form has Description **Introductory data science track**

**Gherkin**
```gherkin
  Scenario: Successfully edit Description on program with empty Description
    Given I am logged in as admin
    And I am editing "Data Science Fundamentals {timestamp}" with an empty Description
    When I fill in Description with "Introductory data science track"
    And I click Save
    Then the modal closes
    And the program list shows "Data Science Fundamentals {timestamp}"
    And the program has Description "Introductory data science track"
```

---

### TC-005 — Save with no changes keeps program data unchanged

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists with Description **Full-stack web development program**
- User is editing that program

**Steps**
1. Do not modify any fields
2. Click **Save**

**Expected result**
- Modal closes
- List still shows the same name and description
- Re-opened form values match the originals
- Save is enabled when name is non-empty even if nothing changed (Confluence only disables Save for empty name)

**Gherkin**
```gherkin
  Scenario: Save without changes keeps program data intact
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}" with Description "Full-stack web development program"
    When I click Save without changing any fields
    Then the modal closes
    And the program list shows "Web Development 2026 {timestamp}"
    And the program still has Description "Full-stack web development program"
```

---

## Negative Flows

### TC-006 — Empty Program Name prevents save

**Priority:** High

**Preconditions**
- User is logged in as admin
- Unique program exists
- User is editing that program

**Steps**
1. Clear **Program Name**
2. Observe **Save**

**Expected result**
- **Save** is disabled
- Modal stays open
- List still shows the original name

**Gherkin**
```gherkin
  Scenario: Validation prevents empty Program Name on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I clear the Program Name field
    Then the Save button is disabled
    And the program list still shows "Web Development 2026 {timestamp}"
```

---

### TC-007 — Whitespace-only Program Name is rejected on edit

**Priority:** High

**Preconditions**
- User is logged in as admin
- Unique program exists
- User is editing that program

**Steps**
1. Replace **Program Name** with `"   "` (spaces only)
2. Attempt to click **Save** if it is enabled

**Expected result**
- Name is treated as empty after trim: **Save** is disabled, or submit is blocked and the modal stays open
- Original name is not overwritten in the list

**Gherkin**
```gherkin
  Scenario: Whitespace-only Program Name is rejected on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "   "
    Then the Save button is disabled
    And the program list still shows "Web Development 2026 {timestamp}"
```

---

### TC-008 — Duplicate Program Name is not allowed on edit

**Priority:** High

**Preconditions**
- User is logged in as admin
- Two unique programs exist: **Web Development 2026 {t1}** and **Cloud Computing 2026 {t2}**
- User is editing **Cloud Computing 2026 {t2}**

**Steps**
1. Change **Program Name** to the exact name of the first program
2. Click **Save**

**Expected result**
- Server returns 400/409
- Error is displayed to the user
- Modal remains open (or reopens with the attempted name)
- List still contains both original names as separate rows (count of the first name stays 1)

**Gherkin**
```gherkin
  Scenario: Duplicate program name is rejected on edit
    Given I am logged in as admin
    And the program list contains "Web Development 2026 {t1}"
    And the program list contains "Cloud Computing 2026 {t2}"
    And I am editing "Cloud Computing 2026 {t2}"
    When I change Program Name to "Web Development 2026 {t1}"
    And I click Save
    Then I see a validation error for duplicate Program Name
    And the program list contains "Cloud Computing 2026 {t2}"
    And the program list contains exactly one row named "Web Development 2026 {t1}"
```

---

### TC-009 — Canceling edit does not persist changes

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists with Description **Full-stack web development program**
- User is editing that program

**Steps**
1. Change **Program Name** to **Should Not Be Saved {timestamp}**
2. Change **Description** to **Temporary edit**
3. Click **Cancel**

**Expected result**
- Modal closes
- List still shows the original name and description
- Re-opened form matches the originals

**Gherkin**
```gherkin
  Scenario: Canceling edit does not persist changes
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}" with Description "Full-stack web development program"
    When I change Program Name to "Should Not Be Saved {timestamp}"
    And I change Description to "Temporary edit"
    And I click Cancel
    Then the modal closes
    And the program list shows "Web Development 2026 {timestamp}"
    And the program still has Description "Full-stack web development program"
```

---

### TC-010 — Viewer cannot edit a program

**Priority:** High

**Preconditions**
- Admin has created a unique program
- User signs out and signs in as viewer (`DIDAXIS_NON_ADMIN_EMAIL`)

**Steps**
1. Navigate to `/programs`
2. Locate the unique program
3. Look for **Edit {name}**

**Expected result**
- **+ New Program** may be hidden for VIEWER
- **Edit {name}** is not visible
- Edit form is not accessible
- Program cannot be modified

**Gherkin**
```gherkin
  Scenario: Viewer cannot edit a program
    Given I am logged in as a viewer
    And I am on the Programs page
    And a program "Web Development 2026 {timestamp}" exists
    Then I do not see an "Edit Web Development 2026 {timestamp}" button
    And I cannot access the program edit form
```

---

### TC-011 — Server/API failure does not corrupt program data

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists
- `PUT`/`PATCH` to `/api/programs/**` is mocked to return 500

**Steps**
1. Open edit
2. Change **Program Name** to **{original} - Failed Save**
3. Click **Save**

**Expected result**
- Error is displayed
- Modal stays open (or values remain)
- List still shows the original name
- Failed name does not appear as a new row

**Gherkin**
```gherkin
  Scenario: Failed save does not update program list
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    And the save program API will fail
    When I change Program Name to "Web Development 2026 {timestamp} - Failed Save"
    And I click Save
    Then I see an error message indicating the save failed
    And the program list still shows "Web Development 2026 {timestamp}"
```

---

## Edge Cases

### TC-012 — Program Name at minimum valid length (1 character) on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists with a unique Description used to identify the row after rename

**Steps**
1. Change **Program Name** to **A**
2. Click **Save**

**Expected result**
- Modal closes
- List shows a row with name **A** and the unique Description

**Gherkin**
```gherkin
  Scenario: Minimum-length Program Name is accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "A"
    And I click Save
    Then the modal closes
    And the program list shows "A" with the original unique Description
```

---

### TC-013 — Program Name at maximum allowed length (100 characters) on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists

**Steps**
1. Change **Program Name** to a 100-character unique string
2. Click **Save**

**Expected result**
- Modal closes
- List shows the 100-character name exactly

**Gherkin**
```gherkin
  Scenario: Maximum-length Program Name is accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to a 100-character string
    And I click Save
    Then the modal closes
    And the program list shows the 100-character program name
```

---

### TC-014 — Program Name exceeding maximum length (101 characters) is rejected on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists

**Steps**
1. Change **Program Name** to a 101-character string
2. Click **Save** if enabled

**Expected result**
- Validation / 400 error for Program Name
- Modal stays open
- Original name remains in the list
- 101-character name does not appear as a row

**Gherkin**
```gherkin
  Scenario: Program Name over maximum length is rejected on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to a 101-character string
    And I click Save
    Then I see a validation error for Program Name
    And the program list still shows "Web Development 2026 {timestamp}"
```

---

### TC-015 — Special characters in Program Name are handled correctly on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists

**Steps**
1. Change **Program Name** to **C++ & AI/ML (2026) {timestamp}** (length ≤ 100)
2. Click **Save**

**Expected result**
- Modal closes
- List shows **C++ & AI/ML (2026) {timestamp}** exactly (including `+`, `&`, `/`, parentheses)

**Gherkin**
```gherkin
  Scenario: Special characters in Program Name are accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "C++ & AI/ML (2026) {timestamp}"
    And I click Save
    Then the modal closes
    And the program list shows "C++ & AI/ML (2026) {timestamp}"
```

---

### TC-016 — Unicode and emoji in Program Name are handled correctly on edit

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Unique program exists

**Steps**
1. Change **Program Name** to **日本語プログラム 🎓 {timestamp}**
2. Click **Save**

**Expected result**
- Modal closes
- List displays **日本語プログラム 🎓 {timestamp}** correctly

**Gherkin**
```gherkin
  Scenario: Unicode and emoji in Program Name are accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "日本語プログラム 🎓 {timestamp}"
    And I click Save
    Then the modal closes
    And the program list shows "日本語プログラム 🎓 {timestamp}"
```

---

### TC-017 — Leading and trailing spaces in Program Name are trimmed on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists

**Steps**
1. Change **Program Name** to `"  Cloud Computing 2026 {timestamp}  "`
2. Click **Save**

**Expected result**
- Saved name is trimmed **Cloud Computing 2026 {timestamp}**
- List shows the trimmed name (exact match on the first cell paragraph, no leading/trailing spaces)

**Gherkin**
```gherkin
  Scenario: Leading and trailing spaces are trimmed from Program Name on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "  Cloud Computing 2026 {timestamp}  "
    And I click Save
    Then the modal closes
    And the program list shows "Cloud Computing 2026 {timestamp}"
```

---

### TC-018 — Description can be cleared on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists with Description **Full-stack web development program**

**Steps**
1. Clear **Description**
2. Leave **Program Name** unchanged
3. Click **Save**

**Expected result**
- Modal closes
- Name unchanged
- Re-opened form has empty Description
- Row may show only the name paragraph (no description preview)

**Gherkin**
```gherkin
  Scenario: Description can be cleared on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}" with Description "Full-stack web development program"
    When I clear the Description field
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 {timestamp}"
    And the program has an empty Description
```

---

### TC-019 — Description at maximum allowed length (500 characters) is accepted on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **Cybersecurity Bootcamp {timestamp}** exists

**Steps**
1. Change **Description** to a 500-character string
2. Click **Save**
3. Re-open edit (do not assert the full 500 characters against the list preview)

**Expected result**
- Modal closes
- Re-opened Description value has length 500

**Gherkin**
```gherkin
  Scenario: Maximum-length Description is accepted on edit
    Given I am logged in as admin
    And I am editing "Cybersecurity Bootcamp {timestamp}"
    When I change Description to a 500-character string
    And I click Save
    Then the modal closes
    And the program Description is 500 characters
```

---

### TC-020 — Description exceeding maximum length (501 characters) is rejected on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists with a short Description

**Steps**
1. Change **Description** to a 501-character string
2. Click **Save** if enabled

**Expected result**
- 400 error / validation for Description
- Modal stays open
- Original description is unchanged

**Gherkin**
```gherkin
  Scenario: Description over maximum length is rejected on edit
    Given I am logged in as admin
    And I am editing "Cybersecurity Bootcamp {timestamp}"
    When I change Description to a 501-character string
    And I click Save
    Then I see a validation error for Description
    And the program Description is unchanged
```

---

### TC-021 — Case-only Program Name change on the same program is saved

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Unique program **Web Development 2026 {timestamp}** exists (mixed case)

**Steps**
1. Change **Program Name** to the same string in all lowercase
2. Click **Save**

**Expected result**
- This is an update of the **same** record, not a duplicate of another program
- Modal closes
- List shows the lowercase name
- Still exactly one row for that program

**Gherkin**
```gherkin
  Scenario: Case-only Program Name change on the same program is saved
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "web development 2026 {timestamp}"
    And I click Save
    Then the modal closes
    And the program list shows "web development 2026 {timestamp}"
    And there is exactly one matching program row
```

---

### TC-022 — Double-clicking Save updates the program once

**Priority:** High

**Preconditions**
- User is logged in as admin
- Unique program exists

**Steps**
1. Change **Program Name** to **Double Click Guard {timestamp}**
2. Double-click **Save**

**Expected result**
- Only one update is applied
- Modal closes
- Exactly one list row has the new name (no duplicate row, no stuck-open modal)

**Gherkin**
```gherkin
  Scenario: Double-clicking Save updates the program only once
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "Double Click Guard {timestamp}"
    And I double-click Save
    Then the modal closes
    And the program list shows exactly one row named "Double Click Guard {timestamp}"
```

---

### TC-023 — Closing the edit modal via X or Escape does not persist changes

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists
- User is editing that program

**Steps**
1. Change **Program Name** to **Unsaved Via X {timestamp}**
2. Click the unlabeled close button in the dialog banner, or press Escape

**Expected result**
- Modal closes
- List does not show **Unsaved Via X {timestamp}**
- Original name remains

**Gherkin**
```gherkin
  Scenario: Closing edit modal via X does not persist changes
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "Unsaved Via X {timestamp}"
    And I close the modal with Escape or the banner close button
    Then the modal closes
    And the program list does not show "Unsaved Via X {timestamp}"
```

---

### TC-024 — HTML / script text in Program Name is stored as literal text

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program exists

**Steps**
1. Change **Program Name** to `<b>DS2 {timestamp}</b>`
2. Click **Save**

**Expected result**
- Value is stored and shown as literal text, not rendered as HTML
- List row name paragraph text equals `<b>DS2 {timestamp}</b>`
- No script execution / navigation

**Gherkin**
```gherkin
  Scenario: HTML in Program Name is stored as literal text
    Given I am logged in as admin
    And I am editing "Web Development 2026 {timestamp}"
    When I change Program Name to "<b>DS2 {timestamp}</b>"
    And I click Save
    Then the modal closes
    And the program list shows the literal text "<b>DS2 {timestamp}</b>"
```

---

### TC-025 — Renaming to another program's name with different casing is rejected

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Programs **Alpha Track {t1}** and **Beta Track {t2}** exist
- User is editing **Beta Track {t2}**

**Steps**
1. Change **Program Name** to **alpha track {t1}** (same letters as Alpha, different case)
2. Click **Save**

**Expected result**
- Uniqueness is per organization. If the product treats names as case-insensitive, save is rejected and both original rows remain.
- If the product is case-sensitive, save may succeed — **this is a documented AC gap**; the automated test asserts rejection so a silent collision cannot ship unnoticed. A product decision to allow case-distinct names should update this case, not skip it.

**Gherkin**
```gherkin
  Scenario: Case-variant of another program name is rejected on edit
    Given I am logged in as admin
    And the program list contains "Alpha Track {t1}"
    And I am editing "Beta Track {t2}"
    When I change Program Name to "alpha track {t1}"
    And I click Save
    Then I see a validation error for duplicate Program Name
    And the program list still contains "Beta Track {t2}"
```

---

### TC-026 — Clicking the program row does not open the edit modal

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Unique program exists
- User is on `/programs`

**Steps**
1. Click the program **row** (name cell), not the Edit button
2. Observe the dialog and the semester panel

**Expected result**
- **Edit Program** modal does not open
- Semester panel is no longer the placeholder **Select a program to manage semesters** (row selection)

**Gherkin**
```gherkin
  Scenario: Clicking a program row selects it instead of opening edit
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026 {timestamp}" exists
    When I click the program row for "Web Development 2026 {timestamp}"
    Then I do not see the "Edit Program" modal
    And I do not see "Select a program to manage semesters"
```

---

## Coverage Summary

| AC | Test ID |
|---|---|
| Open program for editing (form pre-populated) | TC-001 |
| Successfully edit a program name (list updates immediately) | TC-002 |
| Edit preserves unchanged fields | TC-003 |

| Category | Test IDs | Count |
|---|---|---|
| Positive flows | TC-001 – TC-005 | 5 |
| Negative flows | TC-006 – TC-011 | 6 |
| Edge cases | TC-012 – TC-026 | 15 |
| **Total** | | **26** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Field label** — Jira says **Name**; UI label is **Program Name \***. Tests use the UI label.
2. **“Other fields”** — AC-3 does not list AI Generation Config. Confluence includes Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, Sync/Async Ratio. TC-003 asserts the numeric defaults.
3. **Max length** — Not in Jira. Confluence: Name **100**, Description **500**. Previous plan used 255/2000 — **corrected**. Live app has no `maxlength` and currently stores over-limit values (known gap vs spec).
4. **Duplicates** — Not in Jira. Confluence: unique per org, 400/409 + error. Live list already contains duplicate names.
5. **Case sensitivity** of uniqueness is still undefined. TC-021 (same record) vs TC-025 (other record).
6. **Edit control** — Jira says “edit icon”. Live control is `button "Edit {name}"` (pencil SVG), not a ✏️ emoji and not a text button.
7. **Create button label** — Header is **+ New Program**, not **New Program**.
8. **How to verify Description** — List shows a preview paragraph; long values should be asserted by re-opening the edit form.
9. **Save with no dirty fields** — Confluence only disables Save when name is empty; Save remains enabled when nothing changed.
10. **Double-submit** — Not in Jira/Confluence. Live reports of duplicate PATCH on double-click Save; TC-022 makes this a requirement.
11. **Success toast** — None specified; modal close + list refresh is the signal.
12. **Viewer vs editor** — Jira assumes admin. Viewer credentials are used for TC-010. EDITOR is not separately tested (no dedicated account in `.env`).
13. **Concurrent edits** — Still unspecified.
14. **Linked semesters/courses** — Unclear whether rename affects child records; out of scope for DS-2 UI tests.

## Known mismatches vs previous DS-2 plan (fixed in this revision)

| Previous assumption | Live / Confluence reality |
|---|---|
| Program Name max 255 / reject 256 | Max **100** / reject **101** |
| Description 2000 either-or | Max **500** / reject **501** (two explicit cases) |
| Button **New Program** | **+ New Program** |
| Generic “edit icon” | `aria-label="Edit {program name}"` pencil ActionIcon |
| Singleton **Web Development 2026** | Must use unique timestamped names; list already has hundreds of variants |
| Description-only = name only | Also preserve AI Generation Config defaults |
| No double-click / X-close / HTML / row-click cases | Added TC-022, TC-023, TC-024, TC-026 |
