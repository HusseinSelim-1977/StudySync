# Implementation Plan

- [ ] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Six HTML/CSS/JS Defects in index.html
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms each bug exists
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug on the UNFIXED code
  - **Scoped PBT Approach**: For deterministic bugs, scope each property to the concrete failing case(s) to ensure reproducibility
  - Bug 1 — Inline handler CSS value: parse `onblur` and `onkeydown` attribute strings on all three landing `<span role="button">` elements; assert each contains `'var(--text2)'` (with closing `)`). On unfixed code the strings contain `'var(--text2'` — test FAILS.
  - Bug 2 — `@property --angle`: parse the `<style>` block; assert it contains `@property --angle` with `syntax: '<angle>'`, `inherits: false`, and `initial-value: 0deg`. On unfixed code the declaration is absent — test FAILS.
  - Bug 3 — Label/input association: query all `label.input-label` elements; assert each has a non-empty `for` attribute and a matching `id` on its associated control. On unfixed code `htmlFor` is `''` for all wrapping labels — test FAILS.
  - Bug 4 — Shimmer keyframe positions: parse `@keyframes shimmer`; assert the `0%` frame uses `background-position: 0% 50%` and the `100%` frame uses `background-position: 100% 50%`. On unfixed code the values are `200% 0` / `-200% 0` — test FAILS.
  - Bug 5 — Polling interval body: spy on `gql`; advance the timer 15 000 ms with the notifications page active and a token present; assert `gql` was called at least once. On unfixed code the `if` body is empty — test FAILS.
  - Bug 6 — Cross-browser network error: mock `fetch` to throw `new TypeError('NetworkError when attempting to fetch resource.')` (Firefox message); call `gql('{ test }')`; assert the "Could not connect to Gateway!" toast was shown. On unfixed code the condition `err.message !== 'Failed to fetch'` is `true` so the toast is NOT shown — test FAILS.
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: All six tests FAIL (this is correct — it proves each bug exists)
  - Document counterexamples found to understand root cause for each bug
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - All Non-Buggy Behaviors in index.html
  - **IMPORTANT**: Follow observation-first methodology — observe behavior on UNFIXED code for non-buggy inputs first
  - Observe: `onmouseenter` sets `this.style.color='var(--text)'` on all three landing `<span>` elements — record this value
  - Observe: `onfocus` sets `this.style.color='var(--text)'` on all three landing `<span>` elements — record this value
  - Observe: `onkeydown` Enter/Space branch sets `this.style.color='var(--text)'` — record this value
  - Observe: `go('dashboard')` shows `#pg-dashboard`, hides all other pages, scrolls to top, and toggles the GraphQL badge — record DOM state
  - Observe: `gql()` with a mocked successful `fetch` returns parsed JSON data — record return value shape
  - Observe: `gql()` catch block with a `SyntaxError` calls `console.error` and does NOT show a toast — record this behavior
  - Write property-based tests capturing all observed behaviors:
    - For all three `<span>` elements: `onmouseenter` always sets color to `'var(--text)'`
    - For all three `<span>` elements: `onfocus` always sets color to `'var(--text)'`
    - For all three `<span>` elements: `onkeydown` Enter/Space always sets color to `'var(--text)'`
    - For any valid page id passed to `go()`: correct page becomes active, all others hidden
    - For any successful GraphQL response: `gql()` returns parsed JSON data unchanged
    - For any non-`TypeError` error thrown by `fetch`: `console.error` is called, no toast shown
  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: All preservation tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.12_

