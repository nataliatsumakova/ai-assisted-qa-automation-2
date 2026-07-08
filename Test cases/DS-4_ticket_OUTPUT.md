# DS-4 — Ticket Output: Test Cases for Delete Program with Confirmation

## Positive Flows

### TC-001 — Confirmed deletion removes the program from the program list

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Test Program** exists with Description **Sample program for deletion testing**
- User is on the **Programs** page

**Steps**
1. Locate **Test Program** in the program list
2. Click the delete icon on **Test Program**
3. Verify a confirmation dialog is displayed
4. Click **Confirm** (or **Delete**) in the confirmation dialog

**Expected result**
- Confirmation dialog appears before deletion
- Dialog closes after confirmation
- **Test Program** is removed from the program list
- No error message is displayed

**Gherkin**
```gherkin
Feature: Delete program with confirmation

  Scenario: Delete program with confirmation
    Given I am logged in as admin
    And a program "Test Program" exists with Description "Sample program for deletion testing"
    And I am on the Programs page
    When I click the delete icon on "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list
```

---

### TC-002 — Canceling deletion keeps the program in the program list

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** exists in the program list
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **Web Development 2026**
2. Verify a confirmation dialog is displayed
3. Click **Cancel**

**Expected result**
- Confirmation dialog closes
- **Web Development 2026** remains in the program list
- No deletion occurs

**Gherkin**
```gherkin
  Scenario: Cancel program deletion
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    And I am on the Programs page
    When I click the delete icon on "Web Development 2026"
    Then I see a confirmation dialog
    When I click Cancel
    Then "Web Development 2026" still exists in the program list
```

---

### TC-003 — Deleting one program does not affect other programs in the list

**Priority:** High

**Preconditions**
- User is logged in as admin
- Programs **Test Program**, **Web Development 2026**, and **Cloud Computing 2026** exist
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **Test Program**
2. Confirm deletion in the confirmation dialog
3. Review the program list

**Expected result**
- **Test Program** is removed from the program list
- **Web Development 2026** and **Cloud Computing 2026** remain in the list
- Program count decreases by exactly one

**Gherkin**
```gherkin
  Scenario: Deleting one program leaves other programs intact
    Given I am logged in as admin
    And a program "Test Program" exists
    And a program "Web Development 2026" exists
    And a program "Cloud Computing 2026" exists
    And I am on the Programs page
    When I click the delete icon on "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And "Web Development 2026" still exists in the program list
    And "Cloud Computing 2026" still exists in the program list
```

---

## Negative Flows

### TC-004 — Program is not deleted without confirming the dialog

**Priority:** High

**Preconditions**
- User is logged in as admin
- Program **Data Science Fundamentals** exists
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **Data Science Fundamentals**
2. Verify the confirmation dialog is displayed
3. Do not click **Confirm** or **Cancel**

**Expected result**
- **Data Science Fundamentals** is not removed from the program list while the dialog is open
- No deletion occurs without explicit confirmation

**Gherkin**
```gherkin
  Scenario: Program is not deleted without confirmation
    Given I am logged in as admin
    And a program "Data Science Fundamentals" exists
    And I am on the Programs page
    When I click the delete icon on "Data Science Fundamentals"
    Then I see a confirmation dialog
    And "Data Science Fundamentals" still exists in the program list
    And no deletion has occurred
```

---

### TC-005 — Non-admin user cannot delete a program

**Priority:** High

**Preconditions**
- User is logged in as a non-admin user
- Program **Web Development 2026** exists
- User is on the **Programs** page

**Steps**
1. Locate **Web Development 2026** in the program list
2. Look for the delete icon on **Web Development 2026**

**Expected result**
- Delete icon is hidden or disabled for non-admin users
- **Web Development 2026** cannot be deleted
- Program list is unchanged

**Gherkin**
```gherkin
  Scenario: Non-admin cannot delete a program
    Given I am logged in as a non-admin user
    And a program "Web Development 2026" exists
    And I am on the Programs page
    Then I do not see the delete icon on "Web Development 2026"
    And "Web Development 2026" still exists in the program list
```

