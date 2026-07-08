# DS-3 — Ticket Output: Test Cases for Program Name Validation and Duplicate Prevention

## Positive Flows

### TC-001 — Program with special characters in name is created successfully

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- No program named **Informatique & IA - Niveau 2** exists

**Steps**
1. Enter **Informatique & IA - Niveau 2** in **Program Name**
2. Enter **Advanced informatics and AI track** in **Description**
3. Click **Create**

**Expected result**
- Modal closes
- Program list shows **Informatique & IA - Niveau 2** exactly as entered
- No validation error is displayed

**Gherkin**
```gherkin
Feature: Program name validation and duplicate prevention

  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Informatique & IA - Niveau 2"
    And I fill in Description with "Advanced informatics and AI track"
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"
```

---

### TC-002 — Valid program name with leading and trailing spaces is trimmed and saved

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- No program named **Cloud Computing 2026** exists

**Steps**
1. Enter **"  Cloud Computing 2026  "** in **Program Name**
2. Enter **Cloud infrastructure and services program** in **Description**
3. Click **Create**

**Expected result**
- Modal closes
- Program list shows **Cloud Computing 2026** (without leading or trailing spaces)
- Program is not stored with raw whitespace padding

**Gherkin**
```gherkin
  Scenario: Leading and trailing spaces are trimmed from valid Program Name
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "  Cloud Computing 2026  "
    And I fill in Description with "Cloud infrastructure and services program"
    And I click Create
    Then the modal closes
    And the program list shows "Cloud Computing 2026"
```

---

### TC-003 — Minimum-length Program Name (1 character) is accepted

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- No program named **A** exists

**Steps**
1. Enter **A** in **Program Name**
2. Enter **Single-character name boundary test** in **Description**
3. Click **Create**

**Expected result**
- Modal closes
- Program list shows **A**
- No validation error is displayed

**Gherkin**
```gherkin
  Scenario: Minimum-length Program Name is accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "A"
    And I fill in Description with "Single-character name boundary test"
    And I click Create
    Then the modal closes
    And the program list shows "A"
```

---

## Negative Flows

### TC-004 — Whitespace-only Program Name is rejected and form is not submitted

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **"   "** in **Program Name**
2. Enter **Full-stack web development program** in **Description**
3. Click **Create**

**Expected result**
- Form is not submitted
- **Program Name** is trimmed and treated as empty
- Modal remains open
- No new program appears in the program list
- **Create** is disabled and/or a validation error is shown for **Program Name**

**Gherkin**
```gherkin
  Scenario: Reject program name with only whitespace
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the form is not submitted
    And the modal remains open
    And no new program appears in the program list
```

---

### TC-005 — Duplicate Program Name is rejected with an error message

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** already exists in the program list

**Steps**
1. Navigate to the **Programs** page
2. Click **+ New Program**
3. Enter **Web Development 2026** in **Program Name**
4. Enter **Duplicate attempt for existing program** in **Description**
5. Click **Create**

**Expected result**
- An error indicates the program name already exists
- Modal remains open (or closes only after showing error feedback)
- Program list contains exactly one **Web Development 2026** entry
- No second program with the same name is created

**Gherkin**
```gherkin
  Scenario: Reject duplicate program name
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    When I navigate to the Programs page
    And I click "+ New Program"
    And I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Duplicate attempt for existing program"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list contains exactly one "Web Development 2026"
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
4. Attempt to click **Create**

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
- Program **Web Development 2026** already exists

**Steps**
1. Click **+ New Program**
2. Enter **web development 2026** in **Program Name**
3. Enter **Case-variant duplicate attempt** in **Description**
4. Click **Create**

**Expected result**
- An error indicates the program name already exists
- Program is not created
- Program list still contains only one entry for that name (case-normalized per product rules)

**Gherkin**
```gherkin
  Scenario: Case-variant duplicate Program Name is rejected
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    When I click "+ New Program"
    And I fill in Program Name with "web development 2026"
    And I fill in Description with "Case-variant duplicate attempt"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list contains exactly one program matching "Web Development 2026"
```

---

### TC-008 — Duplicate name with extra surrounding whitespace is rejected after trim

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** already exists

**Steps**
1. Click **+ New Program**
2. Enter **"  Web Development 2026  "** in **Program Name**
3. Enter **Whitespace-padded duplicate attempt** in **Description**
4. Click **Create**

**Expected result**
- Name is trimmed before duplicate check
- An error indicates the program name already exists
- No duplicate program is created

**Gherkin**
```gherkin
  Scenario: Trimmed duplicate Program Name is rejected
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    When I click "+ New Program"
    And I fill in Program Name with "  Web Development 2026  "
    And I fill in Description with "Whitespace-padded duplicate attempt"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list contains exactly one "Web Development 2026"
