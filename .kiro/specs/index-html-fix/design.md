# index-html-fix Bugfix Design

## Overview

`frontend/index.html` is a single-file SPA for StudySync. Six distinct bugs degrade its visual, interactive, and accessibility quality. This document formalizes each bug condition, defines the expected correct behavior, hypothesizes root causes, and outlines the minimal targeted changes required to reach 0 browser errors and 0 warnings without altering any working behavior.

The fix strategy is surgical: each change is scoped to the exact defective token or block, and no surrounding code is restructured.

---

## Glossary

- **Bug_Condition (C)**: A predicate that returns `true` for inputs or states that trigger a defect.
- **Property (P)**: The desired observable outcome when the bug condition holds after the fix is applied.
- **Preservation**: All behaviors that must remain byte-for-byte identical after the fix.
- **isBugCondition(input)**: Pseudocode function that identifies whether a given input/state triggers a specific bug.
- **expectedBehavior(result)**: Pseudocode function that asserts the correct post-fix outcome.
- **`var(--text2'`**: The malformed CSS value string found in `onblur`/`onkeydown` inline handlers — missing the closing `)`.
- **`--angle`**: A CSS custom property animated by `@keyframes borderRotate` but never registered via `@property`, making interpolation impossible.
- **`neo-border::after`**: The pseudo-element that carries the shimmer animation on bordered elements.
- **`gql()`**: The async function in the `<script>` block that wraps all GraphQL fetch calls.
- **polling interval**: The `setInterval` block (15 000 ms) intended to refresh notifications in real time.

---

## Bug Details

### Bug 1 — Malformed CSS Variable Strings in Inline Handlers

The `onblur` and the Escape branch of `onkeydown` on three `<span role="button">` elements in the landing nav set `this.style.color` to the string `'var(--text2'` — missing the closing `)`. The browser receives an invalid CSS value and silently ignores it, so the color never resets.

**Formal Specification:**
```
FUNCTION isBugCondition_1(handlerSource)
  INPUT: handlerSource — the string content of an onblur or onkeydown attribute
  OUTPUT: boolean

  RETURN handlerSource CONTAINS "var(--text2'"
         AND NOT handlerSource CONTAINS "var(--text2')"
END FUNCTION
```

**Examples:**
- `onblur="this.style.color='var(--text2'"` → bug present; color does not reset on blur.
- `onkeydown="…else if(event.key==='Escape'){this.style.color='var(--text2'}"` → bug present; color does not reset on Escape.
- `onmouseleave="this.style.color='var(--text2)'"` → no bug; closing `)` is present and works correctly.

---

### Bug 2 — Undefined `--angle` CSS Custom Property in `borderRotate`

The `@keyframes borderRotate` rule animates `--angle` from its current value to `360deg`. Because `--angle` is not registered with `@property`, the browser treats it as an untyped custom property and cannot interpolate between values — the animation has no visual effect.

**Formal Specification:**
```
FUNCTION isBugCondition_2(stylesheet)
  INPUT: stylesheet — the full <style> block content
  OUTPUT: boolean

  RETURN stylesheet CONTAINS "@keyframes borderRotate"
         AND stylesheet CONTAINS "--angle:360deg"
         AND NOT stylesheet CONTAINS "@property --angle"
END FUNCTION
```

**Examples:**
- `@keyframes borderRotate { to { --angle: 360deg } }` with no `@property` declaration → animation is a no-op.
- Same keyframe with `@property --angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }` declared → animation interpolates correctly.

---

### Bug 3 — `<label>` Elements Without Proper `for`/`id` Association and Stacked Layout

Form fields throughout the file use `<label class="input-label">Label Text<input …/></label>`. The `.input-label` class sets `display: block`, but the input is inline content inside the label, causing layout inconsistency across browsers. More critically, there is no `for`/`id` pairing, so assistive technologies cannot programmatically associate the label with its control.

