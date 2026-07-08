# DS-3 — Ticket Input: Program Name Validation and Duplicate Prevention

## Feature

Program name validation and duplicate prevention

## Role

Admin user

## Acceptance Criteria

### AC-1: Reject program name with only whitespace

```gherkin
Scenario: Reject program name with only whitespace
  Given I am on the program creation form
  When I enter "   " as the program name
  And I click Create
  Then the form is not submitted (name is trimmed, treated as empty)
```

### AC-2: Accept program name with special characters

```gherkin
Scenario: Accept program name with special characters
  Given I am on the program creation form
  When I enter "Informatique & IA - Niveau 2" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

### AC-3: Reject duplicate program name

```gherkin
Scenario: Reject duplicate program name
  Given a program "Web Development 2026" already exists
  When I try to create a new program with the same name
  Then I see an error indicating the name already exists
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
| Program Name (existing) | Web Development 2026 |
| Program Name (special chars) | Informatique & IA - Niveau 2 |
| Program Name (extended special chars) | C++ & AI/ML (2026) |
| Program Name (unicode) | 日本語プログラム 🎓 |
| Program Name (trim test) | Cloud Computing 2026 |
| Program Name (min length) | A |
| Description | Full-stack web development program |
| Description (duplicate attempt) | Duplicate attempt for existing program |

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
