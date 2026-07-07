# DS-2 — Ticket Output: Test Cases for Create New Academic Program

## Positive Flows

### TC-001 — Program creation form is displayed from Programs page

**Priority:** High

**Preconditions**
- User is logged in as admin
- User has permission to create programs

**Steps**
1. Navigate to the Programs page
2. Click **+ New Program**

**Expected result**
- Program creation form is displayed
- **Program Name** field is visible
- **Description** field is visible

**Gherkin**
```gherkin
Feature: Create new academic program

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields: Program Name, Description
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
- Program list shows **Web Development 2026**
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

## Negative Flows

### TC-005 — Program is not created when Program Name contains only whitespace

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **"   "** (spaces only) in **Program Name**
2. Enter **Introductory course track** in **Description**
3. Attempt to click **Create**

**Expected result**
- **Create** button remains disabled, or validation error is shown
- Program is not created
- Modal remains open
- Program list does not show a new entry

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

### TC-006 — Duplicate program name is not allowed

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
- Modal does not close (or closes with error feedback)
- Validation or error message indicates duplicate program name
- Program list still contains only one **Web Development 2026** entry

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

---

### TC-007 — Canceling the form does not create a program

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Temporary Program** in **Program Name**
2. Enter **Should not be saved** in **Description**
3. Click **Cancel** or close the modal

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

### TC-008 — Non-admin user cannot access program creation

**Priority:** High

**Preconditions**
- User is logged in as a non-admin role (e.g., instructor or viewer)

**Steps**
1. Navigate to the Programs page
2. Look for **+ New Program** control

**Expected result**
- **+ New Program** button is hidden or disabled
- Program creation form is not accessible
- No new program can be created

**Gherkin**
```gherkin
  Scenario: Non-admin cannot create a program
    Given I am logged in as a non-admin user
    When I navigate to the Programs page
    Then I do not see the "+ New Program" button
    And I cannot access the program creation form
```

---

## Edge Cases

### TC-009 — Program Name at minimum valid length (1 character)

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

### TC-010 — Program Name at maximum allowed length

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
- Program list shows the 255-character name

**Gherkin**
```gherkin
  Scenario: Maximum-length Program Name is accepted
    Given I am on the program creation form
    When I fill in Program Name with a 255-character string
    And I fill in Description with "Maximum length boundary test"
    And I click Create
    Then the modal closes
    And the program list shows the 255-character program name
```

---

### TC-011 — Program Name exceeding maximum length is rejected

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter a **Program Name** of 256 characters
2. Enter **Over max length test** in **Description**
3. Attempt to click **Create**

**Expected result**
- Validation error is shown for **Program Name**
- Program is not created
- Modal remains open

**Gherkin**
```gherkin
  Scenario: Program Name over maximum length is rejected
    Given I am on the program creation form
    When I fill in Program Name with a 256-character string
    And I fill in Description with "Over max length test"
    And I click Create
    Then I see a validation error for Program Name
    And the program list does not show the entered program name
```

---

### TC-012 — Special characters in Program Name are handled correctly

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

### TC-013 — Unicode and emoji in Program Name are handled correctly

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

### TC-014 — Leading and trailing spaces in Program Name are trimmed

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

### TC-015 — Very long Description is handled correctly

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is on the program creation form

**Steps**
1. Enter **Cybersecurity Bootcamp** in **Program Name**
2. Enter a **Description** of 2000 characters
3. Click **Create**

**Expected result**
- If within limit: program is created and description is stored
- If over limit: validation error is shown and program is not created

**Gherkin**
```gherkin
  Scenario: Long Description is handled per field limits
    Given I am on the program creation form
    When I fill in Program Name with "Cybersecurity Bootcamp"
    And I fill in Description with a 2000-character string
    And I click Create
    Then either the modal closes and the program list shows "Cybersecurity Bootcamp"
    Or I see a validation error for Description
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
| Positive flows | TC-001 – TC-004 | 4 |
| Negative flows | TC-005 – TC-008 | 4 |
| Edge cases | TC-009 – TC-015 | 7 |
| **Total** | | **15** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Description required?** ACs only validate empty **Program Name**; **Description** optionality is unclear.
2. **Max length not specified** for **Program Name** or **Description**.
3. **Whitespace handling** — behavior for whitespace-only **Program Name** is undefined.
4. **Duplicate names** — no rule on whether duplicate **Program Name** values are allowed.
5. **Trim behavior** — unclear if leading/trailing spaces are trimmed before save.
6. **Case sensitivity** — unclear if names differing only by case are duplicates.
7. **Cancel / close behavior** — no AC for dismissing the modal without saving.
8. **Success feedback** — no toast, banner, or inline confirmation specified beyond list update.
9. **List sort/order** — unclear where the new program appears in the list.
10. **Permissions** — AC assumes admin only; other roles not defined.
11. **Special characters / Unicode** — no guidance on allowed character sets.
12. **Network/server errors** — no AC for failed **Create** due to API or server error.
13. **Concurrent creation** — no AC for simultaneous duplicate creation by two admins.
14. **Automation selectors** — exact `data-testid` or `aria-label` values not specified.