**Formal Specification:**
```
FUNCTION isBugCondition_3(labelElement)
  INPUT: labelElement — a <label> DOM node
  OUTPUT: boolean

  RETURN labelElement.classList CONTAINS "input-label"
         AND labelElement.querySelector("input, select, textarea") IS NOT NULL
         AND labelElement.htmlFor IS EMPTY
         AND labelElement.querySelector("input, select, textarea").id IS EMPTY
END FUNCTION
```

**Examples:**
- `<label class="input-label">First Name<input class="input" type="text"/></label>` → bug present; no `for`/`id`, input inline with text.
- `<label class="input-label" for="first-name">First Name</label><input class="input" id="first-name" type="text"/>` → fixed; programmatic association established, layout controlled by CSS.

---

### Bug 4 — `neo-border::after` Shimmer Animation Misalignment

The `shimmer` keyframe animates `background-position` from `200% 0` to `-200% 0`. The gradient on `neo-border::after` uses `background-size: 300% 300%`. Because the position values (`±200%`) fall outside the visible band of a `300%`-wide gradient, the highlight travels off-screen and the element appears as a near-static glow rather than a moving shimmer.

**Formal Specification:**
```
FUNCTION isBugCondition_4(stylesheet)
  INPUT: stylesheet — the full <style> block content
  OUTPUT: boolean

  shimmerKeyframe := EXTRACT @keyframes shimmer FROM stylesheet
  neoBorderAfter  := EXTRACT .neo-border::after rules FROM stylesheet

  RETURN shimmerKeyframe CONTAINS "background-position:200% 0"
         AND shimmerKeyframe CONTAINS "background-position:-200% 0"
         AND neoBorderAfter CONTAINS "background-size:300% 300%"
END FUNCTION
```

**Examples:**
- `0% { background-position: 200% 0 }` / `100% { background-position: -200% 0 }` with `background-size: 300% 300%` → highlight exits the visible gradient band; shimmer invisible.
- `0% { background-position: 0% 50% }` / `100% { background-position: 100% 50% }` with `background-size: 300% 300%` → highlight travels within the visible band; smooth shimmer visible.

---

### Bug 5 — Empty GraphQL Polling Interval Body

The `setInterval` callback (15 000 ms) checks whether the notifications page is active and the user is logged in, but the `if` body contains only a comment. No `gql()` call is made, so the notification list and unread badge never update in real time.

**Formal Specification:**
```
FUNCTION isBugCondition_5(intervalCallback)
  INPUT: intervalCallback — the function body of the setInterval call
  OUTPUT: boolean

  ifBody := EXTRACT body of "if(token && pg-notifications.active)" FROM intervalCallback

  RETURN ifBody CONTAINS ONLY whitespace AND comments
         AND NOT ifBody CONTAINS "gql("
END FUNCTION
```

**Examples:**
- `if(token && …active) { // Fetch notifications logic via gql }` → bug present; no fetch occurs.
- `if(token && …active) { const data = await gql(NOTIFICATIONS_QUERY); … }` → fixed; notifications fetched and DOM updated.

---

### Bug 6 — Browser-Specific Fetch Error Detection in `gql()`

The `catch` block in `gql()` checks `err.message !== 'Failed to fetch'` to decide whether to show the "Could not connect to Gateway!" toast. This string is Chromium-specific. Firefox throws `'NetworkError when attempting to fetch resource.'`, so the condition evaluates to `true` (not equal), the error is re-thrown via `console.error`, and the user sees no toast in Firefox.

**Formal Specification:**
```
FUNCTION isBugCondition_6(catchBlock)
  INPUT: catchBlock — the catch(err) block of the gql() function
  OUTPUT: boolean

  RETURN catchBlock CONTAINS "err.message !== 'Failed to fetch'"
         AND NOT catchBlock CONTAINS "err.name"
         AND NOT catchBlock CONTAINS "TypeError"
END FUNCTION
```

