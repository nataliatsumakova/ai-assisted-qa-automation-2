# DS-2 — Ticket Output: Test Cases for Edit Existing Program Details

## Positive Flows

### TC-001 — Edit form opens pre-populated with current program data

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists with Description **Full-stack web development program**
- User is on the Programs page

**Steps**
1. Locate **Web Development 2026** in the program list
2. Click the edit icon on **Web Development 2026**

**Expected result**
- Edit form (modal) is displayed
- **Program Name** is pre-populated with **Web Development 2026**
- **Description** is pre-populated with **Full-stack web development program**
- **Save** button is visible

**Gherkin**
```gherkin
Feature: Edit existing program details

  Scenario: Open program for editing
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form pre-populated with Program Name "Web Development 2026"
    And I see the edit form pre-populated with Description "Full-stack web development program"
```

---

### TC-002 — Program name update is saved and reflected in the program list

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to **Web Development 2026 - Updated**
2. Click **Save**

**Expected result**
- Modal closes
- Program list immediately shows **Web Development 2026 - Updated**
- **Web Development 2026** no longer appears in the list
- No error message is displayed

**Gherkin**
```gherkin
  Scenario: Successfully edit a program name
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"
    And the program list does not show "Web Development 2026"
```

---

### TC-003 — Unchanged fields are preserved when only Description is edited

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists with Description **Full-stack web development program**
- User is editing **Web Development 2026**

**Steps**
1. Leave **Program Name** as **Web Development 2026**
2. Change **Description** to **Full-stack web development program — revised curriculum**
3. Click **Save**

**Expected result**
- Modal closes
- Program list still shows **Web Development 2026** (name unchanged)
- Updated description is persisted (visible on re-open of edit form or detail view)
- No other fields are modified

**Gherkin**
```gherkin
  Scenario: Edit preserves unchanged fields
    Given I am logged in as admin
    And I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I only change Description to "Full-stack web development program — revised curriculum"
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program "Web Development 2026" has Description "Full-stack web development program — revised curriculum"
```

---

### TC-004 — Description-only edit succeeds with Program Name unchanged

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Data Science Fundamentals** exists with an empty **Description**
- User is editing **Data Science Fundamentals**

**Steps**
1. Enter **Introductory data science track** in **Description**
2. Leave **Program Name** unchanged
3. Click **Save**

**Expected result**
- Modal closes
- Program list shows **Data Science Fundamentals**
- **Description** is saved as **Introductory data science track**

**Gherkin**
```gherkin
  Scenario: Successfully edit Description on program with empty Description
    Given I am logged in as admin
    And I am editing "Data Science Fundamentals" with an empty Description
    When I fill in Description with "Introductory data science track"
    And I click Save
    Then the modal closes
    And the program list shows "Data Science Fundamentals"
    And the program "Data Science Fundamentals" has Description "Introductory data science track"
```

---

### TC-005 — Save with no changes keeps program data unchanged

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists with Description **Full-stack web development program**
- User is editing **Web Development 2026**

**Steps**
1. Do not modify any fields
2. Click **Save**

**Expected result**
- Modal closes
- Program list still shows **Web Development 2026**
- Program data remains unchanged

**Gherkin**
```gherkin
  Scenario: Save without changes keeps program data intact
    Given I am logged in as admin
    And I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I click Save without changing any fields
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program "Web Development 2026" has Description "Full-stack web development program"
```

---

## Negative Flows

### TC-006 — Empty Program Name prevents save

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is editing **Web Development 2026**

**Steps**
1. Clear **Program Name** (leave empty)
2. Observe **Save** button state or attempt to click **Save**

**Expected result**
- **Save** button is disabled, or validation error is shown
- Program is not updated
- Modal remains open
- Program list still shows **Web Development 2026**

**Gherkin**
```gherkin
  Scenario: Validation prevents empty Program Name on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I clear the Program Name field
    Then the Save button is disabled
    And the program list still shows "Web Development 2026"
```

---

### TC-007 — Whitespace-only Program Name is rejected on edit

**Priority:** High

**Preconditions**
- User is logged in as admin
- User is editing **Web Development 2026**

**Steps**
1. Replace **Program Name** with **"   "** (spaces only)
2. Attempt to click **Save**

**Expected result**
- **Save** button remains disabled, or validation error is shown
- Original program name **Web Development 2026** is not overwritten
- Modal remains open

**Gherkin**
```gherkin
  Scenario: Whitespace-only Program Name is rejected on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to "   "
    Then the Save button is disabled
    And the program list still shows "Web Development 2026"
```

---

### TC-008 — Duplicate Program Name is not allowed on edit

**Priority:** High

**Preconditions**
- User is logged in as admin
- Programs **Web Development 2026** and **Cloud Computing 2026** exist
- User is editing **Cloud Computing 2026**