- [ ] 3. Fix all six bugs in frontend/index.html

  - [ ] 3.1 Fix Bug 1 — Close malformed CSS variable strings in inline handlers
    - In each of the three `<span role="button">` elements in `#pg-landing`, change every `'var(--text2'` to `'var(--text2)'` in the `onblur` attribute (3 occurrences)
    - In each of the three `<span role="button">` elements, change every `'var(--text2'` to `'var(--text2)'` in the `onkeydown` Escape branch (3 occurrences)
    - Total: 6 single-character `)` insertions
    - _Bug_Condition: isBugCondition_1(handlerSource) — handlerSource CONTAINS "var(--text2'" AND NOT CONTAINS "var(--text2')"_
    - _Expected_Behavior: onblur and onkeydown Escape branch set this.style.color to the valid value 'var(--text2)' so the element color resets correctly_
    - _Preservation: onmouseenter, onfocus, and onkeydown Enter/Space handlers that set 'var(--text)' must remain unchanged (requirements 3.1, 3.2, 3.3)_
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Fix Bug 2 — Register `--angle` with `@property`
    - Add the following block at the top of the `<style>` block (before or immediately after the `:root` block, before any rule that uses `--angle`):
      ```css
      @property --angle {
        syntax: '<angle>';
        inherits: false;
        initial-value: 0deg;
      }
      ```
    - Do NOT modify the existing `@keyframes borderRotate` rule
    - _Bug_Condition: isBugCondition_2(stylesheet) — stylesheet CONTAINS "@keyframes borderRotate" AND "--angle:360deg" AND NOT CONTAINS "@property --angle"_
    - _Expected_Behavior: browser can interpolate --angle between 0deg and 360deg; borderRotate animation produces a visible rotating border effect_
    - _Preservation: all other CSS rules and animations must remain unchanged (requirements 3.5, 3.10, 3.11)_
    - _Requirements: 2.3_

  - [ ] 3.3 Fix Bug 3 — Add `for`/`id` association to all label/input pairs
    - For every `<label class="input-label">Text<input …/></label>` pattern across all pages (register, login, profile-setup, study-prefs, create-session), apply the preferred minimal-change pattern:
      ```html
      <!-- Before -->
      <label class="input-label">First Name<input class="input" type="text" placeholder="Ahmed"/></label>

      <!-- After -->
      <label class="input-label" for="reg-first-name">
        <span>First Name</span>
        <input class="input" id="reg-first-name" type="text" placeholder="Ahmed"/>
      </label>
      ```
    - Use the `{page-prefix}-{field-name}` id naming convention (e.g., `reg-first-name`, `login-email`, `setup-bio`, `session-title`)
    - The `<span>` wrapper ensures label text and input are visually stacked; the `for`/`id` pair satisfies WCAG 1.3.1
    - _Bug_Condition: isBugCondition_3(labelElement) — labelElement.classList CONTAINS "input-label" AND wraps an input/select/textarea AND htmlFor IS EMPTY AND control.id IS EMPTY_
    - _Expected_Behavior: every label.input-label has a non-empty for attribute; every associated control has a matching id; label text and input are visually stacked_
    - _Preservation: chip toggles, preference cards, session type selectors, availability grid cells, and all form submission flows must continue to work unchanged (requirements 3.6, 3.8, 3.9)_
    - _Requirements: 2.4_

  - [ ] 3.4 Fix Bug 4 — Correct shimmer keyframe background-position values
    - In `@keyframes shimmer`, change the `0%` frame from `background-position: 200% 0` to `background-position: 0% 50%`
    - Change the `100%` frame from `background-position: -200% 0` to `background-position: 100% 50%`
    - Do NOT modify `background-size: 300% 300%` on `.neo-border::after` or any other shimmer-related rule
    - _Bug_Condition: isBugCondition_4(stylesheet) — shimmer keyframe CONTAINS "background-position:200% 0" AND "background-position:-200% 0" AND neo-border::after CONTAINS "background-size:300% 300%"_
    - _Expected_Behavior: shimmer highlight travels within the visible gradient band (0%–100% horizontal, 50% vertical); smooth moving shimmer is visible on .neo-border elements_
    - _Preservation: all other animation keyframes (float, pulseRing, slideUp, slideIn, scanline, spin, borderRotate, notifPulse, pageReveal) must remain unchanged_
    - _Requirements: 2.5_

  - [ ] 3.5 Fix Bug 5 — Implement the notification polling interval body
    - Replace the comment-only `if` body in the `setInterval` callback with a `gql()` call:
      ```js
      if(token && document.getElementById('pg-notifications').classList.contains('active')) {
        const data = await gql(`{ notifications { id type message read createdAt } }`);
        if(data && data.data && data.data.notifications) {
          renderNotifications(data.data.notifications);
        }
      }
      ```
    - Use the existing `renderNotifications` function to update the DOM; if it does not exist, add a minimal inline update that clears and re-populates `#notif-list` and updates the `.dot` badge visibility
    - Do NOT change the `setInterval` delay (15 000 ms), the token check, or the page-active check
    - _Bug_Condition: isBugCondition_5(intervalCallback) — if body CONTAINS ONLY whitespace/comments AND NOT CONTAINS "gql("_
    - _Expected_Behavior: when token is present and notifications page is active, gql() is called with a notifications query; DOM notification list and unread badge are updated with the response_
    - _Preservation: all other setInterval/setTimeout behavior, navigation, Three.js rendering, and chat flows must remain unchanged (requirements 3.4, 3.5, 3.7)_
    - _Requirements: 2.6_

  - [ ] 3.6 Fix Bug 6 — Replace browser-specific fetch error detection in `gql()`
    - In the `catch (err)` block of `async function gql()`, replace the message-string comparison with a `TypeError` name check:
      ```js
      // Before
      } catch (err) {
        if (err.message !== 'Failed to fetch') console.error(err);
        else toast('Could not connect to Gateway!', 'error');
        return { data: null, error: err.message };
      }

      // After
      } catch (err) {
        if (err.name === 'TypeError') {
          toast('Could not connect to Gateway!', 'error');
        } else {
          console.error(err);
        }
        return { data: null, error: err.message };
      }
      ```
    - `TypeError` is the standard error type for network failures (`fetch` connection refused, DNS failure, CORS preflight) in all major browsers
    - Non-network errors (`SyntaxError`, `Error`) continue to be logged via `console.error` and do NOT show the toast
    - _Bug_Condition: isBugCondition_6(catchBlock) — catchBlock CONTAINS "err.message !== 'Failed to fetch'" AND NOT CONTAINS "err.name" AND NOT CONTAINS "TypeError"_
    - _Expected_Behavior: any TypeError caught in gql() (regardless of browser) shows the "Could not connect to Gateway!" toast; non-TypeError errors are logged via console.error without a toast_
    - _Preservation: successful gql() responses must continue to return parsed JSON data unchanged (requirement 3.12)_
    - _Requirements: 2.7_

  - [ ] 3.7 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - Six HTML/CSS/JS Defects Resolved
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior for all six bugs
    - When all six tests pass, it confirms the expected behavior is satisfied for each fix
    - Run all six bug condition exploration tests from step 1
    - **EXPECTED OUTCOME**: All six tests PASS (confirms all bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - All Non-Buggy Behaviors Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions)
    - Confirm all tests still pass after all six fixes (no regressions introduced)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.12_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite (exploration tests + preservation tests)
  - Confirm 0 test failures
  - Open `frontend/index.html` in a browser and verify 0 console errors and 0 console warnings
  - Verify the `neo-border` shimmer animation is visually active (moving highlight, not static glow)
  - Verify the `borderRotate` animation produces a visible rotating border on `.neo-border` elements
  - Verify all form fields have accessible labels (use browser accessibility inspector or axe DevTools)
  - Ask the user if any questions arise before marking complete
