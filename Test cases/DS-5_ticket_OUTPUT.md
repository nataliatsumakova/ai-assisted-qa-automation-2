# DS-5 — Ticket Output: Test Cases for Program List Filtering and Display

## Positive Flows

### TC-001 — Program list displays each program's name and description

**Priority:** High

**Preconditions**
- User is logged in as admin
- The following programs exist:
  - **Web Development 2026** — *Full-stack web development program*
  - **Cloud Computing 2026** — *Cloud infrastructure and services program*

**Steps**
1. Navigate to the **Programs** page
2. Observe the program list

**Expected result**
- Each program appears as a distinct list entry
- **Web Development 2026** is shown with description **Full-stack web development program**
- **Cloud Computing 2026** is shown with description **Cloud infrastructure and services program**
- Both **Program Name** and **Description** are visible for each entry

**Gherkin**
```gherkin
Feature: Program list filtering and display

  Scenario: Display program list with key details
    Given I am logged in as admin
    And a program "Web Development 2026" exists with description "Full-stack web development program"
    And a program "Cloud Computing 2026" exists with description "Cloud infrastructure and services program"
    When I navigate to the Programs page
    Then I see a list showing each program's name and description
    And I see "Web Development 2026" with description "Full-stack web development program"
    And I see "Cloud Computing 2026" with description "Cloud infrastructure and services program"
```

---

### TC-002 — Empty state message and first-program prompt are shown when no programs exist

**Priority:** High

**Preconditions**
- User is logged in as admin
- No programs exist in the system

**Steps**
1. Navigate to the **Programs** page
2. Observe the page content

**Expected result**
- No program rows are displayed
- A message indicates no programs have been created
- A prompt to create the first program is visible (e.g. **+ New Program** or equivalent call-to-action)

**Gherkin**
```gherkin
  Scenario: Empty state when no programs exist
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program
```

---

### TC-003 — Single existing program is displayed correctly in the list

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Only one program exists: **Test Program** — *Sample program for deletion testing*

**Steps**
1. Navigate to the **Programs** page
2. Observe the program list

**Expected result**
- Exactly one program row is shown
- **Test Program** and **Sample program for deletion testing** are both visible
- Empty-state message is not shown

**Gherkin**
```gherkin
  Scenario: Single program is displayed in the list
    Given I am logged in as admin
    And only a program "Test Program" exists with description "Sample program for deletion testing"
    When I navigate to the Programs page
    Then I see "Test Program" with description "Sample program for deletion testing"
    And I do not see a message indicating no programs have been created
```

---

### TC-004 — Newly created program appears in the list without manual refresh

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the **Programs** page
- No program named **Web Development 2026** exists

**Steps**
1. Click **+ New Program**
2. Enter **Web Development 2026** in **Program Name**
3. Enter **Full-stack web development program** in **Description**
4. Click **Create**
5. Observe the program list

**Expected result**
- Modal closes
- **Web Development 2026** appears in the list with its description
- Empty-state message is no longer shown

**Gherkin**
```gherkin
  Scenario: Newly created program appears in the list immediately
    Given I am logged in as admin
    And I am on the Programs page
    And no program "Web Development 2026" exists
    When I click "+ New Program"
    And I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And I see "Web Development 2026" with description "Full-stack web development program" in the program list
```

---

## Negative Flows

### TC-005 — Program list is not shown when no programs exist

**Priority:** High

**Preconditions**
- User is logged in as admin
- No programs exist in the system

**Steps**
1. Navigate to the **Programs** page
2. Look for program rows in the list area

**Expected result**
- No program names or descriptions are shown
- Empty-state UI is shown instead of populated program rows
- No stale or cached program data from a previous session is displayed

**Gherkin**
```gherkin
  Scenario: Program list is not shown in empty state
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I do not see any program names in the list
    And I do not see any program descriptions in the list
```

---

### TC-006 — Empty-state message is not shown when programs exist

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists with description **Full-stack web development program**

**Steps**
1. Navigate to the **Programs** page
2. Observe whether empty-state messaging is present

**Expected result**
- **Web Development 2026** appears in the list
- No "no programs have been created" message is shown
- First-program creation prompt is not shown as the primary empty-state CTA

**Gherkin**
```gherkin
  Scenario: Empty state is not shown when programs exist
    Given I am logged in as admin
    And a program "Web Development 2026" exists with description "Full-stack web development program"
    When I navigate to the Programs page
    Then I see "Web Development 2026" in the program list
    And I do not see a message indicating no programs have been created
```

---

### TC-007 — Program description is not hidden when description exists

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Cloud Computing 2026** exists with description **Cloud infrastructure and services program**

**Steps**
1. Navigate to the **Programs** page
2. Locate **Cloud Computing 2026** in the list

**Expected result**
- **Cloud Computing 2026** is visible
- Description **Cloud infrastructure and services program** is visible for that row
- Name alone is not shown without its associated description

