# DS-1 — Ticket Input: Create New Academic Program

## Feature

Create new academic program

## Role

Admin user

## Acceptance Criteria

### AC-1: Navigate to program creation form

```gherkin
Scenario: Navigate to program creation form
  Given I am logged in as admin
  When I navigate to the Programs page
  And I click "+ New Program"
  Then I see the program creation form with fields: Program Name, Description
```

### AC-2: Successfully create a program

```gherkin
Scenario: Successfully create a program
  Given I am on the program creation form
  When I fill in Program Name with "Web Development 2026"
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the modal closes
  And the program list shows "Web Development 2026"
```

### AC-3: Validation prevents empty program name

```gherkin
Scenario: Validation prevents empty program name
  Given I am on the program creation form
  When I leave the Program Name field empty
  Then the Create button is disabled
```

## UI Elements

| Element | Label / Text |
|---|---|
| Navigation entry | Programs page |
| Action button | + New Program |
| Form field | Program Name |
| Form field | Description |
| Submit button | Create |
| Container | Modal (closes on successful create) |
| Result view | Program list |

## Test Data

| Field | Sample value |
|---|---|
| Program Name | Web Development 2026 |
| Description | Full-stack web development program |

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
