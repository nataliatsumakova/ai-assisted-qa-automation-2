# DS-1 — Ticket Output: Test Cases for Create New Academic Program

**Jira:** [DS-1](https://legionqaschool.atlassian.net/browse/DS-1) — Create new academic program  
**Environment:** https://test.didaxis.studio  
**Confluence:** [Architecture Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233013249/Architecture+Overview), Program Setup — Field Definitions, Validation Rules, UI Behavior  
**Last verified:** 2026-09-07 — tests aligned strictly to Jira ACs; failures logged as DS-1 sub-tasks

## Test policy

- **Jira ACs are strict requirements.** Tests must not bypass failures (`test.fail`, `test.skip` for known bugs).
- If the app does not meet an AC, the test **fails** and a **sub-task** is filed under [DS-1](https://legionqaschool.atlassian.net/browse/DS-1).
- Extended tests (Confluence) follow the same rule — no bypasses.

## Jira bugs logged (2026-09-07)

| Sub-task | Test | AC / requirement | Status |
|---|---|---|---|
| [DS-216](https://legionqaschool.atlassian.net/browse/DS-216) | AC-2 | Single Create adds multiple rows | Open |
| [DS-217](https://legionqaschool.atlassian.net/browse/DS-217) | TC-018 | Double-click Create creates duplicates | Open |

Evidence screenshots: `evidence/DS-1/`

## Confluence — Architecture Overview (summary)

Didaxis Studio uses a **three-layer architecture** separating curriculum intent from schedule and student workload:

| Layer | Purpose | Example |
|---|---|---|
| Layer 1 — Session Templates | Curriculum structure without dates | Lecture: Introduction to Java |
| Layer 2 — Scheduled Sessions | Calendar entries with `source` (MANUAL \| GENERATED \| TEMPLATE) and `status` (LOCKED \| PLANNED) | Sep 8 — Java Lecture — Room 301 |
| Layer 3 — Assignments | Student deliverables with assigned/due dates and estimated hours | Lab Report due Sep 15 |

**Key invariants:** Calendar is the live data source; MANUAL/LOCKED sessions are immovable anchors; validation runs after every mutation (debounced 500 ms); generator is deterministic.

Programs created via DS-1 are the top-level container that feeds this architecture (semesters → courses → session templates).

## Jira Acceptance Criteria

```gherkin
Scenario: Navigate to program creation form
  Given I am logged in as admin
  When I navigate to the Programs page
  And I click "+ New Program"
  Then I see the program creation form with fields: Program Name, Description

Scenario: Successfully create a program
  Given I am on the program creation form
  When I fill in Program Name with "Web Development 2026"
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the modal closes
  And the program list shows "Web Development 2026"

Scenario: Validation prevents empty program name
  Given I am on the program creation form
  When I leave the Program Name field empty
  Then the Create button is disabled
```

---

## Positive Flows

### TC-001 — Program creation form is displayed from Programs page

**Priority:** High

**Preconditions**
- User is logged in as admin
- User has permission to create programs

**Steps**
1. Navigate to `/programs`
2. Click **+ New Program**

**Expected result**
- Page heading **Programs** with subtitle **Manage academic programs and semesters**
- **+ New Program** button visible in header
- Program table with column header **Program** (name + description preview per row)
- Semester panel placeholder: **Select a program to manage semesters**
- **New Program** modal (`role="dialog"`) opens with heading **New Program**
- **Program Name \*** field visible (placeholder: `e.g. Computer Science BSc`)
- **Description** field visible (placeholder: `Brief description`)
- **Create** button visible and disabled while name is empty
- **Cancel** button visible
- Collapsible **▸ Show AI Generation Config** toggle present

**Gherkin**
```gherkin
Feature: Create new academic program

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    Then I see the heading "Programs" and subtitle "Manage academic programs and semesters"
    And I see the "+ New Program" button
    When I click "+ New Program"
    Then I see the "New Program" modal with fields: Program Name, Description
    And I see the "Show AI Generation Config" collapsible section
```

---

### TC-002 — Valid program is created and appears in the program list

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Web Development 2026** in **Program Name**
2. Enter **Full-stack web development program** in **Description**
3. Click **Create**

**Expected result**
- Modal closes
- Program list refreshes and shows **Web Development 2026** with the description
- No error message is displayed

**Gherkin**
```gherkin
  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"
```

---

### TC-003 — Create button is disabled when Program Name is empty

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Leave **Program Name** empty
2. Observe the **Create** button state

**Expected result**
- **Create** button is disabled
- Program is not created
- Modal remains open

**Gherkin**
```gherkin
  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled
```

---

### TC-004 — Program can be created with Program Name only (Description empty)

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Data Science Fundamentals** in **Program Name**
2. Leave **Description** empty
3. Click **Create**

**Expected result**
- Modal closes
- Program list shows **Data Science Fundamentals**
- No validation error for empty **Description**

**Gherkin**
```gherkin
  Scenario: Create program with only Program Name filled
    Given I am on the program creation form
    When I fill in Program Name with "Data Science Fundamentals"
    And I leave the Description field empty
    And I click Create
    Then the modal closes
    And the program list shows "Data Science Fundamentals"
```

---

### TC-005 — AI Generation Config section expands to show optional fields

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Observe the **▸ Show AI Generation Config** toggle (collapsed by default)
2. Click the toggle to expand
3. Observe the expanded fields and default values

**Expected result**
- Toggle label changes to **▾ Hide AI Generation Config** when expanded
- Section shows: **Total Program Hours** (placeholder `e.g. 900`), **Default Session Hours** (default `4`), **Default Exam Hours** (default `3`), **Target Audience**, **Focus Areas**, **Sync/Async Ratio** slider (default **70% sync / 30% async**)
- All AI fields are optional for program creation; **Total Program Hours** is required only for the separate **Generate Curriculum** feature
- Program can still be created with only **Program Name** filled

**Gherkin**
```gherkin
  Scenario: AI Generation Config section is collapsible
    Given I am on the program creation form
    When I click "Show AI Generation Config"
    Then I see optional fields: Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, Sync/Async Ratio
    And Default Session Hours defaults to 4
    And Default Exam Hours defaults to 3
    And Sync/Async Ratio shows "70% sync / 30% async"
```

---

## Negative Flows

### TC-006 — Program is not created when Program Name contains only whitespace

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **"   "** (spaces only) in **Program Name**
2. Enter **Introductory course track** in **Description**
3. Attempt to click **Create**

**Expected result**
- **Create** button remains disabled (name is trimmed client-side; empty after trim)
- Program is not created
- Modal remains open

**Gherkin**
```gherkin
  Scenario: Whitespace-only Program Name is rejected
    Given I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Introductory course track"
    Then the Create button is disabled
    And no new program appears in the program list
```

---

### TC-007 — Duplicate program name is not allowed

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** already exists in the program list

**Steps**
1. Click **+ New Program**
2. Enter **Web Development 2026** in **Program Name**
3. Enter **Duplicate attempt** in **Description**
4. Click **Create**

**Expected result**
- Modal remains open (or error feedback is shown)
- Server returns 400/409; error message indicates duplicate name
- Program list contains exactly one **Web Development 2026** entry

**Gherkin**
```gherkin
  Scenario: Duplicate program name is rejected
    Given I am logged in as admin
    And the program list contains "Web Development 2026"
    When I navigate to the Programs page
    And I click "+ New Program"
    And I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Duplicate attempt"
    And I click Create
    Then I see a validation error for duplicate Program Name
    And the program list contains exactly one "Web Development 2026"
```

> **Verified 2026-09-06:** Duplicate names are rejected — modal stays open and only one row exists. (Previously tracked as [DS-13](https://legionqaschool.atlassian.net/browse/DS-13).)

---

### TC-008 — Canceling the form does not create a program

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Temporary Program** in **Program Name**
2. Enter **Should not be saved** in **Description**
3. Click **Cancel**

**Expected result**
- Modal closes
- **Temporary Program** does not appear in the program list

**Gherkin**
```gherkin
  Scenario: Canceling form does not persist program
    Given I am on the program creation form
    When I fill in Program Name with "Temporary Program"
    And I fill in Description with "Should not be saved"
    And I click Cancel
    Then the modal closes
    And the program list does not show "Temporary Program"
```

---

### TC-009 — Non-admin user cannot access program creation

**Priority:** High

**Preconditions**
- User is logged in as a viewer (non-admin/non-editor role)

**Steps**
1. Navigate to `/programs`
2. Look for **+ New Program** or **Create Program** controls

**Expected result**
- **+ New Program** button is not visible
- **Create Program** empty-state button is not visible
- Program creation form is not accessible

**Gherkin**
```gherkin
  Scenario: Non-admin cannot create a program
    Given I am logged in as a viewer user
    When I navigate to the Programs page
    Then I do not see the "+ New Program" button
    And I do not see the "Create Program" button
    And I cannot access the program creation form
```

---

## Edge Cases

### TC-010 — Program Name at minimum valid length (1 character)

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **A** in **Program Name**
2. Enter **Single-character name boundary test** in **Description**
3. Click **Create**

**Expected result**
- Program is created successfully
- Program list shows **A**

**Gherkin**
```gherkin
  Scenario: Minimum-length Program Name is accepted
    Given I am on the program creation form
    When I fill in Program Name with "A"
    And I fill in Description with "Single-character name boundary test"
    And I click Create
    Then the modal closes
    And the program list shows "A"
```

---

### TC-011 — Program Name at maximum allowed length (100 characters)

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter a **Program Name** of exactly 100 characters
2. Enter **Maximum length boundary test** in **Description**
3. Click **Create**

**Expected result**
- Program is created successfully
- Program list shows the 100-character name

**Gherkin**
```gherkin
  Scenario: Maximum-length Program Name is accepted
    Given I am on the program creation form
    When I fill in Program Name with a 100-character string
    And I fill in Description with "Maximum length boundary test"
    And I click Create
    Then the modal closes
    And the program list shows the 100-character program name
```

---

### TC-012 — Program Name exceeding maximum length is rejected

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter a **Program Name** of 101 characters
2. Enter **Over max length test** in **Description**
3. Click **Create**

**Expected result**
- Server returns 400; error message is displayed
- Program is not created
- Modal remains open

**Gherkin**
```gherkin
  Scenario: Program Name over maximum length is rejected
    Given I am on the program creation form
    When I fill in Program Name with a 101-character string
    And I fill in Description with "Over max length test"
    And I click Create
    Then I see a validation error for Program Name
    And the program list does not show the entered program name
```

> **Verified 2026-09-06:** Names over 100 characters are rejected — modal stays open and program is not listed. (Previously tracked as [DS-78](https://legionqaschool.atlassian.net/browse/DS-78).)

---

### TC-013 — Special characters in Program Name are handled correctly

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **C++ & AI/ML (2026)** in **Program Name**
2. Enter **Special characters in name** in **Description**
3. Click **Create**

**Expected result**
- Program is created successfully
- Program list shows **C++ & AI/ML (2026)** exactly as entered

**Gherkin**
```gherkin
  Scenario: Special characters in Program Name are accepted
    Given I am on the program creation form
    When I fill in Program Name with "C++ & AI/ML (2026)"
    And I fill in Description with "Special characters in name"
    And I click Create
    Then the modal closes
    And the program list shows "C++ & AI/ML (2026)"
```

---

### TC-014 — Unicode and emoji in Program Name are handled correctly

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **日本語プログラム 🎓** in **Program Name**
2. Enter **Unicode and emoji support test** in **Description**
3. Click **Create**

**Expected result**
- Program is created successfully
- Program list displays **日本語プログラム 🎓** correctly

**Gherkin**
```gherkin
  Scenario: Unicode and emoji in Program Name are accepted
    Given I am on the program creation form
    When I fill in Program Name with "日本語プログラム 🎓"
    And I fill in Description with "Unicode and emoji support test"
    And I click Create
    Then the modal closes
    And the program list shows "日本語プログラム 🎓"
```

---

### TC-015 — Leading and trailing spaces in Program Name are trimmed

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **"  Cloud Computing 2026  "** in **Program Name**
2. Enter **Trim whitespace test** in **Description**
3. Click **Create**

**Expected result**
- Program is created with trimmed name **Cloud Computing 2026**
- Program list shows **Cloud Computing 2026** (without leading/trailing spaces)

**Gherkin**
```gherkin
  Scenario: Leading and trailing spaces are trimmed from Program Name
    Given I am on the program creation form
    When I fill in Program Name with "  Cloud Computing 2026  "
    And I fill in Description with "Trim whitespace test"
    And I click Create
    Then the modal closes
    And the program list shows "Cloud Computing 2026"
```

---

### TC-016 — Description at maximum allowed length (500 characters) is accepted

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Cybersecurity Bootcamp** in **Program Name**
2. Enter a **Description** of exactly 500 characters
3. Click **Create**

**Expected result**
- Program is created successfully
- Program list shows **Cybersecurity Bootcamp**

**Gherkin**
```gherkin
  Scenario: Description at maximum length is accepted
    Given I am on the program creation form
    When I fill in Program Name with "Cybersecurity Bootcamp"
    And I fill in Description with a 500-character string
    And I click Create
    Then the modal closes
    And the program list shows "Cybersecurity Bootcamp"
```

---

### TC-017 — Description exceeding maximum length (501 characters) is rejected

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Cybersecurity Bootcamp** in **Program Name**
2. Enter a **Description** of 501 characters
3. Click **Create**

**Expected result**
- Server returns 400; error message is displayed
- Program is not created
- Modal remains open

**Gherkin**
```gherkin
  Scenario: Description over maximum length is rejected
    Given I am on the program creation form
    When I fill in Program Name with "Cybersecurity Bootcamp"
    And I fill in Description with a 501-character string
    And I click Create
    Then I see a validation error for Description
    And the program list does not show "Cybersecurity Bootcamp"
```

---

### TC-018 — Double-clicking Create creates only one program

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter a unique **Program Name**
2. Double-click **Create**

**Expected result**
- Exactly one program with that name appears in the list
- Modal closes after the first successful create

**Gherkin**
```gherkin
  Scenario: Double-click Create is idempotent
    Given I am on the program creation form
    When I fill in Program Name with a unique name
    And I double-click Create
    Then the program list contains exactly one program with that name
```

> **Known app defect ([DS-110](https://legionqaschool.atlassian.net/browse/DS-110)):** Double-clicking Create currently creates duplicate programs (verified 2026-09-06).

---

### TC-019 — Create button re-disables when Program Name is cleared

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Temporary Name** in **Program Name**
2. Verify **Create** becomes enabled
3. Clear **Program Name**
4. Observe **Create** button state

**Expected result**
- **Create** button is disabled again after the name field is cleared

**Gherkin**
```gherkin
  Scenario: Create button disables when Program Name is cleared
    Given I am on the program creation form
    When I fill in Program Name with "Temporary Name"
    Then the Create button is enabled
    When I clear the Program Name field
    Then the Create button is disabled
```

---

### TC-020 — Modal closes via X button without saving

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Unsaved Via X** in **Program Name**
2. Press **Escape** or click the modal **X** (close) button

**Expected result**
- Modal closes
- **Unsaved Via X** does not appear in the program list

**Gherkin**
```gherkin
  Scenario: Closing modal via X does not persist program
    Given I am on the program creation form
    When I fill in Program Name with "Unsaved Via X"
    And I close the modal with Escape or the close button
    Then the modal closes
    And the program list does not show "Unsaved Via X"
```

---

### TC-021 — Program row shows edit and delete actions with accessible names

**Priority:** Low

**Preconditions**
- User is logged in as admin
- At least one program exists in the list

**Steps**
1. Navigate to `/programs`
2. Locate a program row (e.g. **Web Development 2026**)
3. Inspect action buttons on the row

**Expected result**
- Row shows **Edit {program name}** and **Delete {program name}** buttons
- Clicking a row selects it for the semester panel

**Gherkin**
```gherkin
  Scenario: Program rows expose edit and delete actions
    Given I am logged in as admin
    And the program list contains "Web Development 2026"
    When I navigate to the Programs page
    Then I see an "Edit Web Development 2026" button
    And I see a "Delete Web Development 2026" button
```

---

## Coverage Summary

| AC | Test ID |
|---|---|
| Navigate to program creation form | TC-001 |
| Successfully create a program | TC-002 |
| Validation prevents empty program name | TC-003 |

| Category | Test IDs | Count |
|---|---|---|
| Positive flows | TC-001 – TC-005 | 5 |
| Negative flows | TC-006 – TC-009 | 4 |
| Edge cases | TC-010 – TC-021 | 12 |
| **Total** | | **21** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Description required?** Resolved via Confluence — optional (max 500 characters).
2. **Max length** — Resolved via Confluence — Program Name max 100, Description max 500 (not in Jira ACs).
3. **Whitespace handling** — Resolved via Confluence — trimmed on submit; whitespace-only names blocked by disabled Create button.
4. **Duplicate names** — Resolved via Confluence — rejected server-side (400/409); not covered in Jira ACs.
5. **Permissions** — Resolved via Confluence — ADMIN and EDITOR can create; VIEWER cannot (Jira AC assumes admin only).
6. **AI Generation Config** — Optional collapsible fields not mentioned in Jira ACs; UI label is **Total Program Hours** (Confluence calls it **Total Hours**).
7. **Empty state** — When no programs exist, a **Create Program** button also appears (in addition to **+ New Program** in header).
8. **Success feedback** — No toast specified; list refresh is the confirmation signal per Confluence UI Behavior.
9. **Double-click idempotency** — Not in Jira ACs; observed as defect in live app ([DS-110](https://legionqaschool.atlassian.net/browse/DS-110)).
10. **Case sensitivity for duplicates** — Still undefined in docs.
11. **Description max-length UI** — No client-side maxlength on Description textarea; server rejects 501+ chars.

## Known App Defects (Live Exploration — 2026-09-07)

| Defect | Observed behavior | Jira sub-task |
|---|---|---|
| Single Create adds multiple programs | AC-2: 1 click → 3 rows with exact Jira name/description | [DS-216](https://legionqaschool.atlassian.net/browse/DS-216) |
| Double-click Create creates duplicates | TC-018: dblclick → 2 rows | [DS-217](https://legionqaschool.atlassian.net/browse/DS-217) |
