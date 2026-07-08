# DS-4 — Ticket Input: Delete Program with Confirmation

## Feature

Delete program with confirmation

## Role

Admin user

## Acceptance Criteria

### AC-1: Delete program with confirmation

```gherkin
Scenario: Delete program with confirmation
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  Then I see a confirmation dialog
  When I confirm deletion
  Then "Test Program" is removed from the program list
```

### AC-2: Cancel program deletion

```gherkin
Scenario: Cancel program deletion
  Given I click the delete icon for a program
  When I see the confirmation dialog
  And I click Cancel
  Then the program still exists in the list
```

## UI Elements

| Element | Label / Text |
|---|---|
| Navigation entry | Programs page |
| Action control | Delete icon (per program row) |
| Container | Confirmation dialog |
| Confirm action | Confirm / Delete (confirm deletion) |
| Dismiss control | Cancel |
| Result view | Program list |

## Test Data

| Field | Sample value |
|---|---|
| Program Name (primary delete target) | Test Program |
| Description (primary delete target) | Sample program for deletion testing |
| Program Name (cancel test) | Web Development 2026 |
| Program Name (secondary, multi-delete test) | Cloud Computing 2026 |
| Program Name (no-description test) | Data Science Fundamentals |
| Program Name (special chars) | Informatique & IA - Niveau 2 |
| Program Name (extended special chars) | C++ & AI/ML (2026) |
| Program Name (unicode) | 日本語プログラム 🎓 |
| Program Name (min length) | A |
| Description (reuse after delete) | Recreated after deletion |

## Requirements for Test Cases

- One test per acceptance criterion
- All test cases must be in Gherkin
- Cover every AC with at least one test case
- Add edge cases the ACs don't mention (boundary values, empty inputs, special characters, duplicates, max-length)
- Add negative test cases (what should NOT happen)
- Structure each test case as:
  - ID (TC-001, TC-002, etc.)
  - Title (expected behavior, not action)
  - Preconditions
  - Steps (numbered)
  - Expected result
  - Priority (High / Medium / Low)
- Group by: Positive flows, Negative flows, Edge cases
- Use real field names and values, not placeholders
