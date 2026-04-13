# Bugfix Requirements Document

## Introduction

`frontend/index.html` is a single-page application (SPA) for "StudySync — Real-Time Study Buddy Matcher". It uses Three.js for background animations, custom CSS, and vanilla JavaScript for page navigation, chat, availability grid, and more.

The file currently contains a collection of bugs that produce browser console errors and warnings, cause broken inline styles, and degrade the visual, interactive, and accessibility experience. The goal of this fix is to reach **0 errors, 0 warnings** and ensure every feature runs as intended.

The bugs fall into six categories:

1. **Malformed CSS variable strings in inline event handlers** — `onblur` and the `onkeydown` Escape branch contain unclosed `var(--text2'` strings (missing closing `)`) that produce invalid CSS values at runtime.
2. **Undefined CSS custom property used in a `@keyframes` animation** — `borderRotate` animates `--angle` to `360deg`, but `--angle` is never declared with `@property`, so the animation has no effect.
3. **`<label>` elements that wrap form controls without proper structure** — `<label class="input-label">Label Text<input …/></label>` renders the input inline after the label text and lacks `for`/`id` association, causing both layout inconsistency and an accessibility failure.
4. **`neo-border::after` shimmer animation misalignment** — The `shimmer` keyframe moves `background-position` between `200% 0` and `-200% 0`, but the gradient is defined with `background-size: 300% 300%`, causing the animated highlight to travel outside the visible gradient band and appear as a static glow rather than a moving shimmer.
5. **Empty GraphQL polling interval body** — The `setInterval` block that is supposed to fetch live notifications calls nothing (the body is a comment only), so the real-time notification badge never updates.
6. **Browser-specific fetch error detection in `gql()`** — The error handler checks `err.message !== 'Failed to fetch'` to detect network failures, but this string is Chromium-specific; Firefox uses a different message, so the "Could not connect to Gateway!" toast never fires in Firefox.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a nav link or interactive `<span>` loses focus (`onblur`) THEN the system sets `this.style.color` to the malformed string `'var(--text2'` (missing closing `)`) instead of a valid CSS value, leaving the element with a broken inline style that the browser silently ignores, so the color does not reset to the muted text color.

1.2 WHEN a nav link or interactive `<span>` receives a keyboard event and the Escape key is pressed (`onkeydown` Escape branch) THEN the system sets `this.style.color` to the malformed string `'var(--text2'` (missing closing `)`) instead of a valid CSS value, so the color does not reset correctly on Escape.

1.3 WHEN any element with the class `neo-border` is rendered THEN the system applies the `borderRotate` animation which attempts to animate the CSS custom property `--angle` from its current value to `360deg`, but because `--angle` is not registered via `@property` the browser cannot interpolate it, so the animated border rotation has no visual effect.

1.4 WHEN a form field is rendered inside `<label class="input-label">Label Text<input …/></label>` THEN the system renders the label text and the input as inline content within a single `display:block` element, causing the input to appear on the same line as the label text in some browsers rather than on a new line below it, and the label has no `for`/`id` association so assistive technologies cannot programmatically link the label to its control.

1.5 WHEN an element with the class `neo-border` is rendered THEN the system applies the `shimmer` animation to `neo-border::after`, which uses `background-position` values of `200% 0` → `-200% 0` against a gradient with `background-size: 300% 300%`, causing the animated highlight band to travel outside the visible portion of the gradient and appear as a near-static glow rather than a smooth moving shimmer.

1.6 WHEN the user is on the Notifications page and the 15-second polling interval fires THEN the system executes an empty code block (only a comment inside the `if` body) and makes no GraphQL call, so the notification list is never refreshed and the unread badge count never updates in real time.

1.7 WHEN the `gql()` function catches a network error in Firefox THEN the system checks `err.message !== 'Failed to fetch'` but Firefox throws `'NetworkError when attempting to fetch resource.'` instead, so the condition evaluates to `true` and the error is re-thrown without showing the "Could not connect to Gateway!" toast, leaving the user with no feedback about the connection failure.

---

### Expected Behavior (Correct)

2.1 WHEN a nav link or interactive `<span>` loses focus (`onblur`) THEN the system SHALL set `this.style.color` to the valid CSS value `'var(--text2)'` (with closing `)`) so the element's color resets correctly to the muted text color.

