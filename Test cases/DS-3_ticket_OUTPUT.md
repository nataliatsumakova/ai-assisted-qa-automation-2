# DS-3 — Ticket Output: Test Cases for Program Name Validation and Duplicate Prevention

**Jira:** [DS-3](https://legionqaschool.atlassian.net/browse/DS-3) — Program name validation and duplicate prevention  
**Environment:** https://test.didaxis.studio  
**Confluence:** [Architecture Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233013249/Architecture+Overview), [Program Setup — Field Definitions](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233078785/Program+Setup+Field+Definitions), [Program Setup — Validation Rules](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233111553/Program+Setup+Validation+Rules), [Program Setup — UI Behavior](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233111568/Program+Setup+UI+Behavior)  
**Last verified:** 2026-09-09 — live Programs page explored via Playwright MCP; tests aligned to Jira ACs + Confluence; failures logged as bugs, not bypassed

## Test policy

- **Jira ACs are strict requirements.** Tests must not bypass failures (`test.fail`, `test.skip` for known bugs).
- If the app does not meet an AC or Confluence validation rule, the test **fails**.
- Use a **newly created unique program name** for every mutating case. Do not depend on a singleton **Web Development 2026** row — the live list already contains multiple exact copies and hundreds of similarly prefixed names.
- Duplicate / uniqueness error assertions must be **scoped to the create modal**. A page-wide `/duplicate|already exists|unique/` search matches unrelated table copy.

## Confluence — Architecture Overview (summary)

Pulled via Atlassian MCP from [Architecture Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233013249/Architecture+Overview) (page id `233013249`, space DS, version 1).

Didaxis Studio uses a **three-layer architecture** separating curriculum intent from schedule and student workload:

| Layer | Purpose | Example |
|---|---|---|
| Layer 1 — Session Templates | Curriculum structure without dates. Defines what sessions should exist. | Lecture: Introduction to Java, Lab: Build REST API |
| Layer 2 — Scheduled Sessions | Calendar entries with `source` (MANUAL \| GENERATED \| TEMPLATE) and `status` (LOCKED \| PLANNED) | Sep 8 — Java Lecture — Intro to Java — Room 301 |
| Layer 3 — Assignments | Student deliverables with `assigned_date`, `due_date`, `estimated_hours` (two calendar events) | Lab Report due Sep 15, 4 hours estimated |

**Key invariants:** Calendar is the live data source — changes propagate to hour totals, template status, and validation; MANUAL and LOCKED sessions are immovable anchors (generator cannot move them); validation runs after every mutation (debounced 500 ms); generator is deterministic (same inputs produce identical schedules).

Programs created via DS-3 are the top-level container that feeds this architecture (semesters → courses → session templates). Duplicate or whitespace-only names would pollute generated schedules.

## Confluence — Program Setup (rules used by these tests)

| Rule | Source | Expected on create |
|---|---|---|
| Program Name required, max **100** characters, unique per organization | Field Definitions + Validation Rules | Create disabled when empty; 101+ rejected with 400; duplicate name shows error (400/409) |
| Description optional, max **500** characters | Field Definitions + Validation Rules | Empty allowed; 501+ rejected |
| Name trimmed on submit; whitespace-only blocked | Validation Rules | Create disabled (or modal stays open, no submission) |
| Create disabled when Program Name is empty | UI Behavior + Field Definitions | Same for whitespace-only after trim |
| After create, list **must** refresh immediately (no manual reload) | UI Behavior | New name visible at top of table |
| Create control is **+ New Program**; modal title **New Program**; submit **Create** | UI Behavior | Accessible name: `+ New Program` |
| Collapsible **AI Generation Config** fields exist on create | Field Definitions | Optional; not required for DS-3 name validation |

## Live app locators (Playwright MCP — 2026-09-09)

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
| Edit | `button "Edit {program name}"` |
| Delete | `button "Delete {program name}"` |
| Empty semester panel | Select a program to manage semesters |
| Scale | 756+ program rows at verification time |

**New Program modal** (`role="dialog"`)

| Control | Accessible name / role |
|---|---|
| Title | `heading "New Program"` |
| Name | `textbox "Program Name"` — label **Program Name \***, placeholder `e.g. Computer Science BSc`, HTML `required`, **no `maxlength`** |
| Description | `textbox "Description"` — placeholder `Brief description`, optional, **no `maxlength`** |
| AI toggle | `button "▸ Show AI Generation Config"` |
| AI fields | **Total Program Hours**, **Default Session Hours** (default `4`), **Default Exam Hours** (default `3`), **Target Audience**, **Focus Areas**, **Sync/Async Ratio** slider (default 70% sync) |
| Dismiss | `button "Cancel"`; unlabeled close in dialog banner; overlay click |
| Submit | `button "Create"` — **disabled** while name is empty or whitespace-only; enabled once trimmed name is non-empty |

API: `GET /api/programs`, `POST /api/programs` (201 on success). Duplicate POST also returned **201** during live exploration — no uniqueness error.

## Live app vs ACs (findings applied to this plan)

| Topic | Previous plan | Live app / Confluence | Test update |
|---|---|---|---|
| Max Program Name length | 255 / 256 | Confluence **100 / 101**; live app accepts 101+ (and even 256-char rows exist) | TC-009 / TC-010 use 100 / 101 |
| Create button label | `New Program` | `+ New Program` | Locators use `+ New Program` |
| AC-1 whitespace submit | Click **Create** after `"   "` | **Create stays disabled**; click is not possible | Expect disabled Create, modal stays open |
| AC-3 duplicate | Error “name already exists” | Duplicate is **silently created** (two identical rows, modal closes, no alert) | Still assert rejection + modal-scoped error (must fail until DS-13 / related bugs are fixed) |
| Description | Treated as if required by AC-2 wording | Optional; Create enabled with name only | TC-014 |
| Trim | Assumed | Leading/trailing spaces **are trimmed** in the list after create | TC-002 kept |
| Case-variant duplicate | Assumed rejected | Live app creates a second row | TC-007 still expects rejection per uniqueness |
| HTML in name | Not covered | Stored as literal text (`<b>` does not render) | TC-015 |
| Double-click Create | Not covered | Same family of duplicate-row bugs as DS-1 | TC-016 |
| Exact **Web Development 2026** | Used as a singleton | **3 exact rows** plus ~297 prefix matches | Tests create a unique name, then retry it |
| Page-wide duplicate regex | `getByText(/duplicate\|already exists/)` | Matches unrelated table copy | Assert inside `role="dialog"` |

## Jira Acceptance Criteria

**Title:** Program name validation and duplicate prevention  
**User story:** As an admin user, I want the system to prevent invalid or duplicate program names so that data integrity is maintained.

```gherkin
Scenario: Reject program name with only whitespace
  Given I am on the program creation form
  When I enter "   " as the program name
  And I click Create
  Then the form is not submitted (name is trimmed, treated as empty)

Scenario: Accept program name with special characters
  Given I am on the program creation form
  When I enter "Informatique & IA - Niveau 2" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully

Scenario: Reject duplicate program name
  Given a program "Web Development 2026" already exists
  When I try to create a new program with the same name
  Then I see an error indicating the name already exists
```

---

## Positive Flows

### TC-001 — Program with special characters in name is created successfully

**Priority:** High  
**Maps to:** AC-2

**Preconditions**
- User is logged in as admin
- User is on `/programs`
- No program already uses the unique name **Informatique & IA - Niveau 2 {timestamp}**

**Steps**
1. Click **+ New Program**
2. Enter **Informatique & IA - Niveau 2 {timestamp}** in **Program Name**
3. Enter **Advanced informatics and AI track** in **Description**
4. Click **Create**

**Expected result**
- Modal heading **New Program** is gone (`role="dialog"` closes)
- Program list immediately shows the unique name exactly as entered (first cell, first `<p>`)
- Description preview shows **Advanced informatics and AI track**
- No validation error is displayed in the dialog or as an alert

**Gherkin**
```gherkin
Feature: Program name validation and duplicate prevention

  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I fill in Program Name with "Informatique & IA - Niveau 2 {timestamp}"
    And I fill in Description with "Advanced informatics and AI track"
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2 {timestamp}"
```

---

### TC-002 — Valid program name with leading and trailing spaces is trimmed and saved

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on `/programs`
- No program named **Cloud Computing 2026 {timestamp}** exists

**Steps**
1. Click **+ New Program**
2. Enter **"  Cloud Computing 2026 {timestamp}  "** in **Program Name** (two leading and two trailing spaces)
3. Enter **Cloud infrastructure and services program** in **Description**
4. Observe **Create** is enabled (trimmed content is non-empty)
5. Click **Create**

**Expected result**
- Modal closes
- Program list shows **Cloud Computing 2026 {timestamp}** without leading or trailing spaces
- No row displays the raw padded string

**Gherkin**
```gherkin
  Scenario: Leading and trailing spaces are trimmed from valid Program Name
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I fill in Program Name with "  Cloud Computing 2026 {timestamp}  "
    And I fill in Description with "Cloud infrastructure and services program"
    And I click Create
    Then the modal closes
    And the program list shows "Cloud Computing 2026 {timestamp}"
    And the program list does not show the padded name
```

---

### TC-003 — Minimum-length Program Name (1 character) is accepted

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on `/programs`
- The 1-character name used in the run does not already exist (use a unique CJK ideograph so reruns stay unique)

**Steps**
1. Click **+ New Program**
2. Enter a single unique character in **Program Name**
3. Enter **Single-character name boundary test** in **Description**
4. Click **Create**

**Expected result**
- Modal closes
- Program list shows that single character as the program name
- No validation error is displayed

**Gherkin**
```gherkin
  Scenario: Minimum-length Program Name is accepted
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I fill in Program Name with a unique 1-character string
    And I fill in Description with "Single-character name boundary test"
    And I click Create
    Then the modal closes
    And the program list shows the 1-character program name
```

---

### TC-014 — Program can be created with Program Name only (Description empty)

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on `/programs`
- Description is optional per Field Definitions

**Steps**
1. Click **+ New Program**
2. Enter **Finance + Accounting {timestamp}** in **Program Name**
3. Leave **Description** empty
4. Observe **Create** is enabled
5. Click **Create**

**Expected result**
- **Create** is enabled with name only
- Modal closes
- Program list shows **Finance + Accounting {timestamp}**
- Description preview is empty

**Gherkin**
```gherkin
  Scenario: Description is optional on create
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I fill in Program Name with "Finance + Accounting {timestamp}"
    And I leave Description empty
    Then the Create button is enabled
    When I click Create
    Then the modal closes
    And the program list shows "Finance + Accounting {timestamp}"
```

---

## Negative Flows

### TC-004 — Whitespace-only Program Name is rejected and form is not submitted

**Priority:** High  
**Maps to:** AC-1

**Preconditions**
- User is logged in as admin
- User is on the program creation form (**New Program** modal)

**Steps**
1. Enter **"   "** (three spaces) in **Program Name**
2. Enter **Full-stack web development program** in **Description**
3. Observe **Create** button state
4. Attempt to click **Create** if it is enabled

**Expected result**
- Name is treated as empty after trim
- **Create** is disabled (live app behavior; Jira’s “click Create” step is not possible)
- Modal remains open with heading **New Program**
- No new program appears in the program list

**Gherkin**
```gherkin
  Scenario: Reject program name with only whitespace
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And the form is not submitted
    And the modal remains open
    And no new program appears in the program list
```

---

### TC-005 — Duplicate Program Name is rejected with an error message

**Priority:** High  
**Maps to:** AC-3

**Preconditions**
- User is logged in as admin
- A unique program **Web Development 2026 {timestamp}** was just created successfully

**Steps**
1. Click **+ New Program**
2. Enter the **same unique name** in **Program Name**
3. Enter **Duplicate attempt for existing program** in **Description**
4. Click **Create**

**Expected result**
- `POST /api/programs` is rejected (400/409)
- An error **inside the modal** indicates the name already exists (do not match table copy)
- Modal remains open
- Program list contains **exactly one** row whose first-cell name equals that unique name
- The duplicate description does not appear as a second row

**Gherkin**
```gherkin
  Scenario: Reject duplicate program name
    Given I am logged in as admin
    And a program "Web Development 2026 {timestamp}" already exists
    When I click "+ New Program"
    And I fill in Program Name with "Web Development 2026 {timestamp}"
    And I fill in Description with "Duplicate attempt for existing program"
    And I click Create
    Then I see an error in the modal indicating the name already exists
    And the modal remains open
    And the program list contains exactly one "Web Development 2026 {timestamp}"
```

---

### TC-006 — Empty Program Name prevents program creation

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Leave **Program Name** empty
2. Enter **Full-stack web development program** in **Description**
3. Observe **Create** button state

**Expected result**
- **Create** button is disabled
- Form is not submitted
- Modal remains open
- No new program appears in the program list

**Gherkin**
```gherkin
  Scenario: Empty Program Name prevents creation
    Given I am logged in as admin
    And I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And no new program appears in the program list
```

---

### TC-007 — Duplicate name with different casing is rejected

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026 {timestamp}** already exists
- Uniqueness is per organization (Confluence); case-variant of another program’s name must not create a second row

**Steps**
1. Click **+ New Program**
2. Enter the same name in **lowercase** in **Program Name**
3. Enter **Case-variant duplicate attempt** in **Description**
4. Click **Create**

**Expected result**
- An error inside the modal indicates the program name already exists
- Modal remains open
- Program list still contains only one row for that name (case-normalized per product uniqueness)

**Gherkin**
```gherkin
  Scenario: Case-variant duplicate Program Name is rejected
    Given I am logged in as admin
    And a program "Web Development 2026 {timestamp}" already exists
    When I click "+ New Program"
    And I fill in Program Name with the same name in lowercase
    And I fill in Description with "Case-variant duplicate attempt"
    And I click Create
    Then I see an error in the modal indicating the name already exists
    And the program list contains exactly one program matching that name
```

---

### TC-008 — Duplicate name with extra surrounding whitespace is rejected after trim

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026 {timestamp}** already exists

**Steps**
1. Click **+ New Program**
2. Enter **"  {same unique name}  "** in **Program Name**
3. Enter **Whitespace-padded duplicate attempt** in **Description**
4. Click **Create**

**Expected result**
- Name is trimmed before duplicate check
- An error inside the modal indicates the program name already exists
- No duplicate program is created

**Gherkin**
```gherkin
  Scenario: Trimmed duplicate Program Name is rejected
    Given I am logged in as admin
    And a program "Web Development 2026 {timestamp}" already exists
    When I click "+ New Program"
    And I fill in Program Name with "  {same unique name}  "
    And I fill in Description with "Whitespace-padded duplicate attempt"
    And I click Create
    Then I see an error in the modal indicating the name already exists
    And the program list contains exactly one matching program
```

---

### TC-010 — Program Name exceeding maximum length (101 characters) is rejected

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- Confluence max is **100** characters (Field Definitions + Validation Rules: 400 if exceeded)

**Steps**
1. Enter a **Program Name** of 101 characters (unique suffix included)
2. Enter **Over max length test** in **Description**
3. If **Create** is enabled, click **Create**

**Expected result**
- Validation error is shown for **Program Name** (or **Create** is blocked)
- Form is not submitted
- Modal remains open
- Program list does not show the 101-character name

**Gherkin**
```gherkin
  Scenario: Program Name over maximum length is rejected
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with a 101-character string
    And I fill in Description with "Over max length test"
    And I click Create
    Then I see a validation error for Program Name or the modal remains open
    And the program list does not show the entered program name
```

---

## Edge Cases

### TC-009 — Program Name at maximum allowed length (100 characters) is accepted

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter a **Program Name** of exactly 100 characters (unique suffix included)
2. Enter **Maximum length boundary test** in **Description**
3. Click **Create**

**Expected result**
- Program is created successfully
- Modal closes
- Program list shows the full 100-character name

**Gherkin**
```gherkin
  Scenario: Maximum-length Program Name is accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with a 100-character string
    And I fill in Description with "Maximum length boundary test"
    And I click Create
    Then the modal closes
    And the program list shows the 100-character program name
```

---

### TC-011 — Tab and newline-only Program Name is rejected as empty

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- **Program Name** is a single-line text input (newlines are stripped by the browser; tabs may remain)

**Steps**
1. Enter **"\t\n  \t"** in **Program Name**
2. Enter **Whitespace variant test** in **Description**
3. Observe **Create** button state

**Expected result**
- Remaining value is whitespace-only after the input strips `\n`
- Treated as empty name
- **Create** is disabled
- Form is not submitted
- No new program is created

**Gherkin**
```gherkin
  Scenario: Tab and newline-only Program Name is rejected
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "\t\n  \t"
    And I fill in Description with "Whitespace variant test"
    Then the Create button is disabled
    And the form is not submitted
    And no new program appears in the program list
```

---

### TC-012 — Unicode and emoji in Program Name are accepted

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- No program named **日本語プログラム 🎓 {timestamp}** exists

**Steps**
1. Click **+ New Program**
2. Enter **日本語プログラム 🎓 {timestamp}** in **Program Name**
3. Enter **Unicode and emoji support test** in **Description**
4. Click **Create**

**Expected result**
- Program is created successfully
- Program list displays **日本語プログラム 🎓 {timestamp}** correctly

**Gherkin**
```gherkin
  Scenario: Unicode and emoji in Program Name are accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "日本語プログラム 🎓 {timestamp}"
    And I fill in Description with "Unicode and emoji support test"
    And I click Create
    Then the modal closes
    And the program list shows "日本語プログラム 🎓 {timestamp}"
```

---

### TC-013 — Program Name with additional special characters is accepted

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- No program named **C++ & AI/ML (2026) {timestamp}** exists

**Steps**
1. Click **+ New Program**
2. Enter **C++ & AI/ML (2026) {timestamp}** in **Program Name**
3. Enter **Extended special character test** in **Description**
4. Click **Create**

**Expected result**
- Program is created successfully
- Program list shows **C++ & AI/ML (2026) {timestamp}** exactly as entered

**Gherkin**
```gherkin
  Scenario: Extended special characters in Program Name are accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "C++ & AI/ML (2026) {timestamp}"
    And I fill in Description with "Extended special character test"
    And I click Create
    Then the modal closes
    And the program list shows "C++ & AI/ML (2026) {timestamp}"
```

---

### TC-015 — HTML in Program Name is stored as literal text

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Click **+ New Program**
2. Enter **\<b\>DS3\</b\> {timestamp}** in **Program Name**
3. Enter **HTML literal test** in **Description**
4. Click **Create**

**Expected result**
- Modal closes
- Program list shows the literal string **\<b\>DS3\</b\> {timestamp}**
- No bold `<b>` node is rendered inside a table cell

**Gherkin**
```gherkin
  Scenario: HTML in Program Name is stored as literal text
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "<b>DS3</b> {timestamp}"
    And I fill in Description with "HTML literal test"
    And I click Create
    Then the modal closes
    And the program list shows "<b>DS3</b> {timestamp}" as literal text
    And the name is not rendered as HTML
```

---

### TC-016 — Double-clicking Create creates only one program

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- Duplicate prevention must also cover a double submit of a unique name

**Steps**
1. Click **+ New Program**
2. Enter **Double Click Guard {timestamp}** in **Program Name**
3. Double-click **Create**

**Expected result**
- Exactly one program row with that name appears
- Modal closes after the successful create
- No second row with the same name is added

**Gherkin**
```gherkin
  Scenario: Double-clicking Create creates only one program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Double Click Guard {timestamp}"
    And I double-click Create
    Then the program list contains exactly one "Double Click Guard {timestamp}"
```

---

## Coverage Summary

| AC | Test ID |
|---|---|
| Reject program name with only whitespace | TC-004 |
| Accept program name with special characters | TC-001 |
| Reject duplicate program name | TC-005 |

| Category | Test IDs | Count |
|---|---|---|
| Positive flows | TC-001, TC-002, TC-003, TC-014 | 4 |
| Negative flows | TC-004, TC-005, TC-006, TC-007, TC-008, TC-010 | 6 |
| Edge cases | TC-009, TC-011, TC-012, TC-013, TC-015, TC-016 | 6 |
| **Total** | | **16** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Whitespace rejection mechanism** — Jira says click **Create**; live UI disables **Create** so the click never happens. Confluence agrees: button disabled / modal stays open.
2. **Exact duplicate error message** — Wording, placement, and `role="alert"` are not defined. Live app currently shows **no error** and returns HTTP 201.
3. **Case sensitivity** — Unclear whether **web development 2026** and **Web Development 2026** are duplicates. TC-007 assumes case-insensitive uniqueness (same stance as DS-2 edit uniqueness).
4. **Trim scope** — Confirmed on successful create (list shows trimmed name). Unclear if trim also runs before the duplicate check (TC-008 assumes yes).
5. **Max length** — Jira ACs omit it. Confluence Field Definitions / Validation Rules specify **100** characters, not 255. Live app has no `maxlength` and accepts 101+.
6. **Allowed character set** — AC-2 shows `&` and `-` as accepted. Quotes, slashes, HTML-like input, and control characters are undefined; TC-013 / TC-015 cover extras found on the page.
7. **Description requirement** — AC-2 says “fill other required fields”; Field Definitions mark Description optional. Live **Create** enables with name only (TC-014).
8. **Duplicate scope** — Confluence: unique **per organization**. Not per academic year/term.
9. **Soft-deleted programs** — No rule on whether a deleted program name can be reused.
10. **Concurrent creation** — No AC for two admins or a double-click creating the same name (TC-016).
11. **Post-error state** — Unclear whether entered values remain after a duplicate/validation error (cannot be observed until uniqueness is implemented).
12. **Jira sample name** — AC-3 uses **Web Development 2026**, which already exists multiple times on test.didaxis.studio. Automated tests must create a unique name first.
13. **Automation selectors** — No `data-testid`. Use accessible names from MCP: `textbox "Program Name"`, `button "+ New Program"`, `button "Create"`.
14. **False-positive error locators** — Page-wide text search for “duplicate” / “unique” matches program table content. Errors must be asserted inside the dialog.