---

### TC-006 — Canceling deletion does not show the program as deleted

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Cloud Computing 2026** exists
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **Cloud Computing 2026**
2. Click **Cancel** in the confirmation dialog
3. Search or scan the program list for **Cloud Computing 2026**

**Expected result**
- **Cloud Computing 2026** is still visible in the program list
- No success/deletion message is shown
- Program data (**Program Name**, **Description**) is unchanged

**Gherkin**
```gherkin
  Scenario: Cancel does not trigger deletion side effects
    Given I am logged in as admin
    And a program "Cloud Computing 2026" exists
    And I am on the Programs page
    When I click the delete icon on "Cloud Computing 2026"
    And I click Cancel
    Then "Cloud Computing 2026" still exists in the program list
    And I do not see a deletion success message
```

---

### TC-007 — Deleting a non-existent program is not possible from the UI

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Test Program** does not exist
- User is on the **Programs** page

**Steps**
1. Review the program list for **Test Program**

**Expected result**
- **Test Program** is not listed
- No delete icon is available for **Test Program**
- No deletion action can be initiated

**Gherkin**
```gherkin
  Scenario: Non-existent program cannot be deleted
    Given I am logged in as admin
    And no program "Test Program" exists
    And I am on the Programs page
    Then I do not see "Test Program" in the program list
    And I cannot delete "Test Program"
```

---

## Edge Cases

### TC-008 — Program with special characters in the name can be deleted after confirmation

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **Informatique & IA - Niveau 2** exists
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **Informatique & IA - Niveau 2**
2. Confirm deletion in the confirmation dialog

**Expected result**
- Confirmation dialog references **Informatique & IA - Niveau 2** correctly
- Program is removed from the program list after confirmation
- Name is displayed exactly as stored (including `&`, spaces, and hyphens)

**Gherkin**
```gherkin
  Scenario: Delete program with special characters in name
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists
    And I am on the Programs page
    When I click the delete icon on "Informatique & IA - Niveau 2"
    And I confirm deletion
    Then "Informatique & IA - Niveau 2" is removed from the program list
```

---

### TC-009 — Minimum-length program name (1 character) can be deleted after confirmation

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **A** exists
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **A**
2. Confirm deletion

**Expected result**
- Confirmation dialog is shown for program **A**
- **A** is removed from the program list after confirmation

**Gherkin**
```gherkin
  Scenario: Delete program with minimum-length name
    Given I am logged in as admin
    And a program "A" exists
    And I am on the Programs page
    When I click the delete icon on "A"
    And I confirm deletion
    Then "A" is removed from the program list
```

---

### TC-010 — Maximum-length program name (255 characters) can be deleted after confirmation

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- A program with a **Program Name** of exactly 255 characters exists
- User is on the **Programs** page

**Steps**
1. Click the delete icon on the 255-character program
2. Confirm deletion

**Expected result**
- Confirmation dialog displays the full or truncated program name per UI rules
- The 255-character program is removed from the program list after confirmation

**Gherkin**
```gherkin
  Scenario: Delete program with maximum-length name
    Given I am logged in as admin
    And a program with a 255-character Program Name exists
    And I am on the Programs page
    When I click the delete icon on the 255-character program
    And I confirm deletion
    Then the 255-character program is removed from the program list
```

---

### TC-011 — Unicode program name can be deleted after confirmation

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Program **日本語プログラム 🎓** exists
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **日本語プログラム 🎓**
2. Confirm deletion

**Expected result**
- Confirmation dialog handles unicode characters correctly
- **日本語プログラム 🎓** is removed from the program list

**Gherkin**
```gherkin
  Scenario: Delete program with unicode name
    Given I am logged in as admin
    And a program "日本語プログラム 🎓" exists
    And I am on the Programs page
    When I click the delete icon on "日本語プログラム 🎓"
    And I confirm deletion
    Then "日本語プログラム 🎓" is removed from the program list
```

---

### TC-012 — Canceling deletion of a program with special characters preserves the program

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Program **C++ & AI/ML (2026)** exists
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **C++ & AI/ML (2026)**
2. Click **Cancel**