**Steps**
1. Change **Program Name** to **Web Development 2026**
2. Click **Save**

**Expected result**
- Modal does not close (or closes with error feedback)
- Validation or error message indicates duplicate **Program Name**
- Program list still shows **Cloud Computing 2026** and **Web Development 2026** as separate entries

**Gherkin**
```gherkin
  Scenario: Duplicate program name is rejected on edit
    Given I am logged in as admin
    And the program list contains "Web Development 2026"
    And the program list contains "Cloud Computing 2026"
    And I am editing "Cloud Computing 2026"
    When I change Program Name to "Web Development 2026"
    And I click Save
    Then I see a validation error for duplicate Program Name
    And the program list contains "Cloud Computing 2026"
    And the program list contains "Web Development 2026"
```

---

### TC-009 — Canceling edit does not persist changes

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists with Description **Full-stack web development program**
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to **Should Not Be Saved**
2. Change **Description** to **Temporary edit**
3. Click **Cancel** or close the modal

**Expected result**
- Modal closes
- Program list still shows **Web Development 2026**
- **Description** remains **Full-stack web development program**

**Gherkin**
```gherkin
  Scenario: Canceling edit does not persist changes
    Given I am logged in as admin
    And I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I change Program Name to "Should Not Be Saved"
    And I change Description to "Temporary edit"
    And I click Cancel
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program "Web Development 2026" has Description "Full-stack web development program"
```

---

### TC-010 — Non-admin user cannot edit a program

**Priority:** High

**Preconditions**
- User is logged in as a non-admin role (e.g., instructor or viewer)
- Program **Web Development 2026** exists on the Programs page

**Steps**
1. Navigate to the Programs page
2. Locate **Web Development 2026**
3. Look for the edit icon or edit action

**Expected result**
- Edit icon is hidden or disabled
- Edit form is not accessible
- Program cannot be modified

**Gherkin**
```gherkin
  Scenario: Non-admin cannot edit a program
    Given I am logged in as a non-admin user
    And I am on the Programs page
    And a program "Web Development 2026" exists
    Then I do not see an enabled edit icon on "Web Development 2026"
    And I cannot access the program edit form
```

---

### TC-011 — Server/API failure does not corrupt program data

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is editing **Web Development 2026**
- Save API returns an error (simulated or mocked)

**Steps**
1. Change **Program Name** to **Web Development 2026 - Failed Save**
2. Click **Save**

**Expected result**
- Error message is displayed to the user
- Modal remains open (or reopens with entered values)
- Program list still shows **Web Development 2026** (original data intact)

**Gherkin**
```gherkin
  Scenario: Failed save does not update program list
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And the save program API will fail
    When I change Program Name to "Web Development 2026 - Failed Save"
    And I click Save
    Then I see an error message indicating the save failed
    And the program list still shows "Web Development 2026"
```

---

## Edge Cases

### TC-012 — Program Name at minimum valid length (1 character) on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to **A**
2. Click **Save**

**Expected result**
- Modal closes
- Program list shows **A**

**Gherkin**
```gherkin
  Scenario: Minimum-length Program Name is accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to "A"
    And I click Save
    Then the modal closes
    And the program list shows "A"
```

---

### TC-013 — Program Name at maximum allowed length (255 characters) on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to a 255-character string
2. Click **Save**

**Expected result**
- Modal closes
- Program list shows the 255-character name

**Gherkin**
```gherkin
  Scenario: Maximum-length Program Name is accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to a 255-character string
    And I click Save
    Then the modal closes
    And the program list shows the 255-character program name
```

---

### TC-014 — Program Name exceeding maximum length is rejected on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to a 256-character string
2. Attempt to click **Save**

**Expected result**
- Validation error is shown for **Program Name**
- Program is not updated
- Modal remains open
- Program list still shows **Web Development 2026**

**Gherkin**
```gherkin
  Scenario: Program Name over maximum length is rejected on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to a 256-character string
    And I click Save
    Then I see a validation error for Program Name
    And the program list still shows "Web Development 2026"
```

---

### TC-015 — Special characters in Program Name are handled correctly on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to **C++ & AI/ML (2026)**
2. Click **Save**

**Expected result**
- Modal closes
- Program list shows **C++ & AI/ML (2026)** exactly as entered

**Gherkin**
```gherkin
  Scenario: Special characters in Program Name are accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to "C++ & AI/ML (2026)"
    And I click Save
    Then the modal closes
    And the program list shows "C++ & AI/ML (2026)"
```

---

### TC-016 — Unicode and emoji in Program Name are handled correctly on edit

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to **日本語プログラム 🎓**
2. Click **Save**

**Expected result**
- Modal closes
- Program list displays **日本語プログラム 🎓** correctly

**Gherkin**
```gherkin
  Scenario: Unicode and emoji in Program Name are accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to "日本語プログラム 🎓"
    And I click Save
    Then the modal closes
    And the program list shows "日本語プログラム 🎓"
```

