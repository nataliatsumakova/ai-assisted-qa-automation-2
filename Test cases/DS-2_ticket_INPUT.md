# DS-2 — Ticket Input: Edit Existing Program Details

## Feature

Edit existing program details

## Role

Admin user

## Acceptance Criteria

### AC-1: Open program for editing

```gherkin
Scenario: Open program for editing
  Given I am on the Programs page
  And a program "Web Development 2026" exists
  When I click the edit icon on "Web Development 2026"
  Then I see the edit form pre-populated with the program's current data
```

### AC-2: Successfully edit a program name

```gherkin
Scenario: Successfully edit a program name
  Given I am editing "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows "Web Development 2026 - Updated"
```

### AC-3: Edit preserves unchanged fields

```gherkin
Scenario: Edit preserves unchanged fields
  Given I am editing a program
  When I only change the Description
  And I click Save
  Then the Name and other fields remain unchanged
```

## UI Elements

| Element | Label / Text |
|---|---|
| Navigation entry | Programs page |
| Action control | Edit icon (per program row) |
| Form field | Program Name |
| Form field | Description |
| Submit button | Save |
| Dismiss control | Cancel |
| Container | Modal (closes on successful save) |
| Result view | Program list |

## Test Data

| Field | Sample value |
|---|---|
| Program Name (existing) | Web Development 2026 |
| Program Name (updated) | Web Development 2026 - Updated |
| Description (existing) | Full-stack web development program |
| Description (updated) | Full-stack web development program — revised curriculum |
| Secondary program (duplicate test) | Cloud Computing 2026 |
| Program with empty Description | Data Science Fundamentals |

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
