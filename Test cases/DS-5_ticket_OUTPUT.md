# DS-5 — Ticket Output: Test Cases for Program List Filtering and Display

**Jira:** [DS-5](https://legionqaschool.atlassian.net/browse/DS-5) — Program list filtering and display  
**Environment:** https://test.didaxis.studio  
**Confluence:** [Architecture Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233013249/Architecture+Overview), [Program Setup — Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233046017/Program+Setup+Overview), [Program Setup — Field Definitions](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233078785/Program+Setup+Field+Definitions), [Program Setup — Validation Rules](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233111553/Program+Setup+Validation+Rules), [Program Setup — UI Behavior](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233111568/Program+Setup+UI+Behavior)  
**Last verified:** 2026-09-09 — live Programs page explored via Playwright MCP; tests aligned to Jira ACs + Confluence

## Jira bugs logged (2026-09-09)

| Sub-task (parent [DS-5](https://legionqaschool.atlassian.net/browse/DS-5)) | Test / finding | Requirement | Status |
|---|---|---|---|
| [DS-219](https://legionqaschool.atlassian.net/browse/DS-219) | Live API exploration | `GET /api/programs` bare `[]` crashes page (`TypeError: Cannot read properties of undefined (reading 'length')`) | Open |
| [DS-220](https://legionqaschool.atlassian.net/browse/DS-220) | DS-4 TC-005 / DS-5 TC-019 | Viewer sees **808** Edit + **808** Delete icons; Confluence VIEWER is read-only | Open |
| [DS-221](https://legionqaschool.atlassian.net/browse/DS-221) | TC-006 | DS-5 title promises filtering; no search/filter controls on `/programs` | Open |
| [DS-222](https://legionqaschool.atlassian.net/browse/DS-222) | Live scale finding | **779+** rows rendered without pagination; table ≈ 17406×39931 CSS px | Open |

Evidence screenshots: `evidence/DS-5/api-bare-array-crash.png`, `evidence/DS-5/viewer-edit-delete-visible.png`

## Test policy

- **Jira ACs are strict requirements.** Tests must not bypass failures (`test.fail`, `test.skip` for known bugs).
- If the app does not meet an AC or Confluence list/display rule, the test **fails**.
- Use a **newly created unique program** for every mutating case. Do not depend on a singleton **Test Program** or **Web Development 2026** row — the live list contains **779** programs and many similarly prefixed names.
- The shared tenant is never empty. AC-2 empty state is exercised by mocking `GET /api/programs` as `{ "data": [] }` (the live response shape). A raw `[]` body crashes the page.

## Confluence — Architecture Overview (summary)

Pulled via Atlassian MCP from [Architecture Overview](https://legionqaschool.atlassian.net/wiki/spaces/DS/pages/233013249/Architecture+Overview) (page id `233013249`, space **DS / Didaxis Studio**, version 1, created 2026-04-03 by Kid KiddosBA).

Didaxis Studio uses a **three-layer architecture** separating curriculum intent from schedule and student workload:

| Layer | Purpose | Example |
|---|---|---|
| Layer 1 — Session Templates | Curriculum structure without dates. Defines what sessions should exist. | Lecture: Introduction to Java, Lab: Build REST API |
| Layer 2 — Scheduled Sessions | Calendar entries with `source` (MANUAL \| GENERATED \| TEMPLATE) and `status` (LOCKED \| PLANNED) | Sep 8 — Java Lecture — Intro to Java — Room 301 |
| Layer 3 — Assignments | Student deliverables with `assigned_date`, `due_date`, `estimated_hours` (two calendar events) | Lab Report due Sep 15, 4 hours estimated |

**Key invariants:** Calendar is the live data source — changes propagate to hour totals, template status, and validation; MANUAL and LOCKED sessions are immovable anchors (generator cannot move them); validation runs after every mutation (debounced 500 ms); generator is deterministic (same inputs produce identical schedules).

The DS-5 program list is the entry point to this architecture. Each row is a top-level **Program** container that feeds semesters → courses → session templates. Displaying name and description is how an admin finds the container before opening the semester panel.

## Confluence — Program Setup (rules used by these tests)

| Rule | Source | Expected on the list |
|---|---|---|
| Page is `/programs` with header **Programs** and **+ New Program** (ADMIN / EDITOR) | UI Behavior + Overview | Heading, subtitle, create button |
| List is a **table** with program name, **description preview**, edit and delete icons | UI Behavior | `columnheader "Program"`; first `<p>` = name; second `<p>` = description |
| Empty state | UI Behavior | 🎓 + **No programs yet. Create your first program to get started.** + **Create Program** |
| After create / edit / delete, list **must** refresh immediately | UI Behavior | New or remaining rows visible without `location.reload()` |
| Program Name max **100** characters, unique per organization | Field Definitions + Validation Rules | Boundary display cases use 100, not 255 |
| Description optional, max **500** characters | Field Definitions | Empty description omits the preview `<p>` |
| ADMIN has full CRUD; EDITOR can create/edit; VIEWER is read-only | Overview | Viewer can still see name + description |
| Click a program row to see its semesters | Overview + UI Behavior | Semester panel on the right; list stays on `/programs` |

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

**Programs page** (`/programs`) — populated list

| Control | Accessible name / role |
|---|---|
| Nav | `button "🎓 Programs"` |
| Heading | `heading "Programs"` (level 2) |
| Subtitle | Manage academic programs and semesters |
| Create (admin) | `button "+ New Program"` |
| Create (viewer) | **Not present** |
| Table | `columnheader "Program"` plus an unlabeled actions column |
| Row | `row "{name} {description} Edit {name} Delete {name}"` |
| Name | first `<p>` in the first cell — exact stored text |
| Description preview | second `<p>` in the first cell — muted `rgb(134, 142, 150)`, `overflow: hidden`, `text-overflow: ellipsis` |
| Empty description | second `<p>` is **omitted** (no `—` / `N/A` placeholder) |
| Edit | `button "Edit {program name}"` |
| Delete | `button "Delete {program name}"` |
| Empty semester panel | Select a program to manage semesters |
| Selected program panel | Program name heading, **Semesters & scheduling config**, **No semesters yet**, `button "Manage Courses"`, `button "✨ Generate Curriculum"`, `button "+ Semester"` |
| Search / filter | **None** — no searchbox, filter input, or combobox |
| Scale | **779** data rows at verification time; table rendered ~17406×39931 CSS px |

**Empty state** (mocked `GET /api/programs` → `{ "data": [] }`)

| Control | Live value |
|---|---|
| Icon | 🎓 inside `main` |
| Copy | No programs yet. Create your first program to get started. |
| Empty-state CTA | `button "Create Program"` |
| Header create | `button "+ New Program"` still visible |
| Table | **Not rendered** (`table` count = 0) |
| Semester hint | Not shown |

**New Program modal** (used to seed unique programs)

| Control | Accessible name / role |
|---|---|
| Title | `heading "New Program"` |
| Name | `textbox "Program Name"` — label **Program Name \***, placeholder `e.g. Computer Science BSc` |
| Description | `textbox "Description"` — placeholder `Brief description` |
| Submit | `button "Create"` (disabled while name is empty) |
| Dismiss | `button "Cancel"` |

API: `GET /api/programs` returns `{ data: [ { id, name, description, ... } ] }` (200). `POST /api/programs` returns 201. After row click: `GET /api/programs/{id}/semesters`. Fulfilling the list GET with a raw `[]` (wrong shape) throws `Cannot read properties of undefined (reading 'length')` and blanks the page.

## Live app vs previous plan (findings applied)

| Topic | Previous plan | Live app / Confluence | Test update |
|---|---|---|---|
| Empty-state copy | Generic “no programs have been created” | Exact: **No programs yet. Create your first program to get started.** | TC-002 / TC-016 assert Confluence copy |
| Empty-state CTA | Treated **+ New Program** as the prompt | Empty-state CTA is **Create Program**; header **+ New Program** remains | Both buttons asserted; they are not the same control |
| Empty list in shared env | `test.skip` when rows exist | Shared tenant has **779** rows; `{ data: [] }` mock renders empty UI | AC-2 uses the mock; no skip |
| Filter / search | Implied by the ticket title | **No filter UI at all** | TC-006 asserts no search/filter controls |
| List chrome | Unspecified list | Table + **Program** column; name and description in stacked `<p>` tags | Locators use first/second `<p>` |
| Singleton names | **Web Development 2026**, **Test Program** | Hundreds of prefixed duplicates | Every case seeds a unique `{timestamp}` name |
| Empty Description | “No misleading placeholder” | Second `<p>` is omitted | TC-009 asserts no second `<p>` |
| Max lengths | Long prose name, unspecified cap | Name **100**, Description **500** | TC-014 uses those bounds |
| Min-length name | Literal **A** | Many one-character / short names already exist | TC-013 uses a unique CJK character |
| Layout | “List layout is not broken” | Table is extremely wide (~17406 px) | TC-014 no longer asserts a compact layout |
| Immediate refresh | After create | Confirmed: **DS5 List Probe 1789000000001** appeared as row 1 without reload | TC-004 |
| Viewer | Not covered | Viewer sees name + description; **+ New Program** hidden | TC-019 |
| HTML in name | Not covered | `<b>DS3</b> 1788983974679` renders as literal text | TC-017 |
| Case variants | Not covered | `finance + accounting` and `Finance + Accounting` are separate rows | TC-018 |
| Row click | Not covered | Opens semester panel; list name/description stay visible | TC-020 |
| Sort / pagination | Unspecified | Newest created program appears at the **top**; no paging — all 779 rows render | Documented; TC-004 finds the new row without paging |
| Duplicate names | Assumed unique | Legacy duplicates exist (`Informatique & IA - Niveau 2 DS3-1757450001` twice) | Distinct-row locators; uniqueness is a DS-3 rule, not DS-5 |

## Jira Acceptance Criteria

**Title:** Program list filtering and display  
**User story:** As an admin user, I want to see all programs in a clear list so that I can quickly find and manage them.  
**Status:** In Progress · **Priority:** Low · **Labels:** `program-setup`, `tests-generated`

```gherkin
Scenario: Display program list with key details
  Given programs exist in the system
  When I navigate to the Programs page
  Then I see a list showing each program's name and description

Scenario: Empty state when no programs exist
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program
```

---

## Positive Flows

### TC-001 — Program list displays each program's name and description

**Priority:** High  
**Maps to:** AC-1

**Preconditions**
- User is logged in as admin
- Unique programs exist:
  - **Web Development 2026 {timestamp}** — *Full-stack web development program*
  - **Cloud Computing 2026 {timestamp}** — *Cloud infrastructure and services program*

**Steps**
1. Navigate to `/programs`
2. Locate each seeded program in the table (`columnheader "Program"`)

**Expected result**
- Each program is a distinct `row`
- First cell, first `<p>` is the exact **Program Name**
- First cell, second `<p>` is the exact **Description**
- Both names and both descriptions are visible
- Empty-state copy is not shown

**Gherkin**
```gherkin
Feature: Program list filtering and display

  Scenario: Display program list with key details
    Given I am logged in as admin
    And a program "Web Development 2026 {timestamp}" exists with description "Full-stack web development program"
    And a program "Cloud Computing 2026 {timestamp}" exists with description "Cloud infrastructure and services program"
    When I navigate to the Programs page
    Then I see a table showing each program's name and description
    And I see "Web Development 2026 {timestamp}" with description "Full-stack web development program"
    And I see "Cloud Computing 2026 {timestamp}" with description "Cloud infrastructure and services program"
```

---

### TC-002 — Empty state message and first-program prompt are shown when no programs exist

**Priority:** High  
**Maps to:** AC-2

**Preconditions**
- User is logged in as admin
- `GET /api/programs` returns `{ "data": [] }` (mocked — the shared tenant has 779 programs)

**Steps**
1. Navigate to `/programs`
2. Observe `main`

**Expected result**
- 🎓 icon is visible inside `main`
- Text **No programs yet. Create your first program to get started.** is visible
- `button "Create Program"` is visible
- `button "+ New Program"` remains in the header
- No `table` is rendered
- **Select a program to manage semesters** is not shown

**Gherkin**
```gherkin
  Scenario: Empty state when no programs exist
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I see "No programs yet. Create your first program to get started."
    And I see a "Create Program" prompt to create the first program
    And I do not see the program table
```

---

### TC-003 — Newly created program is displayed correctly in the list

**Priority:** Medium  
**Maps to:** AC-1

**Preconditions**
- User is logged in as admin
- Unique program **Test Program {timestamp}** exists with description **Sample program for deletion testing**

**Steps**
1. Navigate to `/programs`
2. Locate **Test Program {timestamp}**

**Expected result**
- Exactly one row matches that name
- Name and description are both visible
- Empty-state copy is not shown

**Gherkin**
```gherkin
  Scenario: Single seeded program is displayed in the list
    Given I am logged in as admin
    And a program "Test Program {timestamp}" exists with description "Sample program for deletion testing"
    When I navigate to the Programs page
    Then I see "Test Program {timestamp}" with description "Sample program for deletion testing"
    And I do not see "No programs yet. Create your first program to get started."
```

---

### TC-004 — Newly created program appears in the list without manual refresh

**Priority:** High  
**Maps to:** AC-1 + UI Behavior (list refresh)

**Preconditions**
- User is logged in as admin
- User is on `/programs`
- No program named **Web Development 2026 {timestamp}** exists

**Steps**
1. Click **+ New Program**
2. Enter **Web Development 2026 {timestamp}** in **Program Name**
3. Enter **Full-stack web development program** in **Description**
4. Click **Create**
5. Do not reload the page

**Expected result**
- Modal closes
- URL remains `/programs`
- The new row is visible with name and description (live check: new programs appear at the **top**)
- Empty-state copy is not shown

**Gherkin**
```gherkin
  Scenario: Newly created program appears in the list immediately
    Given I am logged in as admin
    And I am on the Programs page
    And no program "Web Development 2026 {timestamp}" exists
    When I click "+ New Program"
    And I fill in Program Name with "Web Development 2026 {timestamp}"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And I see "Web Development 2026 {timestamp}" with description "Full-stack web development program" in the program list
    And I did not reload the page
```

---

## Negative Flows

### TC-005 — Empty-state message is not shown when programs exist

**Priority:** High  
**Maps to:** AC-2 (inverse)

**Preconditions**
- User is logged in as admin
- Unique program **Web Development 2026 {timestamp}** exists

**Steps**
1. Navigate to `/programs`
2. Look for empty-state copy and **Create Program**

**Expected result**
- The seeded program is in the table
- **No programs yet. Create your first program to get started.** is not shown
- `button "Create Program"` is not shown
- **Select a program to manage semesters** is shown (no row selected)

**Gherkin**
```gherkin
  Scenario: Empty state is not shown when programs exist
    Given I am logged in as admin
    And a program "Web Development 2026 {timestamp}" exists with description "Full-stack web development program"
    When I navigate to the Programs page
    Then I see "Web Development 2026 {timestamp}" in the program list
    And I do not see "No programs yet. Create your first program to get started."
    And I do not see the "Create Program" empty-state button
```

---

### TC-006 — Programs page has no search or filter controls

**Priority:** High  
**Maps to:** Feature title gap (ACs do not define filtering)

**Preconditions**
- User is logged in as admin
- User is on `/programs`

**Steps**
1. Inspect the page for search, filter, or find controls

**Expected result**
- No `searchbox`
- No textbox / placeholder matching search, filter, or find
- No `combobox`
- The full program table is shown unfiltered

**Live finding:** Despite the Jira title “Program list **filtering** and display”, there is no filter UI. Admins “find” a program by scanning the unfiltered table.

**Gherkin**
```gherkin
  Scenario: Program list has no filter controls
    Given I am logged in as admin
    When I navigate to the Programs page
    Then I do not see a search box
    And I do not see a filter control
    And I see the unfiltered program table
```

---

### TC-007 — Program description is not hidden when description exists

**Priority:** Medium  
**Maps to:** AC-1

**Preconditions**
- User is logged in as admin
- Unique program **Cloud Computing 2026 {timestamp}** exists with description **Cloud infrastructure and services program**

**Steps**
1. Navigate to `/programs`
2. Locate the seeded row

**Expected result**
- Name is in the first `<p>`
- Description is in the second `<p>` and visible
- The row is not name-only

**Gherkin**
```gherkin
  Scenario: Program description is not hidden when present
    Given I am logged in as admin
    And a program "Cloud Computing 2026 {timestamp}" exists with description "Cloud infrastructure and services program"
    When I navigate to the Programs page
    Then I see "Cloud Computing 2026 {timestamp}"
    And I see "Cloud infrastructure and services program" in that row
```

---

### TC-008 — Deleted program does not remain visible in the list

**Priority:** Medium  
**Maps to:** AC-1 + UI Behavior (list refresh)

**Preconditions**
- User is logged in as admin
- Unique programs **Test Program {timestamp}** and **Web Development 2026 {timestamp}** exist
- User is on `/programs`

**Steps**
1. Click `button "Delete Test Program {timestamp}"`
2. Confirm the native dialog with **OK**
3. Observe the program list

**Expected result**
- **Test Program {timestamp}** is gone
- **Web Development 2026 {timestamp}** remains
- Empty-state copy is **not** shown (other programs still exist)

**Gherkin**
```gherkin
  Scenario: Deleted program is not shown in the list
    Given I am logged in as admin
    And a program "Test Program {timestamp}" exists
    And a program "Web Development 2026 {timestamp}" exists
    And I am on the Programs page
    When I delete "Test Program {timestamp}" and confirm deletion
    Then I do not see "Test Program {timestamp}" in the program list
    And I still see "Web Development 2026 {timestamp}" in the program list
    And I do not see the empty-state message
```

---

## Edge Cases

### TC-009 — Program with empty Description is listed with name only

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **Data Science Fundamentals {timestamp}** exists with an empty **Description**

**Steps**
1. Navigate to `/programs`
2. Locate the seeded row

**Expected result**
- Name is visible in the first `<p>`
- The description `<p>` is **absent**
- No `—`, `N/A`, “no description”, or placeholder text is shown
- The program is not hidden because Description is empty

**Gherkin**
```gherkin
  Scenario: Program with empty Description appears in the list
    Given I am logged in as admin
    And a program "Data Science Fundamentals {timestamp}" exists with an empty Description
    When I navigate to the Programs page
    Then I see "Data Science Fundamentals {timestamp}" in the program list
    And I do not see a description preview or placeholder for that program
```

---

### TC-010 — Program name with special characters displays exactly as stored

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **Informatique & IA - Niveau 2 {timestamp}** exists with description **Advanced informatics and AI track**

**Steps**
1. Navigate to `/programs`
2. Locate the seeded row

**Expected result**
- Name renders as **Informatique & IA - Niveau 2 {timestamp}** (not `&amp;`)
- Description is shown correctly
- `&` and `-` do not break the row

**Gherkin**
```gherkin
  Scenario: Program with special characters in name is displayed correctly
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2 {timestamp}" exists with description "Advanced informatics and AI track"
    When I navigate to the Programs page
    Then I see "Informatique & IA - Niveau 2 {timestamp}" in the program list
    And I see "Advanced informatics and AI track"
```

---

### TC-011 — Program name with extended special characters displays correctly

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **C++ & AI/ML (2026) {timestamp}** exists with description **Advanced C++ and machine learning curriculum**

**Steps**
1. Navigate to `/programs`
2. Locate the seeded row

**Expected result**
- Full name is visible, including `/`, `(`, `)`, and `+`
- Description is fully readable

**Gherkin**
```gherkin
  Scenario: Program with extended special characters is displayed correctly
    Given I am logged in as admin
    And a program "C++ & AI/ML (2026) {timestamp}" exists with description "Advanced C++ and machine learning curriculum"
    When I navigate to the Programs page
    Then I see "C++ & AI/ML (2026) {timestamp}" in the program list
    And I see "Advanced C++ and machine learning curriculum"
```

---

### TC-012 — Program name with Unicode and emoji displays correctly

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Unique program **日本語プログラム 🎓 {timestamp}** exists with description **Japanese-language academic program**

**Steps**
1. Navigate to `/programs`
2. Locate the seeded row

**Expected result**
- Unicode characters and emoji render correctly (live list already contains `日本語プログラム 🎓 …` rows)
- Description is shown
- No encoding artifacts (`&#x1F393;`) appear

**Gherkin**
```gherkin
  Scenario: Program with Unicode and emoji in name is displayed correctly
    Given I am logged in as admin
    And a program "日本語プログラム 🎓 {timestamp}" exists with description "Japanese-language academic program"
    When I navigate to the Programs page
    Then I see "日本語プログラム 🎓 {timestamp}" in the program list
    And I see "Japanese-language academic program"
```

---

### TC-013 — Minimum-length program name displays correctly in the list

**Priority:** Low

**Preconditions**
- User is logged in as admin
- A unique one-character program exists (CJK code point, not the literal **A** — that name is not unique in this tenant)

**Steps**
1. Navigate to `/programs`
2. Locate the one-character name

**Expected result**
- The single-character name is visible and distinguishable
- Description is shown

**Gherkin**
```gherkin
  Scenario: Minimum-length program name is displayed in the list
    Given I am logged in as admin
    And a unique one-character program exists with description "Single-character name boundary test"
    When I navigate to the Programs page
    Then I see that one-character name in the program list
    And I see "Single-character name boundary test"
```

---

### TC-014 — Max-length program name and description display in the list

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- A program exists with:
  - **Program Name:** 100 characters (Field Definitions max)
  - **Description:** 500 characters (Field Definitions max)

**Steps**
1. Navigate to `/programs`
2. Locate the seeded row

**Expected result**
- Full 100-character name is in the first `<p>`
- Full 500-character description is in the second `<p>` (preview uses ellipsis overflow; the text content is still present)
- The table remains present
- Do **not** require a compact layout — live table width was ~17406 px

**Gherkin**
```gherkin
  Scenario: Max-length program name and description are displayed
    Given I am logged in as admin
    And a program with a 100-character name and a 500-character description exists
    When I navigate to the Programs page
    Then I see the 100-character name in the program list
    And I see the 500-character description in that row
```

---

### TC-015 — Multiple programs with similar names are displayed as separate distinct entries

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Programs exist:
  - **Web Development 2026 {timestamp}** — *Full-stack web development program*
  - **Web Development 2026 {timestamp} - Updated** — *Full-stack web development program — revised curriculum*

**Steps**
1. Navigate to `/programs`
2. Compare both entries

**Expected result**
- Both programs appear as separate rows
- Exact-name locator matches only one row each
- Each row shows its own description

**Gherkin**
```gherkin
  Scenario: Similar program names are displayed as distinct list entries
    Given I am logged in as admin
    And a program "Web Development 2026 {timestamp}" exists with description "Full-stack web development program"
    And a program "Web Development 2026 {timestamp} - Updated" exists with description "Full-stack web development program — revised curriculum"
    When I navigate to the Programs page
    Then I see "Web Development 2026 {timestamp}" in the program list
    And I see "Web Development 2026 {timestamp} - Updated" in the program list
    And each name matches exactly one row
```

---

### TC-016 — Empty state appears when the program list is empty

**Priority:** Medium  
**Maps to:** AC-2 + UI Behavior

**Preconditions**
- User is logged in as admin
- `GET /api/programs` returns `{ "data": [] }`
- Do **not** delete the shared 779-row tenant to manufacture this state

**Steps**
1. Navigate to `/programs`

**Expected result**
- Empty-state copy, 🎓, and **Create Program** are shown
- **+ New Program** remains available
- No table

**Gherkin**
```gherkin
  Scenario: Empty state appears when the last program is gone
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I see "No programs yet. Create your first program to get started."
    And I see a prompt to create the first program
```

---

### TC-017 — HTML-like program name displays as literal text

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Unique program **\<b\>DS5\</b\> {timestamp}** exists with description **HTML literal test**

**Steps**
1. Navigate to `/programs`
2. Read the name cell

**Expected result**
- The characters `<b>DS5</b>` appear as text (live sibling: `<b>DS3</b> 1788983974679`)
- No bold `<b>` node is rendered inside the row
- Description is shown

**Gherkin**
```gherkin
  Scenario: HTML-like program name is displayed as literal text
    Given I am logged in as admin
    And a program "<b>DS5</b> {timestamp}" exists with description "HTML literal test"
    When I navigate to the Programs page
    Then I see "<b>DS5</b> {timestamp}" as literal text in the program list
```

---

### TC-018 — Case-variant program names display as separate list entries

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Programs **finance + accounting {timestamp}** and **Finance + Accounting {timestamp}** exist

**Steps**
1. Navigate to `/programs`
2. Compare both rows

**Expected result**
- Both rows are visible with their own descriptions
- Names are not collapsed into one entry

**Gherkin**
```gherkin
  Scenario: Case-variant program names are distinct list entries
    Given I am logged in as admin
    And a program "finance + accounting {timestamp}" exists
    And a program "Finance + Accounting {timestamp}" exists
    When I navigate to the Programs page
    Then I see both programs as separate rows
```

---

### TC-019 — Viewer can see program name and description in the list

**Priority:** High  
**Maps to:** Program Setup — Overview (VIEWER is read-only)

**Preconditions**
- Admin has created unique program **Web Development 2026 {timestamp}**
- User is then logged in as **Viewer** (`DIDAXIS_NON_ADMIN_EMAIL`)
- User is on `/programs`

**Steps**
1. Locate the seeded program
2. Look for **+ New Program**

**Expected result**
- Name and description are visible (read-only list)
- **+ New Program** is not visible

**Live finding (2026-09-09):** Viewer session hid **+ New Program** and still rendered the 778-row list (Dashboard tile showed **778**). Edit/Delete icons remain visible — that is a DS-4 authorization gap, not a DS-5 display AC.

**Gherkin**
```gherkin
  Scenario: Viewer can see the program list
    Given I am logged in as a viewer
    And a program "Web Development 2026 {timestamp}" exists
    When I navigate to the Programs page
    Then I see "Web Development 2026 {timestamp}" with its description
    And I do not see the "+ New Program" button
```

---

### TC-020 — Selecting a program row keeps name and description visible

**Priority:** Medium  
**Maps to:** AC-1 + Overview (click row → semesters)

**Preconditions**
- User is logged in as admin
- Unique program **Selected Row Display {timestamp}** exists
- User is on `/programs`

**Steps**
1. Click the program row (not Edit/Delete)
2. Observe the list and the right-hand panel

**Expected result**
- URL remains `/programs`
- Name and description stay visible on the selected row
- Semester panel shows **Semesters & scheduling config**, **No semesters yet**, and **+ Semester**
- **Select a program to manage semesters** is gone

**Gherkin**
```gherkin
  Scenario: Selecting a row keeps list details visible
    Given I am logged in as admin
    And a program "Selected Row Display {timestamp}" exists
    And I am on the Programs page
    When I click the "Selected Row Display {timestamp}" row
    Then I still see the program name and description
    And I see the semester panel
```

---

## AC Coverage Matrix

| Acceptance Criterion | Test Case(s) |
|---|---|
| Display program list with key details (AC-1) | TC-001, TC-003, TC-004, TC-007, TC-019, TC-020 |
| Empty state when no programs exist (AC-2) | TC-002, TC-005, TC-016 |
| Immediate list refresh (UI Behavior) | TC-004, TC-008 |
| Viewer can read the list (Overview) | TC-019 |
| No filter UI (title vs AC gap) | TC-006 |

| Category | Test IDs | Count |
|---|---|---|
| Positive flows | TC-001 – TC-004 | 4 |
| Negative flows | TC-005 – TC-008 | 4 |
| Edge cases | TC-009 – TC-020 | 12 |
| **Total** | | **20** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **"Filtering" is not implemented** — The Jira title is “Program list filtering and display”, but neither AC nor the live page defines search, sort, category, or status filters. Finding a program means scrolling an unfiltered 779-row table.
2. **Exact empty-state copy** — Jira says “a message indicating no programs have been created” and “a prompt to create the first program”. Confluence and the live empty UI use **No programs yet. Create your first program to get started.** plus **Create Program**. Header **+ New Program** is a separate control that stays visible.
3. **Shared tenant is never empty** — AC-2 cannot be observed against production data without deleting 779 programs. Tests mock `{ "data": [] }`. A raw `[]` body crashes the UI (`length` of `undefined`).
4. **List structure** — ACs do not mention the table, **Program** column, description preview styling, edit/delete icons, or the semester panel.
5. **Sort order** — No rule. Live list shows the newest created program at the top.
6. **Empty Description display** — Not specified. Live UI omits the second `<p>` entirely (TC-009).
7. **Long text** — No truncation rule in Jira. Confluence caps name at 100 and description at 500. Description preview uses CSS ellipsis; some legacy rows store 2000-character descriptions.
8. **Pagination / virtualization** — None. All 779 rows render; the table is extremely wide and tall. ACs do not require a usable layout width.
9. **Permissions** — ACs are admin-only. Confluence says Viewer is read-only; Viewer can see the list (TC-019) but still sees Edit/Delete icons (DS-4 gap).
10. **Real-time updates** — Confluence requires an immediate refresh after create/edit/delete. Confirmed for create (probe row appeared at the top without reload).
11. **Duplicate names** — DS-3 uniqueness does not prevent legacy duplicate rows from appearing as separate list entries. ACs do not say how to display collisions.
12. **Wrong API envelope** — Empty-state rendering depends on `{ data: [] }`. Jira does not specify the contract; a bare array blanks the page instead of showing AC-2.