**Examples:**
- Chromium: `err.message === 'Failed to fetch'` → condition `!== 'Failed to fetch'` is `false` → toast shown. ✓
- Firefox: `err.message === 'NetworkError when attempting to fetch resource.'` → condition `!== 'Failed to fetch'` is `true` → toast NOT shown. ✗
- Fixed (any browser): `err.name === 'TypeError'` → both Chromium and Firefox network errors have `name === 'TypeError'` → toast shown. ✓

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `onmouseenter` and `onfocus` handlers that set `this.style.color='var(--text)'` must continue to work exactly as before (requirements 3.1, 3.2).
- The `onkeydown` Enter/Space branch that sets `this.style.color='var(--text)'` must continue to work (requirement 3.3).
- Page navigation via `go(id)` must continue to show/hide pages, scroll to top, and toggle the GraphQL badge (requirement 3.4).
- Three.js particle background must continue to render (requirement 3.5).
- Chip toggles, preference cards, session type selectors, and availability grid cells must continue to toggle state (requirement 3.6).
- Chat send/reply simulation must continue to work (requirement 3.7).
- Login and register form flows must continue to show toasts and navigate (requirement 3.8).
- Session creation flow must continue to show success toast and navigate (requirement 3.9).
- Custom cursor tracking must continue to work (requirement 3.10).
- Three.js resize handler must continue to work (requirement 3.11).
- Successful `gql()` responses must continue to return parsed JSON data (requirement 3.12).

**Scope:**
All inputs and states that do NOT match one of the six bug conditions above must be completely unaffected by this fix. The changes are limited to:
- Closing a missing `)` in six attribute strings.
- Adding a `@property` declaration block.
- Restructuring label/input markup (adding `for`/`id` attributes and a wrapping `<span>`).
- Adjusting two `background-position` percentage values in one `@keyframes` rule.
- Adding a `gql()` call inside an empty `if` body.
- Replacing one string comparison with a `TypeError` name check.

---

## Hypothesized Root Cause

### Bug 1 — Malformed CSS Variable Strings
The most likely cause is a copy-paste or find-replace error during authoring. The `onmouseleave` handler was written correctly (`'var(--text2)'`), but when the `onblur` and `onkeydown` Escape handlers were added, the closing `)` was accidentally omitted before the closing `'`. Because inline attribute values are not syntax-checked by HTML parsers or most editors, the error went undetected.

### Bug 2 — Undefined `--angle` Property
The `borderRotate` animation was written with the intent to use the Houdini `@property` API for animating a CSS custom property. The `@property` registration block was simply never added. Without it, the browser cannot determine the value type and treats the property as a string, making interpolation impossible.

### Bug 3 — Label/Input Association
The pattern `<label class="input-label">Text<input/></label>` is a common shorthand that implicitly associates the label with its wrapped control. However, it does not provide a `for`/`id` link (required by WCAG 1.3.1 for programmatic association), and the inline rendering of the input after the label text is browser-dependent. The author likely used the wrapping pattern for brevity without considering accessibility requirements.

### Bug 4 — Shimmer Animation Misalignment
The `shimmer` keyframe was likely written to match a `background-size: 200% 200%` gradient (where `±200%` positions would sweep the full gradient). When the gradient was later changed to `background-size: 300% 300%` for a wider highlight band, the keyframe positions were not updated to match, leaving the animation range misaligned with the visible gradient area.

### Bug 5 — Empty Polling Interval
The `setInterval` block was scaffolded as a placeholder with a comment indicating where the `gql()` call should go. The actual implementation was never filled in, leaving the real-time notification refresh permanently non-functional.

### Bug 6 — Browser-Specific Error String
The error message `'Failed to fetch'` is the exact string thrown by Chromium-based browsers for network failures. The developer tested only in Chrome/Edge and hard-coded that string. Firefox uses a different message, so the cross-browser detection was never implemented.

---

## Correctness Properties

Property 1: Bug Condition — Inline Handler CSS Value Validity

