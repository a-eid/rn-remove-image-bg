# Fix: Missing `import NitroModules` in Swift (Nitro 0.35.x Compatibility)

## TL;DR

> **Quick Summary**: Add missing `import NitroModules` to the iOS Swift implementation file to restore compatibility with `react-native-nitro-modules@0.35.9` after Expo 56 / RN 0.85.3 upgrade.
> 
> **Deliverables**:
> - `ios/HybridImageBackgroundRemover.swift` — one import line added
> - `package.json` — version bump to `0.0.33`
> 
> **Estimated Effort**: Quick (~2 minutes)
> **Parallel Execution**: NO — sequential (2 tasks, each depends on previous)
> **Critical Path**: Task 1 → Task 2

---

## Context

### Original Request
After upgrading `react-native-nitro-modules` to `0.35.9` and `react-native` to `0.85.3`, the iOS build fails with:
```
cannot find type 'Promise' in scope (HybridImageBackgroundRemover.swift:33:96)
```

### Root Cause
`ios/HybridImageBackgroundRemover.swift` is missing `import NitroModules`. The file uses:
- `Promise<String>` (line 33) — from NitroModules
- `Promise.async { }` (line 34) — from NitroModules
- `RuntimeError.error(withMessage:)` (10 occurrences) — from NitroModules

All nitrogen-generated files already have `import NitroModules`, but the hand-written implementation file doesn't. This was likely working before due to transitive module resolution through umbrella headers that changed in the 0.35.x restructuring.

### Why NOT regenerating nitrogen specs
The `nitrogen/generated/` directory is already generated with `nitrogen@0.35.9` and is correct. Re-running `pnpm run specs` would:
- Risk the known `lib/` deletion bug (see commit `a68e8b7`)
- Produce no meaningful changes to the generated files
- Add unnecessary complexity and risk

The fix is purely in the hand-written implementation file.

### Metis Review
**Identified Gaps** (addressed):
- **Android is unaffected**: Kotlin file already has correct imports (`com.margelo.nitro.core.Promise`, `com.margelo.nitro.NitroModules`).
- **No API changes**: `Promise<T>`, `RuntimeError` APIs are unchanged in 0.35.9.

---

## Work Objectives

### Core Objective
Fix the iOS build failure so the library compiles against `react-native-nitro-modules@0.35.9`.

### Concrete Deliverables
- `ios/HybridImageBackgroundRemover.swift` with `import NitroModules` added
- Version `0.0.33` in `package.json`

### Definition of Done
- [x] `pnpm run typecheck` exits 0
- [x] `pnpm test` exits 0
- [x] `import NitroModules` present in `ios/HybridImageBackgroundRemover.swift`
- [x] Version `0.0.33` in `package.json`

### Must Have
- `import NitroModules` in the Swift implementation file
- Version bump to `0.0.33`

### Must NOT Have (Guardrails)
- ❌ NO changes to any file under `nitrogen/generated/` — specs are already correct
- ❌ NO running `pnpm run specs` — unnecessary and risks `lib/` deletion
- ❌ NO changes to `android/` — it works fine
- ❌ NO changes to `src/` — TypeScript source is correct
- ❌ NO changes to `NitroRnRemoveImageBg.podspec` — no config changes needed
- ❌ NO changes to `ios/NitroRnRemoveImageBgOnLoad.mm` — bridge is correct
- ❌ NO behavior changes in the Swift implementation — only the import
- ❌ NO dependency updates beyond what's already in `package.json`
- ❌ NO auto-publishing to npm — user will decide when to publish separately

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **Automated tests**: Tests-after (existing tests must still pass)
- **Framework**: vitest

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Sequential Execution (each step depends on previous)