```

---

## Edge Cases

### TC-009 — Program Name at maximum allowed length (255 characters) is accepted

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter a **Program Name** of exactly 255 characters
2. Enter **Maximum length boundary test** in **Description**
3. Click **Create**

**Expected result**
- Program is created successfully
- Program list shows the full 255-character name

**Gherkin**
```gherkin
  Scenario: Maximum-length Program Name is accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with a 255-character string
    And I fill in Description with "Maximum length boundary test"
    And I click Create
    Then the modal closes
    And the program list shows the 255-character program name
```

---

### TC-010 — Program Name exceeding maximum length (256 characters) is rejected

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter a **Program Name** of 256 characters
2. Enter **Over max length test** in **Description**
3. Click **Create**

**Expected result**
- Validation error is shown for **Program Name**
- Form is not submitted
- Modal remains open
- Program list does not show the entered name

**Gherkin**
```gherkin
  Scenario: Program Name over maximum length is rejected
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with a 256-character string
    And I fill in Description with "Over max length test"
    And I click Create
    Then I see a validation error for Program Name
    And the program list does not show the entered program name
```

---

### TC-011 — Tab and newline-only Program Name is rejected as empty

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **"\t\n  \t"** in **Program Name**
2. Enter **Whitespace variant test** in **Description**
3. Click **Create**

**Expected result**
- Whitespace characters are trimmed/normalized
- Treated as empty name
- Form is not submitted
- No new program is created

**Gherkin**
```gherkin
  Scenario: Tab and newline-only Program Name is rejected
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "\t\n  \t"
    And I fill in Description with "Whitespace variant test"
    And I click Create
    Then the form is not submitted
    And no new program appears in the program list
```

---

### TC-012 — Unicode and emoji in Program Name are accepted

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- No program named **日本語プログラム 🎓** exists

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
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "日本語プログラム 🎓"
    And I fill in Description with "Unicode and emoji support test"
    And I click Create
    Then the modal closes
    And the program list shows "日本語プログラム 🎓"
```

---

### TC-013 — Program Name with additional special characters is accepted

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on the program creation form
- No program named **C++ & AI/ML (2026)** exists

**Steps**
1. Enter **C++ & AI/ML (2026)** in **Program Name**
2. Enter **Extended special character test** in **Description**
3. Click **Create**

**Expected result**
- Program is created successfully
- Program list shows **C++ & AI/ML (2026)** exactly as entered

**Gherkin**
```gherkin
  Scenario: Extended special characters in Program Name are accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "C++ & AI/ML (2026)"
    And I fill in Description with "Extended special character test"
    And I click Create
    Then the modal closes
    And the program list shows "C++ & AI/ML (2026)"
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
| Positive flows | TC-001 – TC-003 | 3 |
| Negative flows | TC-004 – TC-008 | 5 |
| Edge cases | TC-009 – TC-013 | 5 |
| **Total** | | **13** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Whitespace rejection mechanism** — AC says click **Create** and form is not submitted, but does not specify whether **Create** is disabled proactively or an inline error appears after click.
2. **Exact duplicate error message** — Wording, placement (inline field vs. banner/toast), and severity are not defined.
3. **Case sensitivity** — Unclear whether **web development 2026** and **Web Development 2026** are considered duplicates (TC-007 assumes case-insensitive; confirm with product).
4. **Trim scope** — AC implies trim for whitespace-only names; unclear if trim applies to all names before save and duplicate check (TC-002, TC-008 assume yes).
5. **Max length** — No maximum length specified for **Program Name**; TC-009/TC-010 assume 255 characters based on common DB limits.
6. **Allowed character set** — AC shows `&` and `-` as accepted; rules for quotes, slashes, HTML-like input, or control characters are undefined.
7. **Description requirement** — AC-2 says "fill other required fields" but does not state whether **Description** is required or optional.
8. **Duplicate scope** — Unclear if uniqueness is global, per organization, or per academic year/term.
9. **Soft-deleted programs** — No rule on whether a deleted/archived program name can be reused.
10. **Concurrent creation** — No AC for two admins creating the same name simultaneously.
11. **Post-error state** — Unclear whether entered values remain in the form after duplicate or validation errors.
12. **Success feedback for special-character names** — Only creation success is implied; no explicit confirmation message format is specified.
13. **Automation selectors** — Exact `data-testid`, `aria-label`, or error element identifiers are not provided.