**Expected result**
- **C++ & AI/ML (2026)** remains in the program list
- Program name is unchanged and displayed correctly

**Gherkin**
```gherkin
  Scenario: Cancel deletion of program with special characters
    Given I am logged in as admin
    And a program "C++ & AI/ML (2026)" exists
    And I am on the Programs page
    When I click the delete icon on "C++ & AI/ML (2026)"
    And I click Cancel
    Then "C++ & AI/ML (2026)" still exists in the program list
```

---

### TC-013 — Deleting the only program in the list leaves an empty program list

**Priority:** Medium

**Preconditions**
- User is logged in as admin
- Only program **Test Program** exists
- User is on the **Programs** page

**Steps**
1. Click the delete icon on **Test Program**
2. Confirm deletion

**Expected result**
- **Test Program** is removed
- Program list is empty or shows an empty-state message
- No errors or broken UI state

**Gherkin**
```gherkin
  Scenario: Delete the only program in the list
    Given I am logged in as admin
    And only a program "Test Program" exists
    And I am on the Programs page
    When I click the delete icon on "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list is empty
```

---

### TC-014 — Deleted program name can be reused for a new program

**Priority:** Low

**Preconditions**
- User is logged in as admin
- Program **Test Program** was previously deleted
- User is on the **Programs** page

**Steps**
1. Click **+ New Program**
2. Enter **Test Program** in **Program Name**
3. Enter **Recreated after deletion** in **Description**
4. Click **Create**
5. Delete **Test Program** again via delete icon and confirm

**Expected result**
- A new program named **Test Program** can be created after deletion
- Second deletion flow works the same as the first (confirmation dialog → removal)

**Gherkin**
```gherkin
  Scenario: Reuse program name after deletion
    Given I am logged in as admin
    And no program "Test Program" exists
    And I am on the Programs page
    When I click "+ New Program"
    And I fill in Program Name with "Test Program"
    And I fill in Description with "Recreated after deletion"
    And I click Create
    Then the program list shows "Test Program"
    When I click the delete icon on "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
```

---

## Coverage Summary

| AC | Test ID |
|---|---|
| Delete program with confirmation | TC-001 |
| Cancel program deletion | TC-002, TC-006, TC-012 |

| Category | Test IDs | Count |
|---|---|---|
| Positive flows | TC-001 – TC-003 | 3 |
| Negative flows | TC-004 – TC-007 | 4 |
| Edge cases | TC-008 – TC-014 | 7 |
| **Total** | | **14** |

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Confirmation dialog content** — AC does not specify dialog title, body text, or whether the program name (**Test Program**) must appear in the message.
2. **Confirm button label** — AC says "confirm deletion" but does not define the button text (**Delete**, **Confirm**, **Yes**, etc.).
3. **Dismiss without Cancel** — No AC for closing the dialog via **X**, **Escape**, or clicking outside the modal; behavior may differ from **Cancel**.
4. **Success feedback** — No toast, banner, or inline message is specified after successful deletion; only list removal is stated.
5. **Admin authorization** — ACs do not state that only admin users may delete; assumed from related create/edit tickets.
6. **Soft delete vs hard delete** — Unclear whether deletion is permanent or archived; affects whether the name can be reused and whether data is recoverable.
7. **Linked data / dependencies** — No rule for deleting programs tied to courses, enrollments, or other entities (block vs cascade delete).
8. **Concurrent deletion** — No behavior defined if the same program is deleted in two sessions or deleted while another user is editing it.
9. **Empty list state** — AC does not define UI when the last program is deleted (empty state message vs blank list).
10. **Duplicate names in list** — If duplicates were ever allowed historically, AC does not clarify whether delete targets one row or all matching names.
11. **Loading / error handling** — No AC for failed deletion (network error, server 500) or in-progress loading state on **Confirm**.
12. **Accessibility** — No requirements for keyboard navigation, focus trap, or screen reader labels on the delete icon or confirmation dialog.
13. **Automation selectors** — Exact `data-testid`, `aria-label`, or icon identifier for the delete control is not specified.