_For any_ `onblur` or `onkeydown` Escape-branch attribute string where the bug condition holds (the string contains `var(--text2'` without a closing `)`), the fixed HTML SHALL contain the valid CSS value `'var(--text2)'` (with closing `)`) so that the element's color resets correctly when focus is lost or Escape is pressed.

**Validates: Requirements 2.1, 2.2**

---

Property 2: Bug Condition — `--angle` CSS Property Registration

_For any_ stylesheet where `@keyframes borderRotate` animates `--angle` and no `@property --angle` declaration exists, the fixed stylesheet SHALL include an `@property --angle` block with `syntax: '<angle>'`, `inherits: false`, and `initial-value: 0deg` so that the browser can interpolate the value and the rotating border animation produces a visible effect.

**Validates: Requirements 2.3**

---

Property 3: Bug Condition — Label/Input Programmatic Association

_For any_ `<label class="input-label">` element that wraps an `<input>`, `<select>`, or `<textarea>` without a `for`/`id` pair, the fixed HTML SHALL separate the label text into a `<span class="input-label">` and give the control a unique `id` matching a `for` attribute on the label (or equivalent), so that assistive technologies can programmatically link the label to its control and the label text and input are visually stacked.

**Validates: Requirements 2.4**

---

Property 4: Bug Condition — Shimmer Animation Visibility

_For any_ `.neo-border::after` element where the `shimmer` keyframe uses `background-position` values outside the visible range of the `background-size: 300% 300%` gradient, the fixed stylesheet SHALL use `background-position` keyframe values that keep the highlight band within the visible gradient area (e.g., `0% 50%` → `100% 50%`) so that the shimmer travels smoothly across the element.

**Validates: Requirements 2.5**

---

Property 5: Bug Condition — Notification Polling Execution

_For any_ `setInterval` callback invocation where the user is authenticated and the notifications page is active, the fixed code SHALL call `gql()` with a notifications query, receive the response, and update the notification list and unread badge count in the DOM.

**Validates: Requirements 2.6**

---

Property 6: Bug Condition — Cross-Browser Network Error Detection

_For any_ network error caught in `gql()` regardless of browser, the fixed catch block SHALL detect the failure using `err.name === 'TypeError'` (which is consistent across Chromium and Firefox) and SHALL show the "Could not connect to Gateway!" toast so the user receives feedback in all browsers.

**Validates: Requirements 2.7**

---

Property 7: Preservation — All Non-Buggy Behaviors Unchanged

_For any_ input or state where none of the six bug conditions hold (isBugCondition returns false for all six), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality including navigation, Three.js rendering, form flows, chat, cursor tracking, and successful GraphQL responses.

**Validates: Requirements 3.1–3.12**

---

## Fix Implementation

### Changes Required

**File:** `frontend/index.html`

#### Fix 1 — Close the CSS variable strings (Bug 1)

**Location:** Three `<span role="button">` elements in the landing nav (`#pg-landing`), `onblur` and `onkeydown` attributes.

**Specific Changes:**
1. In each of the three `<span>` elements, change every occurrence of `'var(--text2'` to `'var(--text2)'` in the `onblur` attribute.
2. In each of the three `<span>` elements, change every occurrence of `'var(--text2'` to `'var(--text2)'` in the `onkeydown` Escape branch.
3. Total: 6 single-character insertions (one `)` each).

**Before:**
```html
onblur="this.style.color='var(--text2'"
onkeydown="…else if(event.key==='Escape'){this.style.color='var(--text2'}"
```

**After:**
```html
onblur="this.style.color='var(--text2)'"
onkeydown="…else if(event.key==='Escape'){this.style.color='var(--text2)'}"
```

---

#### Fix 2 — Register `--angle` with `@property` (Bug 2)

**Location:** `<style>` block, immediately before or after the `:root` block (before any rule that uses `--angle`).

