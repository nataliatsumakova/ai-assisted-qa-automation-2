# DS-5 — Ticket Input: Program List Filtering and Display

## Feature

Program list filtering and display

## Role

Admin user

## Acceptance Criteria

### AC-1: Display program list with key details

```gherkin
Scenario: Display program list with key details
  Given programs exist in the system
  When I navigate to the Programs page
  Then I see a list showing each program's name and description
```

### AC-2: Empty state when no programs exist

```gherkin
Scenario: Empty state when no programs exist
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program
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
| Empty state | Message indicating no programs have been created |
| Empty state CTA | Prompt to create the first program |

## Test Data

| Field | Sample value |
|---|---|
| Program Name (primary) | Web Development 2026 |
| Description (primary) | Full-stack web development program |
| Program Name (secondary) | Cloud Computing 2026 |
| Description (secondary) | Cloud infrastructure and services program |
| Program Name (delete target) | Test Program |
| Description (delete target) | Sample program for deletion testing |
| Program Name (no-description test) | Data Science Fundamentals |
| Program Name (updated variant) | Web Development 2026 - Updated |
| Description (updated variant) | Full-stack web development program — revised curriculum |
| Program Name (special chars) | Informatique & IA - Niveau 2 |
| Description (special chars) | Advanced informatics and AI track |
| Program Name (extended special chars) | C++ & AI/ML (2026) |
| Description (extended special chars) | Advanced C++ and machine learning curriculum |
| Program Name (unicode) | 日本語プログラム 🎓 |
| Description (unicode) | Japanese-language academic program |
| Program Name (min length) | A |
| Description (min length boundary) | Single-character name boundary test |
| Program Name (max length) | Enterprise Software Architecture and Distributed Systems Engineering Professional Certificate 2026 |
| Description (max length) | This program covers enterprise architecture patterns, microservices, event-driven systems, cloud-native deployment, security hardening, observability, and capstone project delivery across twelve intensive modules designed for senior engineering professionals. |

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