**Gherkin**
```gherkin
  Scenario: Program description is not hidden when present
    Given I am logged in as admin
    And a program "Cloud Computing 2026" exists with description "Cloud infrastructure and services program"
    When I navigate to the Programs page
    Then I see "Cloud Computing 2026"
    And I see "Cloud infrastructure and services program"
    And I do not see "Cloud Computing 2026" without its description
```

---

### TC-008 — Deleted program does not remain visible in the list

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Programs **Test Program** and **Web Development 2026** exist
- User is on the **Programs** page

**Steps**
1. Delete **Test Program** and confirm deletion
2. Observe the program list

**Expected result**
- **Test Program** is no longer shown
- **Web Development 2026** remains visible
- List reflects current data only

**Gherkin**
```gherkin
  Scenario: Deleted program is not shown in the list
    Given I am logged in as admin
    And a program "Test Program" exists
    And a program "Web Development 2026" exists
    And I am on the Programs page
    When I delete "Test Program" and confirm deletion
    Then I do not see "Test Program" in the program list
    And I still see "Web Development 2026" in the program list
```

---

## Edge Cases

### TC-009 — Program with empty Description is listed with name only

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Data Science Fundamentals** exists with an empty **Description**

**Steps**
1. Navigate to the **Programs** page
2. Locate **Data Science Fundamentals** in the list

**Expected result**
- **Data Science Fundamentals** appears in the list
- Row does not show a misleading placeholder description
- Program is not hidden because **Description** is empty

**Gherkin**
```gherkin
  Scenario: Program with empty Description appears in the list
    Given I am logged in as admin
    And a program "Data Science Fundamentals" exists with an empty Description
    When I navigate to the Programs page
    Then I see "Data Science Fundamentals" in the program list
    And I do not see a false or placeholder description for "Data Science Fundamentals"
```

---

### TC-010 — Program name with special characters displays exactly as stored

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Informatique & IA - Niveau 2** exists with description **Advanced informatics and AI track**

**Steps**
1. Navigate to the **Programs** page
2. Locate **Informatique & IA - Niveau 2** in the list

**Expected result**
- Name renders as **Informatique & IA - Niveau 2** (not HTML-encoded or truncated incorrectly)
- Description **Advanced informatics and AI track** is shown correctly
- Special characters `&` and `-` do not break layout

**Gherkin**
```gherkin
  Scenario: Program with special characters in name is displayed correctly
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists with description "Advanced informatics and AI track"
    When I navigate to the Programs page
    Then I see "Informatique & IA - Niveau 2" in the program list
    And I see "Advanced informatics and AI track"
```

---

### TC-011 — Program name with extended special characters displays correctly

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **C++ & AI/ML (2026)** exists with description **Advanced C++ and machine learning curriculum**

**Steps**
1. Navigate to the **Programs** page
2. Locate **C++ & AI/ML (2026)** in the list

**Expected result**
- Full name **C++ & AI/ML (2026)** is visible
- Characters `/`, `(`, `)`, and `+` render correctly
- Description is fully readable

**Gherkin**
```gherkin
  Scenario: Program with extended special characters is displayed correctly
    Given I am logged in as admin
    And a program "C++ & AI/ML (2026)" exists with description "Advanced C++ and machine learning curriculum"
    When I navigate to the Programs page
    Then I see "C++ & AI/ML (2026)" in the program list
    And I see "Advanced C++ and machine learning curriculum"
```

---

### TC-012 — Program name with Unicode and emoji displays correctly

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Program **日本語プログラム 🎓** exists with description **Japanese-language academic program**

**Steps**
1. Navigate to the **Programs** page
2. Locate **日本語プログラム 🎓** in the list

**Expected result**
- Unicode characters and emoji render correctly
- Description **Japanese-language academic program** is shown
- No encoding artifacts (e.g. `&#x1F393;`) appear in the UI

**Gherkin**
```gherkin
  Scenario: Program with Unicode and emoji in name is displayed correctly
    Given I am logged in as admin
    And a program "日本語プログラム 🎓" exists with description "Japanese-language academic program"
    When I navigate to the Programs page
    Then I see "日本語プログラム 🎓" in the program list
    And I see "Japanese-language academic program"
```

---

### TC-013 — Minimum-length program name displays correctly in the list

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Program **A** exists with description **Single-character name boundary test**

**Steps**
1. Navigate to the **Programs** page
2. Locate program **A** in the list

**Expected result**
- Single-character name **A** is visible and distinguishable from other entries
- Description **Single-character name boundary test** is shown

**Gherkin**
```gherkin
  Scenario: Minimum-length program name is displayed in the list
    Given I am logged in as admin
    And a program "A" exists with description "Single-character name boundary test"
    When I navigate to the Programs page
    Then I see "A" in the program list
    And I see "Single-character name boundary test"
```

---

