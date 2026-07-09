# Prompt Template "Test Plan"
## Role
You are a senior QA engineer reviewing the feature described below.
## Task
Create a detailed test plan for https://demo.playwright.dev/todomvc
## Acceptance criteria
User can add a to do item to the list
User can mark list items as completed
User can delete an item from the liset
## Requirements for the test plan

- Cover every AC with at least one test case
- Add edge cases the ACs don't mention
  (boundary values, empty inputs, special characters, duplicates, max-length)
- Add negative test cases (what should NOT happen)
- Structure each test case as:
  - ID (TC-001, TC-002, etc.)
  - Title (expected behavior, not action)
  - Preconditions
  - Steps (numbered)
  - Expected result
- Group by: Positive flows, Negative flows, Edge cases
## Output
- Structured test plan in Markdown
- Use real field names and values, not placeholders
- At the end: list any ambiguities or gaps in the ACs
- save it in the TODO_MVC/ folder