**Specific Changes:**
1. Add the following `@property` declaration at the top of the `<style>` block:

```css
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
```

2. No changes to the existing `@keyframes borderRotate` rule are needed.

---

#### Fix 3 — Add `for`/`id` association to label/input pairs (Bug 3)

**Location:** All `<label class="input-label">Text<input/></label>` patterns throughout the file (register, login, profile-setup, study-prefs, create-session pages).

**Specific Changes:**
1. For each wrapping label, extract the label text into a `<span class="input-label">` and convert the `<label>` to a plain wrapper `<div>`, adding a `for` attribute pointing to a new unique `id` on the control. Alternatively (simpler and semantically equivalent): keep the `<label>` element, move the text content into a `<span>` child, and add matching `for`/`id` attributes.

**Preferred pattern (minimal change):**
```html
<!-- Before -->
<label class="input-label">First Name<input class="input" type="text" placeholder="Ahmed"/></label>

<!-- After -->
<label class="input-label" for="reg-first-name">
  <span>First Name</span>
  <input class="input" id="reg-first-name" type="text" placeholder="Ahmed"/>
</label>
```

The `<span>` wrapper ensures the label text and input are on separate lines regardless of browser rendering. The `for`/`id` pair satisfies WCAG 1.3.1. The `.input-label` class's `display: block` and `margin-bottom: 8px` styles already provide the correct stacked layout when applied to the `<span>`.

**Id naming convention:** `{page-prefix}-{field-name}` (e.g., `reg-first-name`, `login-email`, `setup-bio`, `session-title`).

---

#### Fix 4 — Correct shimmer keyframe positions (Bug 4)

**Location:** `@keyframes shimmer` in the `<style>` block.

**Specific Changes:**
1. Change the `0%` keyframe `background-position` from `200% 0` to `0% 50%`.
2. Change the `100%` keyframe `background-position` from `-200% 0` to `100% 50%`.

**Before:**
```css
@keyframes shimmer {
  0%  { background-position: 200% 0 }
  100%{ background-position: -200% 0 }
}
```

**After:**
```css
@keyframes shimmer {
  0%  { background-position: 0% 50% }
  100%{ background-position: 100% 50% }
}
```

The `50%` vertical position centers the highlight within the `300% 300%` gradient. The `0%` → `100%` horizontal sweep keeps the highlight band fully within the visible area throughout the animation.

---

#### Fix 5 — Implement the notification polling body (Bug 5)

**Location:** `setInterval` callback near the bottom of the `<script>` block.

**Specific Changes:**
1. Replace the comment-only `if` body with a `gql()` call that queries notifications and updates the DOM.

**Before:**
```js
setInterval(async () => {
  const token = localStorage.getItem('studySyncToken');
  if(token && document.getElementById('pg-notifications').classList.contains('active')) {
     // Fetch notifications logic via gql
  }
}, 15000);
```

**After:**
```js
setInterval(async () => {
  const token = localStorage.getItem('studySyncToken');
  if(token && document.getElementById('pg-notifications').classList.contains('active')) {
    const data = await gql(`{ notifications { id type message read createdAt } }`);
    if(data && data.data && data.data.notifications) {
      renderNotifications(data.data.notifications);
    }
  }
}, 15000);
```

`renderNotifications` is the existing function that populates the notifications list and updates the unread badge. If no such function exists yet, a minimal inline update (clearing and re-populating the `#notif-list` container and updating the `.dot` badge visibility) is acceptable.

---

#### Fix 6 — Cross-browser network error detection in `gql()` (Bug 6)

**Location:** `catch (err)` block inside `async function gql()`.

**Specific Changes:**
1. Replace the message-string comparison with a `TypeError` name check.

**Before:**
```js
} catch (err) {
  if (err.message !== 'Failed to fetch') console.error(err);
  else toast('Could not connect to Gateway!', 'error');
  return { data: null, error: err.message };
}
```

