/**
 * Bug Condition Exploration Tests for frontend/index.html
 *
 * These tests MUST FAIL on the UNFIXED code — failure confirms each bug exists.
 * DO NOT fix the code or the tests when they fail.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');

// Polyfill for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const HTML_PATH = path.resolve(__dirname, '../index.html');
const htmlContent = fs.readFileSync(HTML_PATH, 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// Bug 1 — Inline handler CSS value
// Parse onblur and onkeydown attribute strings on all three landing <span
// role="button"> elements; assert each contains 'var(--text2)' (with closing ).
// On unfixed code the strings contain 'var(--text2' — test FAILS.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 1 — Inline handler CSS value', () => {
  test('all three landing nav spans have valid onblur CSS value (with closing parenthesis)', () => {
    // Find all onblur attributes in the HTML that reference var(--text2)
    const allOnblurAttrs = [...htmlContent.matchAll(/onblur="([^"]*)"/g)].map(m => m[1]);
    const text2OnblurAttrs = allOnblurAttrs.filter(v => v.includes('var(--text2'));

    // There should be exactly 3 (one per landing nav span)
    expect(text2OnblurAttrs.length).toBeGreaterThanOrEqual(3);

    // Each should contain the VALID form: var(--text2)' with closing )
    // On unfixed code: 'var(--text2' is present WITHOUT closing ) before the quote
    text2OnblurAttrs.forEach(attr => {
      // The valid form is: this.style.color='var(--text2)'
      // The buggy form is: this.style.color='var(--text2'
      expect(attr).toContain("var(--text2)'");
    });
  });

  test('all three landing nav spans have valid onkeydown Escape-branch CSS value (with closing parenthesis)', () => {
    // Find all onkeydown attributes that have an Escape branch referencing var(--text2)
    const allOnkeydownAttrs = [...htmlContent.matchAll(/onkeydown="([^"]*)"/g)].map(m => m[1]);
    const text2OnkeydownAttrs = allOnkeydownAttrs.filter(v =>
      v.includes('Escape') && v.includes('var(--text2')
    );

    // There should be exactly 3 (one per landing nav span)
    expect(text2OnkeydownAttrs.length).toBeGreaterThanOrEqual(3);

    // Each should contain the VALID form: var(--text2)' with closing )
    text2OnkeydownAttrs.forEach(attr => {
      expect(attr).toContain("var(--text2)'");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 2 — @property --angle
// Parse the <style> block; assert it contains @property --angle with
// syntax: '<angle>', inherits: false, and initial-value: 0deg.
// On unfixed code the declaration is absent — test FAILS.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 2 — @property --angle CSS registration', () => {
  // Extract the <style> block content
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
  const styleContent = styleMatch ? styleMatch[1] : '';

  test('@property --angle declaration is present in the stylesheet', () => {
    expect(styleContent).toContain('@property --angle');
  });

  test('@property --angle has syntax: \'<angle>\'', () => {
    const propBlockMatch = styleContent.match(/@property\s+--angle\s*\{([^}]*)\}/);
    expect(propBlockMatch).not.toBeNull();
    const propBlock = propBlockMatch ? propBlockMatch[1] : '';
    expect(propBlock).toContain("syntax: '<angle>'");
  });

  test('@property --angle has inherits: false', () => {
    const propBlockMatch = styleContent.match(/@property\s+--angle\s*\{([^}]*)\}/);
    expect(propBlockMatch).not.toBeNull();
    const propBlock = propBlockMatch ? propBlockMatch[1] : '';
    expect(propBlock).toContain('inherits: false');
  });

  test('@property --angle has initial-value: 0deg', () => {
    const propBlockMatch = styleContent.match(/@property\s+--angle\s*\{([^}]*)\}/);
    expect(propBlockMatch).not.toBeNull();
    const propBlock = propBlockMatch ? propBlockMatch[1] : '';
    expect(propBlock).toContain('initial-value: 0deg');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 3 — Label/input association
// Query all label.input-label elements; assert each has a non-empty for
// attribute and a matching id on its associated control.
// On unfixed code htmlFor is '' for all wrapping labels — test FAILS.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 3 — Label/input association', () => {
  let document;

  beforeAll(() => {
    const { JSDOM } = require('jsdom');
    // Parse without running scripts to just inspect the DOM structure
    const dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  test('all label.input-label elements that wrap a control have a non-empty for attribute', () => {
    const labels = document.querySelectorAll('label.input-label');
    expect(labels.length).toBeGreaterThan(0);

    // Filter to labels that wrap an input, select, or textarea
    const wrappingLabels = [...labels].filter(label =>
      label.querySelector('input, select, textarea') !== null
    );

    expect(wrappingLabels.length).toBeGreaterThan(0);

    wrappingLabels.forEach(label => {
      // On unfixed code, htmlFor is '' for all wrapping labels
      expect(label.htmlFor).not.toBe('');
    });
  });

  test('all label.input-label elements that wrap a control have a matching id on the control', () => {
    const labels = document.querySelectorAll('label.input-label');

    const wrappingLabels = [...labels].filter(label =>
      label.querySelector('input, select, textarea') !== null
    );

    wrappingLabels.forEach(label => {
      const control = label.querySelector('input, select, textarea');
      // On unfixed code, control.id is '' for all wrapped controls
      expect(control.id).not.toBe('');
      // The for attribute should match the control's id
      expect(label.htmlFor).toBe(control.id);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 4 — Shimmer keyframe positions
// Parse @keyframes shimmer; assert the 0% frame uses background-position: 0% 50%
// and the 100% frame uses background-position: 100% 50%.
// On unfixed code the values are 200% 0 / -200% 0 — test FAILS.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 4 — Shimmer keyframe positions', () => {
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
  const styleContent = styleMatch ? styleMatch[1] : '';

  // Extract the @keyframes shimmer block
  const shimmerMatch = styleContent.match(/@keyframes\s+shimmer\s*\{([\s\S]*?)\}/);
  const shimmerBlock = shimmerMatch ? shimmerMatch[1] : '';

  test('@keyframes shimmer 0% frame uses background-position: 0% 50%', () => {
    expect(shimmerBlock).toMatch(/0%\s*\{[^}]*background-position:\s*0%\s*50%/);
  });

  test('@keyframes shimmer 100% frame uses background-position: 100% 50%', () => {
    expect(shimmerBlock).toMatch(/100%\s*\{[^}]*background-position:\s*100%\s*50%/);
  });

  test('@keyframes shimmer does NOT use the buggy 200% 0 value', () => {
    // On unfixed code: 0%{background-position:200% 0}
    expect(shimmerBlock).not.toContain('200% 0');
  });

  test('@keyframes shimmer does NOT use the buggy -200% 0 value', () => {
    // On unfixed code: 100%{background-position:-200% 0}
    expect(shimmerBlock).not.toContain('-200% 0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 5 — Polling interval body
// Assert the setInterval if-body contains a gql() call.
// On unfixed code the if body is empty (comment only) — test FAILS.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 5 — Polling interval body', () => {
  test('gql is called when notifications page is active and token is present', () => {
    // Static analysis: extract the setInterval callback body from the script block
    // and assert the if-body contains a gql() call.
    //
    // The script block is the last <script> tag before </body>
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
    const scriptContent = scriptMatch ? scriptMatch[1] : '';

    // Find the setInterval block
    const setIntervalMatch = scriptContent.match(
      /setInterval\s*\(\s*async\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*15000\s*\)/
    );

    expect(setIntervalMatch).not.toBeNull();
    const intervalBody = setIntervalMatch ? setIntervalMatch[1] : '';

    // Find the if block body (the part after the condition check)
    const ifBodyMatch = intervalBody.match(
      /if\s*\(token\s*&&[^)]+\)\s*\{([\s\S]*?)\}/
    );

    expect(ifBodyMatch).not.toBeNull();
    const ifBody = ifBodyMatch ? ifBodyMatch[1] : '';

    // The if body should contain a gql() call
    // On unfixed code: the body contains only a comment — test FAILS
    expect(ifBody).toMatch(/gql\s*\(/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 6 — Cross-browser network error detection
// Mock fetch to throw new TypeError('NetworkError when attempting to fetch
// resource.') (Firefox message); call gql('{ test }'); assert the
// "Could not connect to Gateway!" toast was shown.
// On unfixed code the condition err.message !== 'Failed to fetch' is true
// so the toast is NOT shown — test FAILS.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 6 — Cross-browser network error detection', () => {
  test('shows "Could not connect to Gateway!" toast for Firefox network error', async () => {
    const { JSDOM } = require('jsdom');

    // Inject a spy on the toast function to capture calls.
    // We patch the HTML to wrap toast after it's defined.
    const patchedHtml = htmlContent.replace(
      '// Polling simulation for WebSockets / real-time',
      `// Spy: wrap toast to track calls
      const __origToast = toast;
      window.toast = function(msg, type) {
        window.__toastCalls = window.__toastCalls || [];
        window.__toastCalls.push({ msg, type });
        return __origToast.apply(this, arguments);
      };
      // Polling simulation for WebSockets / real-time`
    );

    const dom = new JSDOM(patchedHtml, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      beforeParse(window) {
        // Mock fetch to throw Firefox-style network error
        window.fetch = () => Promise.reject(
          new TypeError('NetworkError when attempting to fetch resource.')
        );

        // Mock THREE.js to prevent initialization errors
        window.THREE = {
          WebGLRenderer: jest.fn().mockReturnValue({
            setSize: jest.fn(),
            render: jest.fn(),
            setPixelRatio: jest.fn(),
            domElement: { style: {} },
          }),
          Scene: jest.fn().mockReturnValue({ add: jest.fn(), background: null }),
          PerspectiveCamera: jest.fn().mockReturnValue({
            position: { z: 0 },
            aspect: 1,
            updateProjectionMatrix: jest.fn(),
          }),
          BufferGeometry: jest.fn().mockReturnValue({ setAttribute: jest.fn() }),
          Float32BufferAttribute: jest.fn(),
          BufferAttribute: jest.fn(),
          PointsMaterial: jest.fn().mockReturnValue({}),
          Points: jest.fn().mockReturnValue({}),
          LineBasicMaterial: jest.fn().mockReturnValue({}),
          Line: jest.fn().mockReturnValue({}),
          SphereGeometry: jest.fn().mockReturnValue({}),
          MeshBasicMaterial: jest.fn().mockReturnValue({}),
          Mesh: jest.fn().mockReturnValue({ position: { set: jest.fn() } }),
          Color: jest.fn(),
          Vector3: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
          AdditiveBlending: 2,
        };

        // Mock requestAnimationFrame
        window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
        window.cancelAnimationFrame = (id) => clearTimeout(id);
      }
    });

    const { window } = dom;

    // Wait for scripts to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Call gql with the Firefox network error mock
    if (typeof window.gql === 'function') {
      await window.gql('{ test }');
    }

    // Check if the network error toast was shown
    const toastCalls = window.__toastCalls || [];
    const networkErrorToast = toastCalls.find(
      call => call.msg === 'Could not connect to Gateway!' && call.type === 'error'
    );

    // On unfixed code: err.message !== 'Failed to fetch' is TRUE for Firefox error,
    // so console.error is called instead of toast — test FAILS on unfixed code
    expect(networkErrorToast).toBeDefined();
  });
});