```
Step 1: Add import NitroModules to Swift file [quick]
    ↓
Step 2: Version bump + verify tests pass [quick]
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 2 |
| 2 | 1 | — |

### Agent Dispatch Summary
- **1**: `quick` — single import addition
- **2**: `quick` — version bump + test

---

## TODOs

- [x] 1. Add `import NitroModules` to Swift implementation file

  **What to do**:
  - Add `import NitroModules` to `ios/HybridImageBackgroundRemover.swift` as the second import line (after `import Foundation`, before `import Vision`)
  - This is the ONLY change to this file — no other modifications

  **Must NOT do**:
  - Do not modify any other part of the Swift file
  - Do not modify any other file in `ios/`
  - Do not change behavior, refactor, or "improve" anything
  - Do not run `pnpm run specs` — the generated files are already correct

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [] (no specialized skills needed for a single import addition)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (first task)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `nitrogen/generated/ios/swift/HybridImageBackgroundRemoverSpec.swift:8` — This generated file already has `import NitroModules`. Match this pattern.

  **API/Type References** (contracts to implement against):
  - `node_modules/react-native-nitro-modules/ios/core/Promise.swift` — The `Promise<T>` class definition that will be resolved by the import
  - `node_modules/react-native-nitro-modules/ios/core/RuntimeError.swift` — The `RuntimeError` class used extensively in the implementation

  **WHY Each Reference Matters**:
  - The generated spec shows the canonical import pattern for NitroModules in this project
  - The Promise and RuntimeError source files confirm these are NitroModules types that require the import

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Import is correctly added
    Tool: Bash (grep)
    Preconditions: File exists at ios/HybridImageBackgroundRemover.swift
    Steps:
      1. Run: grep -n "import NitroModules" ios/HybridImageBackgroundRemover.swift
      2. Verify output contains exactly one line with "import NitroModules"
      3. Run: grep -c "import" ios/HybridImageBackgroundRemover.swift
      4. Verify count is 7 (was 6, now 7 with the new import)
    Expected Result: Single match for "import NitroModules", total import count is 7
    Failure Indicators: Zero matches, or multiple matches
    Evidence: .sisyphus/evidence/task-1-import-added.txt

  Scenario: No unintended modifications to the file
    Tool: Bash (git diff)
    Preconditions: Git working tree has the change
    Steps:
      1. Run: git diff ios/HybridImageBackgroundRemover.swift
      2. Verify diff shows ONLY the addition of "import NitroModules" line
      3. No other lines modified, removed, or reordered
    Expected Result: Exactly one green line added: "+import NitroModules"
    Failure Indicators: Any other lines changed, or import placed in wrong position
    Evidence: .sisyphus/evidence/task-1-diff-clean.txt
  ```

  **Commit**: NO (groups with Task 2)
  - Files: `ios/HybridImageBackgroundRemover.swift`

- [x] 2. Bump version and verify tests pass

  **What to do**:
  - Update `version` field in `package.json` from `"0.0.32"` to `"0.0.33"`
  - Run `pnpm run typecheck` — must exit 0
  - Run `pnpm test` — all vitest tests must pass

  **Must NOT do**:
  - Do not change any dependency versions in `package.json`
  - Do not modify `peerDependencies` ranges
  - Do not publish to npm — user will decide when to publish separately
  - Do not run `pnpm run specs` — unnecessary

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [] (standard npm workflow)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: Final Verification
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `package.json:3` — Current version `"0.0.32"`, bump to `"0.0.33"`

  **WHY Each Reference Matters**:
  - Version bump follows semver patch for bug fix

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Version bumped correctly
    Tool: Bash (grep)
    Preconditions: package.json is modified
    Steps:
      1. Run: grep '"version": "0.0.33"' package.json
      2. Verify single match
    Expected Result: Version is 0.0.33
    Failure Indicators: No match or wrong version
    Evidence: .sisyphus/evidence/task-2-version-bump.txt

  Scenario: TypeScript checks and tests pass
    Tool: Bash
    Preconditions: All changes applied
    Steps:
      1. Run: pnpm run typecheck
      2. Verify exit code 0
      3. Run: pnpm test
      4. Verify all tests pass
    Expected Result: typecheck exits 0, all vitest tests pass
    Failure Indicators: Non-zero exit code, or any test failures
    Evidence: .sisyphus/evidence/task-2-tests-pass.txt
  ```

  **Commit**: YES
  - Message: `fix(ios): add missing import NitroModules for 0.35.x compatibility`
  - Files: `ios/HybridImageBackgroundRemover.swift`, `package.json`
  - Pre-commit: `pnpm run typecheck && pnpm test`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> Single verification agent. Present results to user and get explicit "okay" before completing.

- [x] F1. **Build Fix Verification** — `quick`
  1. Run `grep -c "import NitroModules" ios/HybridImageBackgroundRemover.swift` → must return `1`
  2. Run `pnpm run typecheck` → must exit 0
  3. Run `pnpm test` → must exit 0
  4. Run `grep '"version": "0.0.33"' package.json` → must match
  5. Run `git diff --name-only` → must show only expected files (Swift, package.json)
  Output: `Import [PASS/FAIL] | Typecheck [PASS/FAIL] | Tests [PASS/FAIL] | Version [MATCH/MISMATCH] | VERDICT`

---

## Commit Strategy

- **Task 1-2 combined**: `fix(ios): add missing import NitroModules for 0.35.x compatibility` — `ios/HybridImageBackgroundRemover.swift`, `package.json`
  - Pre-commit: `pnpm run typecheck && pnpm test`

---

## Success Criteria

### Verification Commands
```bash
grep "import NitroModules" ios/HybridImageBackgroundRemover.swift  # Expected: single match
pnpm run typecheck                                                   # Expected: exit 0
pnpm test                                                            # Expected: all tests pass
grep '"version": "0.0.33"' package.json                              # Expected: match
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass
- [x] Ready for user to publish when desired