---

### TC-017 — Leading and trailing spaces in Program Name are trimmed on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to **"  Cloud Computing 2026  "**
2. Click **Save**

**Expected result**
- Program is saved with trimmed name **Cloud Computing 2026**
- Program list shows **Cloud Computing 2026** (without leading/trailing spaces)

**Gherkin**
```gherkin
  Scenario: Leading and trailing spaces are trimmed from Program Name on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to "  Cloud Computing 2026  "
    And I click Save
    Then the modal closes
    And the program list shows "Cloud Computing 2026"
```

---

### TC-018 — Description can be cleared on edit

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists with Description **Full-stack web development program**
- User is editing **Web Development 2026**

**Steps**
1. Clear **Description** (leave empty)
2. Leave **Program Name** unchanged
3. Click **Save**

**Expected result**
- Modal closes
- **Program Name** remains **Web Development 2026**
- **Description** is saved as empty

**Gherkin**
```gherkin
  Scenario: Description can be cleared on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I clear the Description field
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program "Web Development 2026" has an empty Description
```

---

### TC-019 — Very long Description is handled per field limits on edit

**Priority:** Low

**Preconditions**
- User is logged in as admin
- User is editing **Cybersecurity Bootcamp**

**Steps**
1. Change **Description** to a 2000-character string
2. Click **Save**

**Expected result**
- If within limit: modal closes and description is stored
- If over limit: validation error is shown and program is not updated

**Gherkin**
```gherkin
  Scenario: Long Description is handled per field limits on edit
    Given I am logged in as admin
    And I am editing "Cybersecurity Bootcamp"
    When I change Description to a 2000-character string
    And I click Save
    Then either the modal closes and the program "Cybersecurity Bootcamp" has the updated Description
    Or I see a validation error for Description
```

---

### TC-020 — Renaming to same name (case-only change) behavior is defined

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists
- User is editing **Web Development 2026**

**Steps**
1. Change **Program Name** to **web development 2026** (different casing only)
2. Click **Save**

**Expected result**
- Behavior follows product rule:
  - **If case-insensitive duplicates allowed:** save succeeds and list shows updated casing
  - **If treated as duplicate/no-op:** validation message or no change

**Gherkin**
```gherkin
  Scenario: Case-only Program Name change follows duplicate rules
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change Program Name to "web development 2026"
    And I click Save
    Then either the modal closes and the program list shows "web development 2026"
    Or I see a validation error indicating the name is not allowed
```

---

## Coverage Summary

| AC | Test ID |
|---|---|
| Open program for editing (form pre-populated) | TC-001 |
| Successfully edit a program name | TC-002 |
| Edit preserves unchanged fields | TC-003 |

| Category | Test IDs | Count |
|---|---|---|
| Positive flows | TC-001 – TC-005 | 5 |
| Negative flows | TC-006 – TC-011 | 6 |
| Edge cases | TC-012 – TC-020 | 9 |
| **Total** | | **20** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Field label mismatch** — ACs refer to **Name**; the Create flow uses **Program Name**. Assumed they are the same field.
2. **Complete field list** — ACs mention only **Name** and **Description**. Unclear if edit form includes additional fields (status, dates, code, etc.) that must also be preserved.
3. **How to verify preserved fields** — AC says "Name and other fields remain unchanged" but does not specify where to assert Description after save (re-open edit form, detail view, API).
4. **Validation rules on edit** — Create flow disables submit for empty name; unclear if edit uses the same rules (**Save** disabled vs. inline error).
5. **Duplicate name on self-edit** — Renaming **Web Development 2026** to itself (or same name with different casing) is not defined.
6. **Duplicate name across programs** — No AC for editing one program to another program's existing name.
7. **Max length** — No limits specified for **Program Name** or **Description** on edit (255/256 assumed from Create test plan).
8. **Whitespace handling** — Trim behavior and whitespace-only names not mentioned.
9. **Empty Description** — Unclear whether **Description** can be cleared on edit.
10. **Cancel / dismiss** — No AC for closing the modal without saving.
11. **Permissions** — ACs assume access but do not define non-admin behavior.
12. **Success feedback** — No toast/banner specified; only modal close and list update.
13. **List update timing** — "Immediately" implies no manual refresh; optimistic vs. refetch behavior is unspecified.
14. **Concurrent edits** — No AC for two admins editing the same program simultaneously (last-write-wins vs. conflict error).
15. **Network/server errors** — No AC for failed **Save** due to API or server error.
16. **Edit entry point** — Only "edit icon" is mentioned; no spec for row click, context menu, or keyboard access.
17. **Program with dependencies** — Unclear if renaming affects linked courses, enrollments, or reports.
18. **Automation selectors** — Exact `data-testid`, `aria-label`, or icon identifier for the edit control is not specified.
