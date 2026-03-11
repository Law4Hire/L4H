# Implementation Plan: Strip out multilingual components to enforce English ONLY

## Phase 1: Clean Up Testing Suite
- [x] Task: Remove multilingual test scripts from package.json 677de07
    - [ ] Write Tests (Update test assertions to verify English-only fallback)
    - [ ] Implement Feature (Remove RTL/CJK and other language scripts)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Clean Up Testing Suite' (Protocol in workflow.md)

## Phase 2: Frontend Localization Removal
- [ ] Task: Remove localization libraries and config from React frontend
    - [ ] Write Tests (Verify UI renders default English text without translation keys)
    - [ ] Implement Feature (Uninstall i18n libs, remove LanguageSwitcher components)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend Localization Removal' (Protocol in workflow.md)

## Phase 3: Backend & Database Cleanup
- [ ] Task: Remove language-specific API routing or headers handling
    - [ ] Write Tests (Ensure API requests without Accept-Language headers succeed with English)
    - [ ] Implement Feature (Remove middleware/logic checking for language preference)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Backend & Database Cleanup' (Protocol in workflow.md)