**After:**
```js
} catch (err) {
  if (err.name === 'TypeError') {
    toast('Could not connect to Gateway!', 'error');
  } else {
    console.error(err);
  }
  return { data: null, error: err.message };
}
```

`TypeError` is the standard error type thrown by `fetch()` for network failures (connection refused, DNS failure, CORS preflight failure) in all major browsers. Non-network errors (e.g., JSON parse errors, GraphQL validation errors) have different `name` values (`SyntaxError`, `Error`) and will continue to be logged via `console.error`.

---

## Testing Strategy

### Validation Approach

Testing follows a two-phase approach: first, write tests that demonstrate each bug on the unfixed code (exploratory / fix-checking), then verify that the fix resolves the bug and that all preserved behaviors remain intact (preservation checking).

---

### Exploratory Bug Condition Checking

**Goal:** Surface counterexamples that demonstrate each bug on the UNFIXED code. Confirm or refute the root cause analysis.

**Test Plan:** Load the unfixed `index.html` in a browser or JSDOM environment and assert the defective behavior for each bug condition.

**Test Cases:**

1. **Bug 1 — Blur color reset**: Simulate `blur` on a landing nav `<span>`. Assert `this.style.color` equals `'var(--text2)'`. On unfixed code, `this.style.color` will be `''` (browser ignores invalid value) — test fails.

2. **Bug 1 — Escape color reset**: Simulate `keydown` with `key === 'Escape'` on a landing nav `<span>`. Assert `this.style.color` equals `'var(--text2)'`. On unfixed code, same failure.

3. **Bug 2 — borderRotate animation**: Check that `getComputedStyle` on a `.neo-border` element shows an animated `--angle` value changing over time. On unfixed code, `--angle` is always `''` (unregistered).

4. **Bug 3 — Label association**: Query all `label.input-label` elements. Assert each has a non-empty `htmlFor` and a matching `id` on its associated control. On unfixed code, `htmlFor` is `''` for all wrapping labels.

5. **Bug 4 — Shimmer visibility**: Inspect the computed `background-position` of `.neo-border::after` at animation midpoint. Assert the value is within `[0%, 100%]` horizontally. On unfixed code, the position is `200% 0` or `-200% 0` — outside the visible band.

6. **Bug 5 — Polling body**: Spy on `gql`. Advance the timer by 15 000 ms with the notifications page active and a token present. Assert `gql` was called. On unfixed code, `gql` is never called.

7. **Bug 6 — Firefox network error**: In a Firefox environment (or by mocking `fetch` to throw `new TypeError('NetworkError when attempting to fetch resource.')`), call `gql('{ test }')`. Assert the "Could not connect to Gateway!" toast was shown. On unfixed code, the toast is not shown.

**Expected Counterexamples:**
- Bugs 1, 3, 5, 6: Assertion failures with clear observable differences.
- Bug 2: `--angle` computed value is empty string instead of an angle.
- Bug 4: `background-position` is outside `[0%, 100%]`.

---

### Fix Checking

**Goal:** Verify that for all inputs where each bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL handler WHERE isBugCondition_1(handler) DO
  result := evaluate_fixed_handler(handler, event='blur')
  ASSERT result.style.color === 'var(--text2)'
END FOR

FOR ALL stylesheet WHERE isBugCondition_2(stylesheet) DO
  ASSERT stylesheet CONTAINS "@property --angle"
  ASSERT computed --angle interpolates between 0deg and 360deg
END FOR

FOR ALL labelElement WHERE isBugCondition_3(labelElement) DO
  ASSERT labelElement.htmlFor IS NOT EMPTY
  ASSERT document.getElementById(labelElement.htmlFor) IS NOT NULL
END FOR

FOR ALL stylesheet WHERE isBugCondition_4(stylesheet) DO
  shimmer := EXTRACT @keyframes shimmer
  ASSERT shimmer[0%].backgroundPosition IS WITHIN [0%, 100%] horizontal
  ASSERT shimmer[100%].backgroundPosition IS WITHIN [0%, 100%] horizontal