### TC-014 — Long program name and description display without breaking the list layout

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- A program exists with:
  - **Program Name:** `Enterprise Software Architecture and Distributed Systems Engineering Professional Certificate 2026`
  - **Description:** `This program covers enterprise architecture patterns, microservices, event-driven systems, cloud-native deployment, security hardening, observability, and capstone project delivery across twelve intensive modules designed for senior engineering professionals.`

**Steps**
1. Navigate to the **Programs** page
2. Observe how the long name and description are rendered

**Expected result**
- Full values are accessible (visible, truncated with ellipsis, or expandable — per product rules)
- List layout remains usable; rows do not overlap or break the page
- Program remains identifiable by its name

**Gherkin**
```gherkin
  Scenario: Long program name and description are displayed without layout breakage
    Given I am logged in as admin
    And a program "Enterprise Software Architecture and Distributed Systems Engineering Professional Certificate 2026" exists with description "This program covers enterprise architecture patterns, microservices, event-driven systems, cloud-native deployment, security hardening, observability, and capstone project delivery across twelve intensive modules designed for senior engineering professionals."
    When I navigate to the Programs page
    Then I see "Enterprise Software Architecture and Distributed Systems Engineering Professional Certificate 2026" in the program list
    And the program list layout is not broken
```

---

### TC-015 — Multiple programs with similar names are displayed as separate distinct entries

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Programs exist:
  - **Web Development 2026** — *Full-stack web development program*
  - **Web Development 2026 - Updated** — *Full-stack web development program — revised curriculum*

**Steps**
1. Navigate to the **Programs** page
2. Compare both entries in the list

**Expected result**
- Both programs appear as separate rows
- Names are not merged or confused in display
- Each row shows its own description

**Gherkin**
```gherkin
  Scenario: Similar program names are displayed as distinct list entries
    Given I am logged in as admin
    And a program "Web Development 2026" exists with description "Full-stack web development program"
    And a program "Web Development 2026 - Updated" exists with description "Full-stack web development program — revised curriculum"
    When I navigate to the Programs page
    Then I see "Web Development 2026" in the program list
    And I see "Web Development 2026 - Updated" in the program list
    And I see "Full-stack web development program — revised curriculum"
```

---

### TC-016 — Empty state appears after deleting the last program

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Only program **Test Program** exists
- User is on the **Programs** page

**Steps**
1. Delete **Test Program** and confirm deletion
2. Observe the page

**Expected result**
- **Test Program** is removed
- Empty-state message appears
- Prompt to create the first program is shown
- **+ New Program** remains available

**Gherkin**
```gherkin
  Scenario: Empty state appears after deleting the last program
    Given I am logged in as admin
    And only a program "Test Program" exists
    And I am on the Programs page
    When I delete "Test Program" and confirm deletion
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program
```

---

## AC Coverage Matrix

| Acceptance Criterion | Test Case(s) |
|---|---|
| Display program list with key details | TC-001, TC-003, TC-004 |
| Empty state when no programs exist | TC-002, TC-005, TC-016 |

| Category | Test IDs | Count |
|---|---|---|
| Positive flows | TC-001 – TC-004 | 4 |
| Negative flows | TC-005 – TC-008 | 4 |
| Edge cases | TC-009 – TC-016 | 8 |
| **Total** | | **16** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **"Filtering" is not defined** — The feature title mentions filtering, but neither AC describes search, sort, category filters, or status filters. No filter UI, behavior, or expected results are specified.
2. **Exact empty-state copy** — AC requires a message and a prompt, but not the exact wording (e.g. "No programs yet" vs "No programs have been created") or whether the prompt is **+ New Program**, inline text, or a separate button.
3. **List structure and columns** — AC says name and description are shown, but not whether edit/delete icons, dates, status, or row actions are part of this view (those appear in related tickets DS-2 and DS-4).
4. **Sort order** — No rule for list ordering (alphabetical, creation date, manual sort).
5. **Empty Description display** — Not specified whether an empty **Description** shows blank space, "—", or is omitted (TC-009 assumes the program still appears).
6. **Long text handling** — No rule for truncation, wrapping, tooltips, or max displayed length for name/description.
7. **Pagination / virtualization** — No guidance for large lists (e.g. 50+ programs).
8. **Permissions / roles** — ACs assume navigation to **Programs** page works; non-admin access and read-only behavior are not defined.
9. **Real-time updates** — Unclear whether the list updates immediately after create/edit/delete without refresh (TC-004 and TC-008 infer immediate update from related flows).
10. **Transition from empty to populated state** — AC-2 covers initial empty state; behavior when the last program is deleted is implied but not explicitly stated (covered in TC-016).
11. **Duplicate names in the list** — DS-3 prevents duplicate creation, but ACs do not state whether duplicate names could ever appear in the list due to a bug or legacy data.
12. **Initial page load vs. navigation** — Unclear whether "navigate to Programs page" includes direct URL access, sidebar navigation, or both; loading/error states are not specified.