2.2 WHEN a nav link or interactive `<span>` receives a keyboard event and the Escape key is pressed (`onkeydown` Escape branch) THEN the system SHALL set `this.style.color` to the valid CSS value `'var(--text2)'` (with closing `)`) so the color resets correctly on Escape, consistent with the `onblur` and `onmouseleave` handlers.

2.3 WHEN any element with the class `neo-border` is rendered THEN the system SHALL declare `--angle` as a registered CSS custom property using `@property` with `syntax: '<angle>'`, `inherits: false`, and `initial-value: 0deg`, so the `borderRotate` animation can interpolate the value and produce a visible rotating border effect.

2.4 WHEN a form field is rendered inside a `<label>` THEN the system SHALL separate the visible label text into a `<span>` child (or use a `<label for="…">` + `<input id="…">` pattern) so the label text and the input are visually stacked — label text on one line, input control on the next — and the label is programmatically associated with its control for assistive technologies.

2.5 WHEN an element with the class `neo-border` is rendered THEN the system SHALL use `background-position` keyframe values that stay within the visible range of the `300% 300%` gradient (e.g., `0% 50%` → `100% 50%`) so the shimmer highlight travels smoothly across the element and is always visible.

2.6 WHEN the user is on the Notifications page and the 15-second polling interval fires THEN the system SHALL call `gql(…)` with an appropriate notifications query, receive the response, and update the notification list and unread badge count in the DOM so the UI reflects real-time data.

2.7 WHEN the `gql()` function catches a network error in any browser THEN the system SHALL detect the connection failure in a browser-agnostic way (e.g., by checking `err.name === 'TypeError'` or using a try/catch around the fetch without relying on the error message string) and SHALL show the "Could not connect to Gateway!" toast so the user receives feedback regardless of browser.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a nav link or interactive `<span>` is hovered (`onmouseenter`) THEN the system SHALL CONTINUE TO set `this.style.color='var(--text)'` to highlight the element, unchanged from the current working behavior.

3.2 WHEN a nav link or interactive `<span>` receives focus (`onfocus`) THEN the system SHALL CONTINUE TO set `this.style.color='var(--text)'` to highlight the element, unchanged from the current working behavior.

3.3 WHEN a nav link or interactive `<span>` receives a keyboard event and the Enter or Space key is pressed (`onkeydown` Enter/Space branch) THEN the system SHALL CONTINUE TO set `this.style.color='var(--text)'` to highlight the element, unchanged from the current working behavior.

3.4 WHEN the user navigates between pages using `go(id)` THEN the system SHALL CONTINUE TO show the correct page, hide all others, scroll to the top, and toggle the GraphQL badge visibility, unchanged from the current working behavior.

3.5 WHEN the Three.js particle universe is initialized THEN the system SHALL CONTINUE TO render the animated star field, nebula orbs, and network node lines in the background canvas, unchanged from the current working behavior.

3.6 WHEN the user interacts with chip toggles, preference cards, session type selectors, or availability grid cells THEN the system SHALL CONTINUE TO toggle the `on` class and update related UI state, unchanged from the current working behavior.

3.7 WHEN the user sends a chat message THEN the system SHALL CONTINUE TO append the sent bubble and simulate a reply after 1.2 seconds, unchanged from the current working behavior.

3.8 WHEN the user submits the login or register form THEN the system SHALL CONTINUE TO show a toast, navigate to the appropriate page, and display a welcome toast, unchanged from the current working behavior.

3.9 WHEN the user creates a session THEN the system SHALL CONTINUE TO show a success toast and navigate to the sessions page after 800 ms, unchanged from the current working behavior.

3.10 WHEN the custom cursor moves THEN the system SHALL CONTINUE TO track the mouse with the dot cursor and lag-follow with the ring cursor, unchanged from the current working behavior.

3.11 WHEN the viewport is resized THEN the system SHALL CONTINUE TO update the Three.js renderer size and camera aspect ratio, unchanged from the current working behavior.

3.12 WHEN the `gql()` function receives a successful GraphQL response THEN the system SHALL CONTINUE TO return the parsed JSON data, unchanged from the current working behavior.