END FOR

FOR ALL timerFire WHERE isBugCondition_5(intervalBody) DO
  ASSERT gql WAS CALLED
  ASSERT DOM notifications list WAS UPDATED
END FOR

FOR ALL networkError WHERE isBugCondition_6(catchBlock) DO
  ASSERT toast('Could not connect to Gateway!', 'error') WAS CALLED
END FOR
```

---

### Preservation Checking

**Goal:** Verify that for all inputs where none of the bug conditions hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition_1(input)
                AND NOT isBugCondition_2(input)
                AND NOT isBugCondition_3(input)
                AND NOT isBugCondition_4(input)
                AND NOT isBugCondition_5(input)
                AND NOT isBugCondition_6(input) DO
  ASSERT original_behavior(input) === fixed_behavior(input)
END FOR
```

**Testing Approach:** Property-based testing is recommended for preservation checking because:
- It generates many random inputs across the full input domain automatically.
- It catches edge cases that manual unit tests might miss.
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs.

**Test Cases:**
1. **Mouse hover preservation**: Verify `onmouseenter` still sets `this.style.color='var(--text)'` on all three `<span>` elements after the fix.
2. **Focus preservation**: Verify `onfocus` still sets `this.style.color='var(--text)'` after the fix.
3. **Enter/Space keydown preservation**: Verify the Enter and Space branches of `onkeydown` still set `this.style.color='var(--text)'` after the fix.
4. **Navigation preservation**: Verify `go('dashboard')`, `go('matching')`, etc. still show/hide pages correctly after the fix.
5. **Successful gql preservation**: Mock `fetch` to return a valid GraphQL response. Verify `gql()` still returns parsed JSON data after the fix.
6. **Non-network error preservation**: Mock `fetch` to throw a `SyntaxError`. Verify `console.error` is called and no toast is shown after the fix.
7. **Chip toggle preservation**: Verify `.chip.on` toggling still works after the label restructuring.
8. **Form submission preservation**: Verify `handleLogin()` and `handleRegister()` still navigate and show toasts after the fix.

---

### Unit Tests

- Test each of the six `onblur` attribute strings: assert they contain `'var(--text2)'` with closing `)`.
- Test each of the six `onkeydown` Escape-branch strings: assert they contain `'var(--text2)'` with closing `)`.
- Test that `@property --angle` is present in the stylesheet with correct `syntax`, `inherits`, and `initial-value`.
- Test that every `label.input-label` element has a non-empty `for` attribute and a matching `id` on its control.
- Test that `@keyframes shimmer` `0%` position is `0% 50%` and `100%` position is `100% 50%`.
- Test that the `setInterval` callback calls `gql()` when token is present and notifications page is active.
- Test `gql()` catch block with a `TypeError` mock: assert toast is shown.
- Test `gql()` catch block with a non-`TypeError` mock: assert `console.error` is called and no toast is shown.

---

### Property-Based Tests

- Generate random `blur` and `keydown` events on the three `<span>` elements; assert `style.color` is always a valid CSS value after each event.
- Generate random page navigation sequences; assert the correct page is always active and no other page is visible.
- Generate random `fetch` rejection reasons (various `Error` subtypes); assert that only `TypeError` triggers the toast and all others trigger `console.error`.
- Generate random notification payloads from the polling `gql()` call; assert the DOM always reflects the latest payload without corrupting existing page state.

---

### Integration Tests

- Full login → dashboard → notifications flow: verify the polling interval fires after 15 s and updates the notification list.
- Full register → profile-setup → study-prefs flow: verify all form fields have accessible labels and submit correctly.
- Landing page load: verify the `neo-border` shimmer animation is visually active (non-static) on `.neo-border` elements.
- Cross-browser network failure: simulate a gateway outage in both Chromium and Firefox; verify the "Could not connect to Gateway!" toast appears in both.
